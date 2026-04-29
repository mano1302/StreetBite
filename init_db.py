"""
Database initialization script.

Run this to:
1. Create the database schema
2. Import existing data from data/stalls.json

Usage:
    python init_db.py
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from database import db

def main():
    json_path = os.path.join(os.path.dirname(__file__), 'data', 'stalls.json')

    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found!")
        print("Database schema created, but no data to import.")
        return

    print(f"Importing data from {json_path}...")

    try:
        db.import_from_json(json_path)
        print("Database initialized successfully!")
        print(f"Database file: {db.sqlite_path}")

        # Show imported data summary
        stalls = db.get_all_stalls()
        print(f"\nImported {len(stalls)} stalls:")
        for stall in stalls:
            print(f"  - {stall['name']} ({stall['category']}) - {len(stall['menu'])} menu items, {len(stall['reviews'])} reviews")

    except Exception as e:
        print(f"Error importing data: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
