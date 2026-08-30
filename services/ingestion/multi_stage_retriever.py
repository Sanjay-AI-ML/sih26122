"""
Three-Stage Domain & Schedule Retriever for Setu Ingestion Service (SIH26122 - Member A).

Architecture:
  Stage 1 - LEXICAL (BM25): Fast keyword & fuzzy matching with RapidFuzz (top_k=20).
  Stage 2 - SEMANTIC (Embeddings): Contextual cosine similarity with BGE-M3 / subword vectorizer (top_k=10).
  Stage 3 - METADATA FILTERING: Discipline filtering & activity-type boosting (top_k=5).

Ensemble Scoring:
  ensemble_score = 0.3 * bm25_score + 0.5 * semantic_score + 0.2 * metadata_boost
"""

import re
from typing import Dict, List, Optional, Any, Tuple
import numpy as np
from rapidfuzz import fuzz, process

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# Default domain & schedule activity corpus
DEFAULT_ACTIVITY_CORPUS: List[Dict[str, Any]] = [
    # Piping Activities
    {
        "id": "ACT-PIP-001",
        "activity_name": "Cooling Water Line 24-inch Spool Erection & Fit-up",
        "discipline": "piping",
        "activity_type": "erection",
        "tag": "24-PL-001",
        "description": "24-inch CW cooling line spool erection, pipe rack fit-up and alignment"
    },
    {
        "id": "ACT-PIP-002",
        "activity_name": "Pipe Spool Fabrication and Root Pass TIG Welding",
        "discipline": "piping",
        "activity_type": "welding",
        "tag": "12-CS-104",
        "description": "Shop and field spool welding, joint fabrication, and fit-up inspection"
    },
    {
        "id": "ACT-PIP-003",
        "activity_name": "Hydrotesting and Pressure Hold Test of Utility Header",
        "discipline": "piping",
        "activity_type": "hydrotest",
        "tag": "PL-102C",
        "description": "Hydrostatic pressure testing, leak check, line dewatering and drying"
    },
    {
        "id": "ACT-PIP-004",
        "activity_name": "Flange Bolt Torquing and Valve Erection on Cooling Line",
        "discipline": "piping",
        "activity_type": "erection",
        "tag": "TAG-402",
        "description": "Valve installation, gasket placement, and calibrated torque tightening"
    },
    {
        "id": "ACT-PIP-005",
        "activity_name": "Non-Destructive Testing (NDT) and Radiography (RT) Inspection",
        "discipline": "piping",
        "activity_type": "inspection",
        "tag": "EV-8492A",
        "description": "Welded joint inspection, gamma radiography, dye penetrant, and ultrasonic NDT"
    },
    {
        "id": "ACT-PIP-006",
        "activity_name": "Pipe Rack Structural Support and High-Pressure Spool Laying",
        "discipline": "piping",
        "activity_type": "erection",
        "tag": "PR-05",
        "description": "Pipe rack installation, support clamping, and elevated spool laying"
    },

    # Civil Activities
    {
        "id": "ACT-CIV-001",
        "activity_name": "Earthwork Trench Excavation and Soil Compaction",
        "discipline": "civil",
        "activity_type": "excavation",
        "tag": "SS-01",
        "description": "Site clearing, trench excavation, soil grading, and proctor compaction"
    },
    {
        "id": "ACT-CIV-002",
        "activity_name": "Raft Foundation Concrete Pouring and Curing for Tank",
        "discipline": "civil",
        "activity_type": "concrete_work",
        "tag": "TK-101",
        "description": "Ready-mix concrete pouring, vibratory compaction, and water curing"
    },
    {
        "id": "ACT-CIV-003",
        "activity_name": "Substation Transformer Block Concrete Pouring & Formwork",
        "discipline": "civil",
        "activity_type": "concrete_work",
        "tag": "FOUND-CIV-104",
        "description": "Rebar binding, shuttering formwork, and transformer foundation casting"
    },
    {
        "id": "ACT-CIV-004",
        "activity_name": "Deep Piling and Concrete Pile Cap Casting",
        "discipline": "civil",
        "activity_type": "piling",
        "tag": "P-200A",
        "description": "Bored cast-in-situ piling, reinforcement cage lowering, and pile integrity testing"
    },

    # Static & Rotating Mechanical Activities
    {
        "id": "ACT-MEC-001",
        "activity_name": "Centrifugal Booster Pump P-201A Alignment and Grouting",
        "discipline": "static_rotating",
        "activity_type": "alignment",
        "tag": "P-201A",
        "description": "Dial indicator shaft alignment, baseplate leveling, and non-shrink epoxy grouting"
    },
    {
        "id": "ACT-MEC-002",
        "activity_name": "Gas Compressor C-301 Skid Erection and Lube Oil Flushing",
        "discipline": "static_rotating",
        "activity_type": "installation",
        "tag": "C-301",
        "description": "Heavy compressor skid positioning, anchor bolting, and lube oil circuit flushing"
    },
    {
        "id": "ACT-MEC-003",
        "activity_name": "Shell & Tube Heat Exchanger E-102 Bundle Box-up",
        "discipline": "static_rotating",
        "activity_type": "overhaul",
        "tag": "E-102",
        "description": "Tube bundle insertion, shell cover bolting, and channel head hydrotesting"
    },

    # Electrical Activities
    {
        "id": "ACT-ELE-001",
        "activity_name": "11kV Main Electrical Substation Feeder Cable Pulling",
        "discipline": "electrical",
        "activity_type": "cable_work",
        "tag": "CABLE-ELE-201",
        "description": "High tension cable tray laying, cable pulling through duct banks, and routing"
    },
    {
        "id": "ACT-ELE-002",
        "activity_name": "Motor Control Center (MCC) Panel Cable Glanding & Termination",
        "discipline": "electrical",
        "activity_type": "cable_work",
        "tag": "MCC-01",
        "description": "Cable lug crimping, brass glanding, phase identification, and terminal connection"
    },
    {
        "id": "ACT-ELE-003",
        "activity_name": "Main Substation Power Transformer Energization & Testing",
        "discipline": "electrical",
        "activity_type": "testing",
        "tag": "TR-01",
        "description": "Insulation resistance testing, transformer oil dielectric test, and energization"
    },

    # Instrumentation Activities
    {
        "id": "ACT-INS-001",
        "activity_name": "Pressure Transmitter PT-101 Calibration and Bench Test",
        "discipline": "instrumentation",
        "activity_type": "calibration",
        "tag": "PT-101",
        "description": "5-point dead weight calibration, 4-20mA loop simulation, and Hart protocol test"
    },
    {
        "id": "ACT-INS-002",
        "activity_name": "Pneumatic Control Valve CV-302 Stroke Check and Loop Test",
        "discipline": "instrumentation",
        "activity_type": "loop_check",
        "tag": "CV-302",
        "description": "I/P converter calibration, positioner tuning, stroke time verification, and DCS check"
    },

    # HSE Activities
    {
        "id": "ACT-HSE-001",
        "activity_name": "Daily HSE Briefing, Toolbox Talk & Work Permit Validation",
        "discipline": "hse",
        "activity_type": "briefing",
        "tag": "PTW-01",
        "description": "Safety induction, hazard identification, PPE check, and hot work permit clearance"
    }
]

