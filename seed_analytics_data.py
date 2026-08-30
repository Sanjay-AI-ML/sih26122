#!/usr/bin/env python3
"""Seed analytics database with sample data"""

import sqlite3
import os
from datetime import datetime, timedelta
import random

DB_PATH = os.path.join(os.path.dirname(__file__), "services", "writeback", "setu.db")

def seed_database():
    """Create database and populate with sample audit log data"""

    # Ensure directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create audit_log table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY,
            activity_id TEXT,
            discipline TEXT,
            event_date TEXT,
            quantity REAL,
            unit TEXT,
            confidence_score REAL,
            was_ambiguous BOOLEAN,
            status TEXT,
            delay_reason TEXT,
            source_document TEXT,
            source_excerpt TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Clear existing data
    cursor.execute("DELETE FROM audit_log")

    # Sample disciplines and activities
    disciplines = ["Piping", "Civil", "Electrical", "Instrumentation", "Static/Rotating"]
    statuses = ["approved", "rejected"]

    today = datetime.now()
    base_date = today - timedelta(days=30)

    # Insert 50 sample records
    for i in range(50):
        activity_id = f"ACT-{1000 + i}"
        discipline = random.choice(disciplines)
        event_date = (base_date + timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d")
        quantity = round(random.uniform(10, 500), 2)
        unit = "m" if discipline == "Piping" else "units"
        confidence_score = random.uniform(60, 98)
        was_ambiguous = random.choice([0, 1])
        status = random.choice(statuses)
        delay_reason = "Weather delay" if random.random() > 0.7 else "Resource shortage" if random.random() > 0.6 else None
        source_document = f"DPR-{today.strftime('%Y%m%d')}-{i:03d}"
        source_excerpt = f"Activity {activity_id}: {quantity} {unit} completed in {discipline}"

        cursor.execute("""
            INSERT INTO audit_log
            (activity_id, discipline, event_date, quantity, unit, confidence_score,
             was_ambiguous, status, delay_reason, source_document, source_excerpt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            activity_id, discipline, event_date, quantity, unit, confidence_score,
            was_ambiguous, status, delay_reason, source_document, source_excerpt
        ))

    conn.commit()
    conn.close()

    print(f"✓ Database seeded at {DB_PATH}")
    print(f"✓ Inserted 50 sample records")
    print(f"✓ Disciplines: {', '.join(disciplines)}")

if __name__ == "__main__":
    seed_database()
