"""
RAG Domain Knowledge Retriever for Setu Ingestion Service (SIH26122 - Member A).
Provides context retrieval, engineering taxonomy grounding, abbreviation resolution,
synonym expansion, and prompt context formatting for LLM / SLM extraction.
Integrates MultiStageRetriever for three-stage lexical, semantic, and metadata retrieval.
"""

import re
from typing import Dict, List, Optional, Any, Set, Tuple

from services.ingestion.multi_stage_retriever import MultiStageRetriever


# Engineering Domain Taxonomy and Knowledge Base
DEFAULT_DISCIPLINE_TERMS: Dict[str, List[str]] = {
    "piping": [
        "spool erection", "spool fabrication", "spool welding", "pipe welding",
        "hydrotest", "hydrostatic test", "flange torquing", "tie-in", "pipe rack",
        "valve erection", "fit-up", "radiography", "ndt inspection", "pipe support",
        "insulation", "wrapping", "coating", "line hydrotest", "joint welding",
        "blind installation", "valve testing", "golden joint", "stress relieving"
    ],
    "civil": [
        "excavation", "foundation", "concrete pouring", "rebar binding", "shuttering",
        "piling", "backfilling", "compaction", "grading", "raft foundation",
        "pedestal casting", "culvert", "plinth beam", "paving", "drain construction",
        "blast wall", "structural steel erection", "earthwork", "soil stabilization"
    ],
    "static_rotating": [
        "equipment erection", "pump alignment", "compressor installation",
        "vessel erection", "heat exchanger box-up", "coupling alignment",
        "baseplate grouting", "nozzle orientation", "lube oil flushing",
        "turbine overhaul", "motor solo run", "skid installation", "agitator mounting"
    ],
    "electrical": [
        "cable pulling", "cable termination", "cable tray installation",
        "transformer erection", "switchgear testing", "substation energization",
        "earthing pit", "cable glanding", "mcc panel erection", "busduct installation",
        "lighting fixtures", "ups commissioning", "dg set synchronization"
    ],
    "instrumentation": [
        "transmitter calibration", "control valve overhaul", "impulse piping",
        "loop check", "plc marshalling", "dcs integration", "sensor mounting",
        "cable glanding", "scada telemetry", "junction box termination",
        "flowmeter verification", "rtd installation"
    ],
    "hse": [
        "toolbox talk", "hse briefing", "safety audit", "work permit",
        "near miss reporting", "spill containment", "ppe inspection",
        "fire safety drill", "scaffolding tag inspection", "gas testing"
    ]
}

# Domain Abbreviations Glossary
DEFAULT_ABBREVIATIONS: Dict[str, str] = {
    "HSE": "Health, Safety, and Environment",
    "NDT": "Non-Destructive Testing",
    "T&C": "Testing and Commissioning",
    "L&T": "Larsen & Toubro",
    "DPR": "Daily Progress Report",
    "P&ID": "Piping and Instrumentation Diagram",
    "RT": "Radiographic Testing",
    "UT": "Ultrasonic Testing",
    "MPT": "Magnetic Particle Testing",
    "MPI": "Magnetic Particle Inspection",
    "DPT": "Dye Penetrant Testing",
    "PWHT": "Post-Weld Heat Treatment",
    "HVAC": "Heating, Ventilation, and Air Conditioning",
    "MCC": "Motor Control Center",
    "DCS": "Distributed Control System",
    "PLC": "Programmable Logic Controller",
    "SCADA": "Supervisory Control and Data Acquisition",
    "EIL": "Engineers India Limited",
    "BHEL": "Bharat Heavy Electricals Limited",
    "IOCL": "Indian Oil Corporation Limited",
    "ONGC": "Oil and Natural Gas Corporation",
    "OIL": "Oil India Limited",
    "EOT": "Electric Overhead Travelling",
    "WBS": "Work Breakdown Structure",
    "PTW": "Permit to Work",
    "JSA": "Job Safety Analysis",
    "CS": "Carbon Steel",
    "SS": "Stainless Steel",
    "CW": "Cooling Water",
    "DM": "Demineralized Water",
    "HT": "High Tension",
    "LT": "Low Tension"
}