DISCIPLINE_TAXONOMY: Dict[str, List[str]] = {
    "piping": ["piping", "spool", "weld", "welding", "hydrotest", "flange", "valve", "pipe rack", "radiography", "ndt"],
    "civil": ["civil", "excavation", "foundation", "concrete", "rebar", "shuttering", "piling", "compaction", "grading"],
    "static_rotating": ["pump", "compressor", "heat exchanger", "vessel", "alignment", "grouting", "skid", "mechanical"],
    "electrical": ["electrical", "transformer", "cable", "switchgear", "substation", "pulling", "termination", "mcc", "earthing"],
    "instrumentation": ["instrumentation", "transmitter", "control valve", "loop check", "calibration", "impulse pipe", "plc", "dcs"],
    "hse": ["hse", "safety", "toolbox", "briefing", "permit", "audit", "ppe"]
}

ACTIVITY_TYPE_TAXONOMY: Dict[str, List[str]] = {
    "erection": ["erect", "erection", "fit-up", "fitup", "installation", "laying", "box-up", "mounting"],
    "welding": ["weld", "welding", "fabrication", "joint", "root pass", "tig", "arc", "pre-fabrication"],
    "hydrotest": ["hydrotest", "hydrostatic", "pressure test", "leak test", "hold test"],
    "inspection": ["ndt", "radiography", "rt", "inspection", "audit", "check", "tally", "verification"],
    "excavation": ["excavat", "trench", "earthwork", "grading", "soil", "compaction", "backfill"],
    "concrete_work": ["concrete", "pour", "pouring", "curing", "rebar", "shuttering", "raft", "pedestal", "formwork"],
    "piling": ["piling", "pile", "pile cap", "bored"],
    "cable_work": ["cable", "pulling", "laying", "glanding", "termination", "routing", "crimping"],
    "alignment": ["alignment", "align", "grouting", "leveling", "coupling", "shaft"],
    "calibration": ["calibrat", "bench test", "dead weight", "transmitter", "hart"],
    "loop_check": ["loop", "loop check", "continuity", "stroke check", "simulation"],
    "testing": ["test", "testing", "energization", "hi-pot", "dielectric", "resistance"],
    "briefing": ["briefing", "toolbox", "tbt", "safety meeting", "permit"]
}


