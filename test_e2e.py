#!/usr/bin/env python3
"""
Quick start script to test the SAMANWAY system end-to-end.
Run this after docker-compose is up and healthy.
"""

import json
import requests
import sys
from pathlib import Path

BASE_URLS = {
    "ingestion": "http://localhost:8001",
    "matching": "http://localhost:8002",
    "writeback": "http://localhost:8003",
    "analytics": "http://localhost:8004"
}

def test_health():
    """Test all services are healthy."""
    print("\n[TEST 1] Health checks...")
    for service, url in BASE_URLS.items():
        try:
            res = requests.get(f"{url}/health", timeout=2)
            if res.status_code == 200:
                print(f"  ✓ {service}: OK")
            else:
                print(f"  ✗ {service}: HTTP {res.status_code}")
                return False
        except Exception as e:
            print(f"  ✗ {service}: {e}")
            return False
    return True

def test_ingestion_text():
    """Test text ingestion."""
    print("\n[TEST 2] Text ingestion (Free-Text DPR)...")
    
    payload = {
        "text": "Piping discipline: Spool erection at Sector 4 completed. 24-inch main feedline spol #PL-001 erected and fit-up done. Welding inspection passed.",
        "source_document": "DPR_2026-09-04.txt",
        "default_date": "2026-09-04"
    }
    
    try:
        res = requests.post(
            f"{BASE_URLS['ingestion']}/ingest/text",
            json=payload,
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            print(f"  ✓ Extracted {data['total_events']} events")
            for i, event in enumerate(data['events'][:2]):
                print(f"    Event {i+1}: {event['activity_phrase'][:50]}... ({event['discipline']})")
            return data
        else:
            print(f"  ✗ HTTP {res.status_code}: {res.text}")
            return None
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return None

def test_load_schedule():
    """Load schedule into matching engine."""
    print("\n[TEST 3] Load L6 schedule...")
    
    csv_path = Path(__file__).parent / "shared" / "sample-data" / "l6_schedule.csv"
    
    if not csv_path.exists():
        print(f"  ✗ Schedule file not found: {csv_path}")
        return False
    
    try:
        with open(csv_path, "rb") as f:
            res = requests.post(
                f"{BASE_URLS['matching']}/schedule/load",
                files={"file": f},
                timeout=10
            )
        
        if res.status_code == 200:
            data = res.json()
            print(f"  ✓ {data['message']}")
            return True
        else:
            print(f"  ✗ HTTP {res.status_code}: {res.text}")
            return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def test_matching():
    """Test matching endpoint."""
    print("\n[TEST 4] Match events to schedule...")
    
    payload = {
        "extracted_events": [
            {
                "activity_phrase": "Spool erection completed",
                "discipline": "piping",
                "tag_or_line_id": "24-PL-001",
                "location": "Sector 4",
                "event_type": "finish",
                "event_date": "2026-09-04",
                "quantity": 1,
                "unit": "spool",
                "contractor": "L&T",
                "delay_reason": None,
                "source_document": "DPR_2026-09-04.txt",
                "source_excerpt": "Spool erection at Sector 4 completed",
                "input_format": "free_text",
                "raw_confidence_hint": 0.95
            }
        ]
    }
    
    try:
        res = requests.post(
            f"{BASE_URLS['matching']}/match",
            json=payload,
            timeout=10
        )
        
        if res.status_code == 200:
            data = res.json()
            print(f"  ✓ Matched events")
            for i, match in enumerate(data.get('results', [])[:2]):
                print(f"    Match {i+1}: {match.get('matched_activity_id', 'N/A')} (confidence: {match.get('top_confidence', 0):.2f})")
            return True
        else:
            print(f"  ✗ HTTP {res.status_code}: {res.text}")
            return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def test_voice_ingestion():
    """Test voice transcript ingestion."""
    print("\n[TEST 5] Voice transcript ingestion...")
    
    payload = {
        "transcript": "Piping discipline, Sector 4. Spool P-401, the 24-inch main line, erection finished. Fit-up complete, welding joints ready for inspection.",
        "source_document": "supervisor_audio_2026-09-04.wav",
        "default_date": "2026-09-04"
    }
    
    try:
        res = requests.post(
            f"{BASE_URLS['ingestion']}/ingest/voice",
            json=payload,
            timeout=10
        )
        
        if res.status_code == 200:
            data = res.json()
            print(f"  ✓ Extracted {data['total_events']} events from voice")
            return True
        else:
            print(f"  ✗ HTTP {res.status_code}: {res.text}")
            return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("SAMANWAY End-to-End Test Suite")
    print("=" * 60)
    
    if not test_health():
        print("\n✗ Health checks failed. Ensure all services are running:")
        print("  docker-compose up -d")
        return False
    
    if not test_load_schedule():
        print("\n✗ Schedule load failed")
        return False
    
    if not test_ingestion_text():
        print("\n✗ Text ingestion failed")
        return False
    
    if not test_voice_ingestion():
        print("\n✗ Voice ingestion failed")
        return False
    
    if not test_matching():
        print("\n✗ Matching failed")
        return False
    
    print("\n" + "=" * 60)
    print("✓ ALL TESTS PASSED")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Start the React frontends: npm run dev (in apps/review-console)")
    print("  2. Access the UI at http://localhost:5173")
    print("  3. Load sample data via API or UI")
    print("  4. Review and approve matches in the console")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
