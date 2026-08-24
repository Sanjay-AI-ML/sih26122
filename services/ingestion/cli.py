"""
Interactive CLI for Setu Ingestion Service (SIH26122 - Member A).
Run from terminal: python -m services.ingestion.cli <filepath_or_text>
"""

import argparse
import json
import sys
from pathlib import Path

from services.ingestion.engine import IngestionEngine


def main():
    parser = argparse.ArgumentParser(
        description="Setu Ingestion CLI - Parse engineering reports, spreadsheets, PDFs, voice into structured L5/L6 events"
    )
    parser.add_argument("input_path", nargs="?", help="Path to input file (.txt, .pdf, .csv, .xlsx, .wav, .jpg)")
    parser.add_argument("--text", "-t", help="Direct text input string")
    parser.add_argument("--date", "-d", help="Default event date (YYYY-MM-DD)")
    parser.add_argument("--llm", action="store_true", help="Use schema-constrained LLM/SLM extraction")
    parser.add_argument("--json", action="store_true", help="Output raw JSON array")
    parser.add_argument("--export", "-o", help="Export extracted events to output JSON file")

    args = parser.parse_args()
    engine = IngestionEngine()

    if args.text:
        if args.llm:
            events = engine.ingest_with_llm(args.text, default_date=args.date)
        else:
            events = engine.ingest_text(args.text, default_date=args.date)
        source_name = "cli_text_input"
    elif args.input_path:
        p = Path(args.input_path)
        if not p.exists():
            print(f"Error: File not found at {args.input_path}")
            sys.exit(1)
        events = engine.ingest_file(p.read_bytes(), p.name, default_date=args.date)
        source_name = p.name
    else:
        # Interactive mode
        print("=" * 70)
        print("  SETU (SIH26122) - Intelligent Ingestion & Extraction Engine")
        print("=" * 70)
        print("Enter report text or voice transcript (press Enter twice to submit):")
        lines = []
        while True:
            try:
                line = input()
                if not line and lines:
                    break
                lines.append(line)
            except EOFError:
                break
        raw_text = "\n".join(lines)
        if not raw_text.strip():
            print("No text provided. Exiting.")
            sys.exit(0)
        events = engine.ingest_text(raw_text, default_date=args.date)
        source_name = "interactive_input"

    if args.json:
        data = [ev.model_dump() for ev in events]
        print(json.dumps(data, indent=2, default=str))
    else:
        print("\n" + "=" * 85)
        print(f"  INGESTION RESULTS: {source_name} | Extracted: {len(events)} event(s)")
        print("=" * 85)
        print(f"{'#':<3} | {'Discipline':<15} | {'Tag / Line ID':<16} | {'Status':<10} | {'Qty / Unit':<14} | {'Date':<10} | {'Conf'}")
        print("-" * 85)
        for i, ev in enumerate(events, 1):
            qty_str = f"{ev.quantity} {ev.unit}" if ev.quantity is not None else "-"
            tag_str = ev.tag_or_line_id or "-"
            conf_str = f"{int(ev.raw_confidence_hint * 100)}%"
            print(f"{i:<3} | {ev.discipline.value:<15} | {tag_str:<16} | {ev.event_type.value:<10} | {qty_str:<14} | {ev.event_date:<10} | {conf_str}")
            if ev.delay_reason:
                print(f"    --> [DELAY] Cause: {ev.delay_reason}")
        print("=" * 85 + "\n")

    if args.export:
        out_path = Path(args.export)
        data = [ev.model_dump() for ev in events]
        out_path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")
        print(f"Successfully exported {len(events)} events to {out_path.resolve()}")


if __name__ == "__main__":
    main()
