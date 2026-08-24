"""
Configuration and constants for Setu Ingestion Service (SIH26122 - Member A).
"""

from typing import List, Dict, Set

SERVICE_NAME = "setu-ingestion-service"
SERVICE_VERSION = "1.0.0"
SCHEMA_VERSION = "draft-07 / ExtractedEvent-v1"

# Supported file extensions mapped to modality
SUPPORTED_FILE_EXTENSIONS: Dict[str, str] = {
    ".txt": "free_text",
    ".log": "free_text",
    ".dpr": "free_text",
    ".pdf": "pdf",
    ".csv": "spreadsheet",
    ".tsv": "spreadsheet",
    ".xlsx": "spreadsheet",
    ".xls": "spreadsheet",
    ".jpg": "scan",
    ".jpeg": "scan",
    ".png": "scan",
    ".tiff": "scan",
    ".bmp": "scan",
    ".wav": "audio",
    ".mp3": "audio",
    ".m4a": "audio",
    ".ogg": "audio",
    ".flac": "audio",
}

# Discipline taxonomy keywords
DISCIPLINE_KEYWORDS: Dict[str, Set[str]] = {
    "piping": {
        "piping", "spool", "weld", "welding", "hydrotest", "hydrostatic",
        "flange", "pipe rack", "valve", "manifold", "pipeline", "radiography",
        "ndt", "inch-dia", "fit-up", "torquing", "isometric", "p&id", "gasket",
        "blind", "tie-in", "pipe support", "insulation", "wrapping", "coating"
    },
    "civil": {
        "civil", "excavation", "foundation", "concrete", "rebar", "shuttering",
        "plinth", "trench", "earthwork", "raft", "piling", "soil", "compaction",
        "slab", "blast wall", "structural steel", "column", "pedestal", "grading",
        "backfilling", "brickwork", "drain", "road", "paving", "culvert"
    },
    "static_rotating": {
        "pump", "compressor", "heat exchanger", "vessel", "tank", "reactor",
        "column", "turbine", "motor", "blower", "agitator", "alignment",
        "grouting", "nozzle", "internals", "e-102", "tk-101", "p-201", "c-301",
        "lube oil", "impeller", "coupling", "skid", "mechanical"
    },
    "electrical": {
        "electrical", "transformer", "switchgear", "substation", "cable tray",
        "cabling", "cable pulling", "termination", "mcc", "panel", "earthing",
        "lighting", "ups", "generator", "busduct", "ht cable", "lt cable", "dg set"
    },
    "instrumentation": {
        "instrumentation", "transmitter", "plc", "dcs", "scada", "control valve",
        "junction box", "cable glanding", "loop check", "calibration", "impulse pipe",
        "marshalling cabinet", "flowmeter", "pressure gauge", "sensor", "rtd"
    },
    "hse": {
        "hse", "safety", "incident", "permit", "toolbox", "first aid",
        "spill", "fire", "ppe", "hazard", "near miss", "audit", "training"
    }
}

# Prominent Indian CPSE Infrastructure Contractors
KNOWN_CONTRACTORS: List[str] = [
    "L&T Heavy Engineering",
    "L&T Civil",
    "L&T Construction",
    "Larsen & Toubro",
    "L&T",
    "Punj Lloyd",
    "Bridge & Roof",
    "Tata Projects",
    "BHEL",
    "Engineers India Limited",
    "EIL",
    "Afcons Infrastructure",
    "Kalpataru Projects",
    "Petrofac",
    "Technip Energies",
    "Toyo Engineering",
    "Megha Engineering",
    "MEIL",
    "Shapoorji Pallonji",
    "NCC Limited",
    "Simplex Infrastructures",
    "Hindustan Construction Company",
    "HCC"
]

# Standard unit representations
STANDARD_UNITS = [
    "spools", "joints", "meters", "mtrs", "m", "cum", "m3", "cubic meters",
    "MT", "metric tons", "tons", "nos", "units", "inch-dia", "inch-meter",
    "sqm", "sqft", "km", "kg", "liters", "sets", "bays"
]