class MultiStageRetriever:
    """
    Three-stage retrieval pipeline combining:
      1. Stage 1 (Lexical BM25 via RapidFuzz)
      2. Stage 2 (Semantic Embedding Similarity via BGE-M3 / Vectorizer)
      3. Stage 3 (Metadata Discipline Filtering & Activity-Type Boosting)
    """

    def __init__(
        self,
        corpus: Optional[List[Dict[str, Any]]] = None,
        embedding_model_name: str = "BAAI/bge-m3"
    ):
        self.corpus: List[Dict[str, Any]] = [dict(item) for item in (corpus or DEFAULT_ACTIVITY_CORPUS)]
        self.embedding_model_name = embedding_model_name
        self.sentence_model = None

        # Initialize BGE-M3 if sentence_transformers is available
        if HAS_SENTENCE_TRANSFORMERS:
            try:
                self.sentence_model = SentenceTransformer(embedding_model_name)
            except Exception:
                self.sentence_model = None

        # Initialize fallback subword TF-IDF semantic vectorizer
        self._init_vectorizer()

    def _init_vectorizer(self):
        """Builds corpus document representations and vector space model."""
        self.corpus_docs = [
            f"{item['activity_name']} {item['discipline']} {item.get('activity_type', '')} {item.get('tag', '')} {item.get('description', '')}"
            for item in self.corpus
        ]
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            analyzer="word",
            sublinear_tf=True
        )
        if self.corpus_docs:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus_docs)
        else:
            self.tfidf_matrix = None

    def add_activities(self, activities: List[Dict[str, Any]]):
        """Dynamically appends new activities and reindexes."""
        self.corpus.extend(activities)
        self._init_vectorizer()

    # -------------------------------------------------------------------------
    # STAGE 1: LEXICAL (BM25 / RapidFuzz)
    # -------------------------------------------------------------------------
    def retrieve_bm25(self, text: str, top_k: int = 20) -> List[Dict[str, Any]]:
        """
        Stage 1: Fast keyword and fuzzy string matching.
        Uses RapidFuzz token sorting and partial ratios across activity names and tags.
        Returns top_k=20 candidates with bm25_score (0.0 to 1.0).
        """
        if not text or not text.strip() or not self.corpus:
            return []

        query = text.strip().lower()
        scored_candidates: List[Dict[str, Any]] = []

        for item in self.corpus:
            target_str = f"{item['activity_name']} {item.get('tag', '')} {item['discipline']} {item.get('activity_type', '')}".lower()
            
            # Multi-angle fuzzy scoring
            token_set = fuzz.token_set_ratio(query, target_str)
            token_sort = fuzz.token_sort_ratio(query, target_str)
            partial = fuzz.partial_ratio(query, target_str)
            w_ratio = fuzz.WRatio(query, target_str)

            # Combined lexical score normalized to 0.0 - 1.0
            bm25_raw = max(token_set * 0.4 + token_sort * 0.3 + w_ratio * 0.3, partial * 0.8)
            bm25_score = min(max(bm25_raw / 100.0, 0.0), 1.0)

            cand = dict(item)
            cand["bm25_score"] = round(bm25_score, 4)
            scored_candidates.append(cand)

        # Sort by bm25_score descending
        scored_candidates.sort(key=lambda x: x["bm25_score"], reverse=True)
        return scored_candidates[:top_k]

    # -------------------------------------------------------------------------
    # STAGE 2: SEMANTIC (BGE-M3 / Embeddings)
    # -------------------------------------------------------------------------
    def retrieve_semantic(self, text: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Stage 2: Contextual similarity using dense embeddings (BGE-M3 or vectorizer).
        Scores candidates by cosine similarity in semantic space.
        Returns top_k=10 candidates with semantic_score (0.0 to 1.0).
        """
        if not text or not text.strip() or not self.corpus:
            return []

        query = text.strip()
        scored_candidates: List[Dict[str, Any]] = []

        if self.sentence_model is not None:
            try:
                query_emb = self.sentence_model.encode([query], convert_to_numpy=True)
                corpus_embs = self.sentence_model.encode(self.corpus_docs, convert_to_numpy=True)
                sims = np.dot(query_emb, corpus_embs.T) / (
                    np.linalg.norm(query_emb) * np.linalg.norm(corpus_embs, axis=1) + 1e-9
                )
                sim_scores = sims[0]
            except Exception:
                sim_scores = self._compute_tfidf_similarities(query)
        else:
            sim_scores = self._compute_tfidf_similarities(query)

        for idx, item in enumerate(self.corpus):
            score = float(sim_scores[idx]) if idx < len(sim_scores) else 0.0
            sem_score = min(max(score, 0.0), 1.0)

            cand = dict(item)
            cand["semantic_score"] = round(sem_score, 4)
            scored_candidates.append(cand)

        # Sort by semantic_score descending
        scored_candidates.sort(key=lambda x: x["semantic_score"], reverse=True)
        return scored_candidates[:top_k]

    def _compute_tfidf_similarities(self, query: str) -> np.ndarray:
        """Computes cosine similarity using the subword TF-IDF matrix."""
        if self.tfidf_matrix is None or not self.corpus_docs:
            return np.zeros(len(self.corpus))
        query_vec = self.vectorizer.transform([query])
        sim = cosine_similarity(query_vec, self.tfidf_matrix)
        return sim[0]

    # -------------------------------------------------------------------------
    # STAGE 3: METADATA FILTERING & BOOSTING
    # -------------------------------------------------------------------------
    def detect_metadata(self, text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """
        Extracts metadata signals (discipline, activity_type, tag) from free text.
        """
        text_lower = text.lower()

        # 1. Discipline detection
        detected_discipline = None
        best_disc_score = 0
        for disc, keywords in DISCIPLINE_TAXONOMY.items():
            score = sum(2 for kw in keywords if kw in text_lower)
            if disc in text_lower:
                score += 3
            if score > best_disc_score:
                best_disc_score = score
                detected_discipline = disc

        # 2. Activity type detection
        detected_activity_type = None
        best_act_score = 0
        for act_type, keywords in ACTIVITY_TYPE_TAXONOMY.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > best_act_score:
                best_act_score = score
                detected_activity_type = act_type

        # 3. Engineering tag extraction
        tag_match = re.search(r"\b([0-9]{2,3}-[A-Z]{2,4}-[0-9]{3,4}[A-Z]?|[A-Z]{1,4}-[0-9]{2,4}[A-Z]?)\b", text)
        detected_tag = tag_match.group(1) if tag_match else None

        return detected_discipline, detected_activity_type, detected_tag

    def compute_metadata_boost(
        self,
        candidate: Dict[str, Any],
        detected_discipline: Optional[str],
        detected_activity_type: Optional[str],
        detected_tag: Optional[str]
    ) -> float:
        """
        Calculates metadata boost based on discipline alignment and activity type.
        Boost values range from 0.0 to 1.0.
        """
        boost = 0.0
        cand_disc = candidate.get("discipline", "").lower()
        cand_act_type = candidate.get("activity_type", "").lower()
        cand_tag = candidate.get("tag", "").lower()

        # Discipline match (+0.50)
        if detected_discipline:
            if cand_disc == detected_discipline.lower():
                boost += 0.50
            else:
                boost -= 0.20  # Discipline mismatch penalty

        # Activity type boost (+0.30)
        if detected_activity_type and cand_act_type == detected_activity_type.lower():
            boost += 0.30

        # Exact / partial tag match (+0.20)
        if detected_tag and cand_tag:
            if detected_tag.lower() == cand_tag:
                boost += 0.20
            elif fuzz.partial_ratio(detected_tag.lower(), cand_tag) > 80:
                boost += 0.10

        return min(max(boost, 0.0), 1.0)

    # -------------------------------------------------------------------------
    # SCORING & ENSEMBLE RANKING
    # -------------------------------------------------------------------------
    def score_and_rank(
        self,
        candidates: List[Dict[str, Any]],
        method: str = "ensemble"
    ) -> List[Dict[str, Any]]:
        """
        Combines scores according to the formula:
          Ensemble score = 0.3 * bm25_score + 0.5 * semantic_score + 0.2 * metadata_boost
        Returns candidates sorted by ensemble score descending.
        """
        for cand in candidates:
            bm25 = cand.get("bm25_score", 0.0)
            semantic = cand.get("semantic_score", 0.0)
            meta_boost = cand.get("metadata_boost", 0.0)

            if method == "ensemble":
                ensemble_score = (0.3 * bm25) + (0.5 * semantic) + (0.2 * meta_boost)
            elif method == "bm25":
                ensemble_score = bm25
            elif method == "semantic":
                ensemble_score = semantic
            else:
                ensemble_score = (0.3 * bm25) + (0.5 * semantic) + (0.2 * meta_boost)

            cand["ensemble_score"] = round(min(max(ensemble_score, 0.0), 1.0), 4)
            cand["score"] = cand["ensemble_score"]

        candidates.sort(key=lambda x: x["ensemble_score"], reverse=True)
        return candidates

    # -------------------------------------------------------------------------
    # UNIFIED THREE-STAGE PIPELINE
    # -------------------------------------------------------------------------
    def retrieve_with_filtering(self, text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Executes the full three-stage retrieval pipeline:
          1. Stage 1: Lexical BM25 (top_k=20)
          2. Stage 2: Semantic Embeddings (top_k=10)
          3. Stage 3: Metadata discipline filtering + activity_type boost -> top_k=5
        """
        if not text or not text.strip() or not self.corpus:
            return []

        # Detect metadata signals from text
        detected_disc, detected_act_type, detected_tag = self.detect_metadata(text)

        # Stage 1: Lexical retrieval
        bm25_candidates = self.retrieve_bm25(text, top_k=20)
        bm25_map = {c["id"]: c["bm25_score"] for c in bm25_candidates}

        # Stage 2: Semantic retrieval
        semantic_candidates = self.retrieve_semantic(text, top_k=10)
        semantic_map = {c["id"]: c["semantic_score"] for c in semantic_candidates}

        # Merge candidate pools
        all_candidate_ids = set(bm25_map.keys()).union(set(semantic_map.keys()))
        merged_candidates: List[Dict[str, Any]] = []

        for cid in all_candidate_ids:
            # Find item in corpus
            item = next((c for c in self.corpus if c["id"] == cid), None)
            if not item:
                continue

            cand = dict(item)
            cand["bm25_score"] = bm25_map.get(cid, 0.0)
            cand["semantic_score"] = semantic_map.get(cid, 0.0)
            
            # Compute metadata boost
            cand["metadata_boost"] = round(
                self.compute_metadata_boost(cand, detected_disc, detected_act_type, detected_tag),
                4
            )
            cand["detected_discipline"] = detected_disc
            cand["detected_activity_type"] = detected_act_type

            merged_candidates.append(cand)

        # Stage 3: Ensemble scoring and ranking
        ranked = self.score_and_rank(merged_candidates, method="ensemble")

        # Discipline consistency preference: if discipline was detected with high confidence,
        # prioritize candidates matching that discipline
        if detected_disc:
            disc_matching = [c for c in ranked if c.get("discipline") == detected_disc]
            disc_others = [c for c in ranked if c.get("discipline") != detected_disc]
            ranked = disc_matching + disc_others

        return ranked[:top_k]