# Status & Milestone Mapping
STATUS_MAPPINGS: Dict[str, Tuple[str, List[str]]] = {
    "finish": (
        "finish",
        [
            "completed", "complete", "finished", "cleared", "done",
            "hydrotested", "closed", "approved", "commissioned",
            "erected", "energized", "terminated", "poured", "tested",
            "installed", "finish ho gaya", "complete ho gaya", "complete kar diya"
        ]
    ),
    "start": (
        "start",
        [
            "started", "start", "commenced", "initiated", "began",
            "started today", "start ho gaya", "start kiya", "mobilized", "mobilised"
        ]
    ),
    "progress": (
        "progress",
        [
            "ongoing", "in progress", "in-progress", "underway",
            "progressing", "curing", "advancing", "tallying",
            "pulling", "fabricating", "welding", "excavating", "laying"
        ]
    ),
    "delay_stoppage": (
        "delay_stoppage",
        [
            "delayed", "delayed due to", "suspended", "stoppage",
            "held up", "halted", "blocked", "interrupted", "idle",
            "waterlogging", "rain stoppage", "permit hold"
        ]
    )
}

# Canonical Term Normalization Dictionary
CANONICAL_NORMALIZATIONS: Dict[str, str] = {
    "hydro test": "hydrotest",
    "hydro-test": "hydrotest",
    "hydro testing": "hydrotest",
    "hydrostatic test": "hydrotest",
    "hydro-testing": "hydrotest",
    "x-ray": "radiography",
    "x ray": "radiography",
    "xray": "radiography",
    "rt inspection": "radiography",
    "spool fab": "spool fabrication",
    "spool fab.": "spool fabrication",
    "spool erect": "spool erection",
    "spool erect.": "spool erection",
    "cable pull": "cable pulling",
    "cable laying": "cable pulling",
    "rebar tie": "rebar binding",
    "rebar fixing": "rebar binding",
    "t & c": "testing and commissioning",
    "t&c": "testing and commissioning",
    "p & id": "p&id",
    "p and id": "p&id",
    "l & t": "L&T",
    "l and t": "L&T",
    "concrete pour": "concrete pouring",
    "concreting": "concrete pouring",
    "transformer yard": "substation",
    "loop checking": "loop check"
}

# Term Synonyms Dictionary
TERM_SYNONYMS: Dict[str, List[str]] = {
    "spool fabrication": [
        "spool welding", "pipe welding", "pipe spool fabrication",
        "piping pre-fabrication", "shop fabrication"
    ],
    "spool erection": [
        "pipe erection", "spool installation", "piping alignment",
        "pipe rack erection", "field fit-up"
    ],
    "hydrotest": [
        "hydrostatic test", "pressure test", "leak test",
        "hydraulic pressure test"
    ],
    "cable pulling": [
        "cable laying", "cable routing", "conductor pulling", "cable installation"
    ],
    "cable termination": [
        "cable glanding and termination", "lug termination", "terminal connection"
    ],
    "concrete pouring": [
        "concreting", "concrete casting", "pour", "cement pouring"
    ],
    "rebar binding": [
        "reinforcement binding", "rebar placement", "rebar fixing", "steel tying"
    ],
    "pump alignment": [
        "motor alignment", "shaft alignment", "dial gauge alignment", "pump-motor coupling"
    ],
    "loop check": [
        "loop testing", "instrument loop verification", "signal check", "continuity check"
    ],
    "hse briefing": [
        "toolbox talk", "safety meeting", "safety induction", "pep talk", "tbt"
    ]
}

