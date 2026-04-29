"""
Database module with SQLite backend and PostgreSQL compatibility.

Usage:
- Local development: Uses SQLite file (stalls.db) automatically
- Production (Render): Set DATABASE_URL environment variable to use PostgreSQL

To migrate to PostgreSQL on Render:
1. Add PostgreSQL add-on in Render dashboard
2. Copy the DATABASE_URL environment variable
3. Uncomment psycopg2-binary in requirements.txt
4. Deploy - the app will automatically use PostgreSQL
"""

import os
import json
from datetime import datetime
from contextlib import contextmanager

# Try to import psycopg2 for PostgreSQL support
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    RealDictCursor = None


class Database:
    """Database abstraction supporting both SQLite and PostgreSQL."""

    def __init__(self):
        self.db_url = os.environ.get('DATABASE_URL')
        self.is_postgresql = self.db_url is not None and PSYCOPG2_AVAILABLE
        self.sqlite_path = os.path.join(os.path.dirname(__file__), 'stalls.db')
        self._init_db()

    def _get_connection(self):
        """Get database connection based on configuration."""
        if self.is_postgresql:
            # Fix DATABASE_URL for psycopg2 (Render adds postgres:// but psycopg2 needs postgresql://)
            url = self.db_url.replace('postgres://', 'postgresql://', 1)
            conn = psycopg2.connect(url)
            return conn
        else:
            import sqlite3
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            return conn

    @contextmanager
    def _cursor(self):
        """Context manager for database cursors."""
        conn = self._get_connection()
        try:
            if self.is_postgresql:
                cursor = conn.cursor(cursor_factory=RealDictCursor)
            else:
                cursor = conn.cursor()
            yield cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def _init_db(self):
        """Initialize database schema."""
        with self._cursor() as cursor:
            # Stalls table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS stalls (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    emoji TEXT,
                    area TEXT NOT NULL,
                    address TEXT,
                    contact TEXT NOT NULL,
                    open_time TEXT,
                    close_time TEXT,
                    status TEXT DEFAULT 'closed',
                    rating REAL DEFAULT 0,
                    total_reviews INTEGER DEFAULT 0,
                    today_discount TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Menu items table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS menu_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    stall_id INTEGER NOT NULL,
                    item_name TEXT NOT NULL,
                    price INTEGER NOT NULL,
                    available BOOLEAN DEFAULT TRUE,
                    FOREIGN KEY (stall_id) REFERENCES stalls(id) ON DELETE CASCADE
                )
            ''')

            # Reviews table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS reviews (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    stall_id INTEGER NOT NULL,
                    rating INTEGER NOT NULL,
                    comment TEXT,
                    date TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (stall_id) REFERENCES stalls(id) ON DELETE CASCADE
                )
            ''')

            # Create indexes for better query performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_stalls_category ON stalls(category)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_stalls_area ON stalls(area)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_stalls_status ON stalls(status)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_menu_items_stall_id ON menu_items(stall_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_reviews_stall_id ON reviews(stall_id)')

    def get_all_stalls(self):
        """Get all stalls with their menu items and reviews."""
        with self._cursor() as cursor:
            cursor.execute('SELECT * FROM stalls ORDER BY id DESC')
            stalls = cursor.fetchall()

            result = []
            for stall in stalls:
                stall_dict = self._row_to_dict(stall)

                # Get menu items
                cursor.execute(
                    'SELECT * FROM menu_items WHERE stall_id = ? ORDER BY id',
                    (stall_dict['id'],)
                )
                stall_dict['menu'] = [self._row_to_dict(m) for m in cursor.fetchall()]

                # Get reviews
                cursor.execute(
                    'SELECT * FROM reviews WHERE stall_id = ? ORDER BY date DESC',
                    (stall_dict['id'],)
                )
                stall_dict['reviews'] = [self._row_to_dict(r) for r in cursor.fetchall()]

                result.append(stall_dict)

            return result

    def get_stall_by_id(self, stall_id):
        """Get a single stall by ID with menu and reviews."""
        with self._cursor() as cursor:
            cursor.execute('SELECT * FROM stalls WHERE id = ?', (stall_id,))
            stall = cursor.fetchone()

            if not stall:
                return None

            stall_dict = self._row_to_dict(stall)

            # Get menu items
            cursor.execute(
                'SELECT * FROM menu_items WHERE stall_id = ? ORDER BY id',
                (stall_id,)
            )
            stall_dict['menu'] = [self._row_to_dict(m) for m in cursor.fetchall()]

            # Get reviews
            cursor.execute(
                'SELECT * FROM reviews WHERE stall_id = ? ORDER BY date DESC',
                (stall_id,)
            )
            stall_dict['reviews'] = [self._row_to_dict(r) for r in cursor.fetchall()]

            return stall_dict

    def add_stall(self, stall_data):
        """Add a new stall."""
        with self._cursor() as cursor:
            cursor.execute('''
                INSERT INTO stalls (name, category, emoji, area, address, contact,
                                   open_time, close_time, status, rating, total_reviews,
                                   today_discount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                stall_data['name'],
                stall_data['category'],
                stall_data.get('emoji'),
                stall_data['area'],
                stall_data.get('address'),
                stall_data['contact'],
                stall_data.get('open_time', '09:00'),
                stall_data.get('close_time', '22:00'),
                stall_data.get('status', 'closed'),
                0,
                0,
                stall_data.get('today_discount')
            ))

            stall_id = cursor.lastrowid

            # Add menu items
            for item in stall_data.get('menu', []):
                cursor.execute('''
                    INSERT INTO menu_items (stall_id, item_name, price, available)
                    VALUES (?, ?, ?, ?)
                ''', (stall_id, item['itemName'], item['price'], item.get('available', True)))

            return self.get_stall_by_id(stall_id)

    def add_review(self, stall_id, review_data):
        """Add a review to a stall."""
        with self._cursor() as cursor:
            cursor.execute('''
                INSERT INTO reviews (stall_id, rating, comment, date)
                VALUES (?, ?, ?, ?)
            ''', (stall_id, review_data['rating'], review_data.get('comment', ''),
                  datetime.now().strftime('%Y-%m-%d')))

            # Update stall rating
            cursor.execute('''
                UPDATE stalls
                SET total_reviews = (SELECT COUNT(*) FROM reviews WHERE stall_id = ?),
                    rating = (SELECT AVG(rating) FROM reviews WHERE stall_id = ?)
                WHERE id = ?
            ''', (stall_id, stall_id, stall_id))

            return self.get_stall_by_id(stall_id)

    def update_stall_status(self, stall_id, status):
        """Update stall open/closed status."""
        with self._cursor() as cursor:
            cursor.execute('''
                UPDATE stalls SET status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (status, stall_id))
            return self.get_stall_by_id(stall_id)

    def update_stall_discount(self, stall_id, discount):
        """Update stall's today discount."""
        with self._cursor() as cursor:
            cursor.execute('''
                UPDATE stalls SET today_discount = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (discount, stall_id))
            return self.get_stall_by_id(stall_id)

    def update_menu_item_availability(self, stall_id, item_index, available):
        """Update a menu item's availability."""
        with self._cursor() as cursor:
            # Get menu items for this stall
            cursor.execute(
                'SELECT id FROM menu_items WHERE stall_id = ? ORDER BY id',
                (stall_id,)
            )
            items = cursor.fetchall()

            if item_index < len(items):
                item_id = items[item_index]['id'] if isinstance(items[item_index], dict) else items[item_index][0]
                cursor.execute('''
                    UPDATE menu_items SET available = ? WHERE id = ?
                ''', (available, item_id))

            return self.get_stall_by_id(stall_id)

    def add_menu_item(self, stall_id, item_data):
        """Add a new menu item to a stall."""
        with self._cursor() as cursor:
            cursor.execute('''
                INSERT INTO menu_items (stall_id, item_name, price, available)
                VALUES (?, ?, ?, ?)
            ''', (stall_id, item_data['itemName'], item_data['price'],
                  item_data.get('available', True)))
            return self.get_stall_by_id(stall_id)

    def update_menu(self, stall_id, menu_data):
        """Update entire menu for a stall."""
        with self._cursor() as cursor:
            # Delete existing menu items
            cursor.execute('DELETE FROM menu_items WHERE stall_id = ?', (stall_id,))

            # Add new menu items
            for item in menu_data:
                cursor.execute('''
                    INSERT INTO menu_items (stall_id, item_name, price, available)
                    VALUES (?, ?, ?, ?)
                ''', (stall_id, item['itemName'], item['price'], item.get('available', True)))

            return self.get_stall_by_id(stall_id)

    def verify_vendor_login(self, stall_id, contact):
        """Verify vendor contact number for login."""
        with self._cursor() as cursor:
            cursor.execute(
                'SELECT * FROM stalls WHERE id = ? AND contact = ?',
                (stall_id, contact)
            )
            stall = cursor.fetchone()
            return stall is not None

    def _row_to_dict(self, row):
        """Convert database row to dictionary."""
        if row is None:
            return None

        if isinstance(row, dict):
            # PostgreSQL with RealDictCursor
            result = dict(row)
        else:
            # SQLite
            result = dict(row)

        # Convert snake_case to camelCase for API response
        mapping = {
            'open_time': 'openTime',
            'close_time': 'closeTime',
            'total_reviews': 'totalReviews',
            'today_discount': 'todayDiscount',
            'item_name': 'itemName',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
        }

        for old_key, new_key in mapping.items():
            if old_key in result:
                result[new_key] = result[old_key]
                del result[old_key]

        return result

    def import_from_json(self, json_path):
        """Import data from JSON file (for migration)."""
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        stalls = data.get('stalls', [])

        for stall in stalls:
            # Check if stall already exists
            existing = self.get_stall_by_id(stall.get('id'))
            if existing:
                continue

            self.add_stall({
                'name': stall['name'],
                'category': stall['category'],
                'emoji': stall.get('emoji'),
                'area': stall['area'],
                'address': stall.get('address'),
                'contact': stall['contact'],
                'open_time': stall.get('openTime', '09:00'),
                'close_time': stall.get('closeTime', '22:00'),
                'status': stall.get('status', 'closed'),
                'today_discount': stall.get('todayDiscount'),
                'menu': stall.get('menu', [])
            })

            # Add reviews
            for review in stall.get('reviews', []):
                self.add_review(stall['id'], {
                    'rating': review['rating'],
                    'comment': review.get('comment', ''),
                    'date': review.get('date', datetime.now().strftime('%Y-%m-%d'))
                })


# Global database instance
db = Database()