# Few-shot Context Examples by Discipline
DISCIPLINE_EXAMPLES: Dict[str, List[str]] = {
    "piping": [
        "24-inch cooling water line spool erection completed at Pipe Rack PR-05.",
        "Hydrotesting of line 12-CS-104 completed successfully with zero leaks."
    ],
    "civil": [
        "Raft concrete pouring completed for TK-101 foundation (45 m3 poured).",
        "Excavation and soil compaction ongoing for Substation transformer pad."
    ],
    "static_rotating": [
        "Completed baseplate grouting and shaft alignment of crude charge pump P-201A.",
        "Heat exchanger E-102 tube bundle box-up and torque tightening done."
    ],
    "electrical": [
        "Cable pulling of 350 meters for 11kV main feeder in substation complete.",
        "Completed glanding and termination for MCC panel feeder 04."
    ],
    "instrumentation": [
        "Loop check and calibration of pressure transmitter PT-101 completed.",
        "Impulse pipe fabrication and pressure test for control valve CV-302 done."
    ],
    "hse": [
        "Conducted HSE briefing and toolbox talk on working at heights for 40 workers.",
        "Safety audit and work permit validation cleared for hot work in Unit 02."
    ]
}


class RAGRetriever:
    """
    Domain knowledge retriever that augments extraction models with
    Oil & Gas engineering taxonomy, abbreviations, synonym graphs, and status semantics.
    Integrated with MultiStageRetriever for three-stage retrieval.
    """

    def __init__(
        self,
        discipline_terms: Optional[Dict[str, List[str]]] = None,
        abbreviations: Optional[Dict[str, str]] = None,
        canonical_normalizations: Optional[Dict[str, str]] = None,
        synonyms: Optional[Dict[str, List[str]]] = None,
        discipline_examples: Optional[Dict[str, List[str]]] = None,
        multi_stage_retriever: Optional[MultiStageRetriever] = None
    ):
        self.discipline_terms = discipline_terms or DEFAULT_DISCIPLINE_TERMS
        self.abbreviations = abbreviations or DEFAULT_ABBREVIATIONS
        self.canonical_normalizations = canonical_normalizations or CANONICAL_NORMALIZATIONS
        self.synonyms = synonyms or TERM_SYNONYMS
        self.discipline_examples = discipline_examples or DISCIPLINE_EXAMPLES
        self.multi_stage = multi_stage_retriever or MultiStageRetriever()

    def normalize_term(self, term: str) -> str:
        """
        Normalizes a term to its canonical engineering representation.
        Example: 'hydro test' -> 'hydrotest'
        """
        if not term:
            return ""
        normalized = term.strip().lower()
        if normalized in self.canonical_normalizations:
            return self.canonical_normalizations[normalized]
        cleaned = re.sub(r"\s+", " ", normalized)
        if cleaned in self.canonical_normalizations:
            return self.canonical_normalizations[cleaned]
        return normalized

    def find_synonyms(self, term: str, max_results: int = 5) -> List[str]:
        """
        Finds domain synonyms for a given engineering term or activity.
        Example: 'spool fabrication' -> ['spool welding', 'pipe welding', ...]
        """
        if not term:
            return []

        norm = self.normalize_term(term).lower()
        
        if norm in self.synonyms:
            return self.synonyms[norm][:max_results]

        for key, syn_list in self.synonyms.items():
            if key in norm or norm in key:
                return syn_list[:max_results]
            for syn in syn_list:
                if norm == syn.lower() or norm in syn.lower():
                    all_syns = [k for k in [key] + syn_list if k.lower() != norm]
                    return all_syns[:max_results]

        return []

    def detect_discipline(self, text: str) -> Optional[str]:
        """
        Detects primary discipline based on keyword frequencies and domain weighting.
        """
        if not text:
            return None

        text_lower = text.lower()
        discipline_scores: Dict[str, int] = {d: 0 for d in self.discipline_terms}

        for disc, terms in self.discipline_terms.items():
            for term in terms:
                if term.lower() in text_lower:
                    discipline_scores[disc] += len(term.split()) * 2
            if disc in text_lower:
                discipline_scores[disc] += 3

        max_score = 0
        detected = None
        for disc, score in discipline_scores.items():
            if score > max_score:
                max_score = score
                detected = disc

        return detected

    def extract_abbreviations(self, text: str) -> Dict[str, str]:
        """
        Extracts known abbreviations found within the input text and resolves definitions.
        """
        if not text:
            return {}

        found: Dict[str, str] = {}
        tokens = set(re.findall(r"\b[A-Za-z0-9&]{2,10}\b", text))

        for abbr, definition in self.abbreviations.items():
            if abbr in tokens or abbr.upper() in tokens:
                found[abbr] = definition
            elif re.search(rf"\b{re.escape(abbr)}\b", text, re.IGNORECASE):
                found[abbr] = definition

        return found

    def extract_status_terms(self, text: str) -> List[Dict[str, str]]:
        """
        Identifies progress/status words in the text and maps them to standard event types.
        Example: 'completed' -> {'term': 'completed', 'event_type': 'finish'}
        """
        if not text:
            return []

        text_lower = text.lower()
        results: List[Dict[str, str]] = []
        seen_terms = set()

        for event_type, (std_type, keywords) in STATUS_MAPPINGS.items():
            for kw in keywords:
                if kw in text_lower and kw not in seen_terms:
                    results.append({
                        "term": kw,
                        "event_type": std_type
                    })
                    seen_terms.add(kw)

        return results

    def retrieve_context(self, query: str) -> Dict[str, Any]:
        """
        Retrieves domain context given an input text string or progress note.
        Integrates multi-stage retrieval with metadata filtering.
        """
        if not query or not query.strip():
            return {
                "discipline": None,
                "terms": [],
                "abbreviations": {},
                "status_terms": [],
                "examples": [],
                "synonyms": {},
                "matched_activities": []
            }

        text = query.strip()
        discipline = self.detect_discipline(text)
        abbreviations = self.extract_abbreviations(text)
        status_terms = self.extract_status_terms(text)

        matched_terms: List[str] = []
        synonym_map: Dict[str, List[str]] = {}

        if discipline and discipline in self.discipline_terms:
            text_lower = text.lower()
            for term in self.discipline_terms[discipline]:
                if term.lower() in text_lower:
                    matched_terms.append(term)
                    syns = self.find_synonyms(term)
                    if syns:
                        synonym_map[term] = syns

        if not matched_terms:
            text_lower = text.lower()
            for disc, terms in self.discipline_terms.items():
                for term in terms:
                    if term.lower() in text_lower and term not in matched_terms:
                        matched_terms.append(term)
                        if not discipline:
                            discipline = disc

        examples = self.discipline_examples.get(discipline, []) if discipline else []

        # Execute three-stage retrieval with filtering
        matched_activities = self.multi_stage.retrieve_with_filtering(text, top_k=5)

        return {
            "discipline": discipline,
            "terms": matched_terms,
            "abbreviations": abbreviations,
            "status_terms": status_terms,
            "examples": examples,
            "synonyms": synonym_map,
            "matched_activities": matched_activities
        }

    def format_context_for_prompt(self, context: Any) -> str:
        """
        Formats retrieved domain context into a clean markdown/text block for LLM prompt injection.
        """
        if isinstance(context, str):
            context = self.retrieve_context(context)

        if not isinstance(context, dict):
            return ""

        lines = [
            "RELEVANT ENGINEERING TERMINOLOGY:",
            f"- Discipline: {context.get('discipline') or 'general_engineering'}"
        ]

        terms = context.get("terms", [])
        if terms:
            lines.append(f"- Domain Terms: {', '.join(terms)}")
        else:
            lines.append("- Domain Terms: None identified")

        abbreviations = context.get("abbreviations", {})
        if abbreviations:
            abbr_str = ", ".join(f"{k} = {v}" for k, v in abbreviations.items())
            lines.append(f"- Abbreviations: {abbr_str}")
        else:
            lines.append("- Abbreviations: None")

        status_terms = context.get("status_terms", [])
        if status_terms:
            status_str = ", ".join(f"'{s['term']}' ({s['event_type']})" for s in status_terms)
            lines.append(f"- Status Terms: {status_str}")
        else:
            lines.append("- Status Terms: None")

        examples = context.get("examples", [])
        if examples:
            lines.append("- Reference Examples:")
            for ex in examples:
                lines.append(f"  * {ex}")

        matched_activities = context.get("matched_activities", [])
        if matched_activities:
            lines.append("- Matched Schedule Activities:")
            for act in matched_activities[:3]:
                lines.append(f"  * [{act.get('id')}] {act.get('activity_name')} (Score: {act.get('ensemble_score', 0.0):.2f})")

        return "\n".join(lines)
