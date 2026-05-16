"""
Database module with SQLite backend and PostgreSQL compatibility.
Shops stored here are visible to ALL users across ALL devices.
Private fields (contact, password_hash) are never exposed in the public API.
"""

import os
import json
import hashlib
import secrets
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
        self.is_postgresql = bool(self.db_url) and PSYCOPG2_AVAILABLE
        # SQLite fallback: use local directory
        data_dir = os.path.dirname(__file__)
        self.sqlite_path = os.path.join(data_dir, 'streetbite_clean.db')
        self._init_db()

    # ------------------------------------------------------------------
    # Connection helpers
    # ------------------------------------------------------------------

    def _get_connection(self):
        """Get database connection based on configuration."""
        if self.is_postgresql:
            # Render gives postgres:// but psycopg2 needs postgresql://
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

    def _ph(self, n=1):
        """Return the correct placeholder(s): %s for PG, ? for SQLite."""
        ph = '%s' if self.is_postgresql else '?'
        if n == 1:
            return ph
        return ', '.join([ph] * n)

    # ------------------------------------------------------------------
    # Schema initialisation
    # ------------------------------------------------------------------

    def _init_db(self):
        """Initialize database schema (works for both PG and SQLite)."""
        with self._cursor() as cursor:
            if self.is_postgresql:
                self._init_postgresql(cursor)
            else:
                self._init_sqlite(cursor)

    def _init_sqlite(self, cursor):
        """SQLite schema."""
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stalls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                emoji TEXT,
                area TEXT NOT NULL,
                address TEXT,
                contact TEXT NOT NULL,
                password_hash TEXT,
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
        try:
            cursor.execute('ALTER TABLE stalls ADD COLUMN password_hash TEXT')
        except Exception:
            pass
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
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_stalls_category ON stalls(category)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_stalls_area ON stalls(area)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_stalls_status ON stalls(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_menu_items_stall_id ON menu_items(stall_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_reviews_stall_id ON reviews(stall_id)')

    def _init_postgresql(self, cursor):
        """PostgreSQL schema."""
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stalls (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                emoji TEXT,
                area TEXT NOT NULL,
                address TEXT,
                contact TEXT NOT NULL,
                password_hash TEXT,
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
        # Add password_hash column if upgrading from old schema
        cursor.execute('''
            DO $$ BEGIN
                ALTER TABLE stalls ADD COLUMN password_hash TEXT;
            EXCEPTION WHEN duplicate_column THEN NULL;
            END $$;
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS menu_items (
                id SERIAL PRIMARY KEY,
                stall_id INTEGER NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,
                item_name TEXT NOT NULL,
                price INTEGER NOT NULL,
                available BOOLEAN DEFAULT TRUE
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                stall_id INTEGER NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,
                rating INTEGER NOT NULL,
                comment TEXT,
                date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_stalls_category ON stalls(category)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_stalls_area ON stalls(area)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_stalls_status ON stalls(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_menu_items_stall_id ON menu_items(stall_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_reviews_stall_id ON reviews(stall_id)')

    # ------------------------------------------------------------------
    # Password helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _hash_password(password):
        """Hash a password using SHA-256 with a salt."""
        salt = secrets.token_hex(16)
        hashed = hashlib.sha256((salt + password).encode()).hexdigest()
        return f"{salt}:{hashed}"

    @staticmethod
    def _verify_password(password, stored_hash):
        """Verify a password against its stored hash."""
        if not stored_hash:
            return False
        try:
            salt, hashed = stored_hash.split(':', 1)
            return hashlib.sha256((salt + password).encode()).hexdigest() == hashed
        except Exception:
            return False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_all_stalls(self):
        """Get all stalls — PUBLIC data only (no contact/password)."""
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute('SELECT * FROM stalls ORDER BY id DESC')
            stalls = cursor.fetchall()

            result = []
            for stall in stalls:
                stall_dict = self._row_to_dict(stall, public=True)

                cursor.execute(
                    f'SELECT * FROM menu_items WHERE stall_id = {ph} ORDER BY id',
                    (stall_dict['id'],)
                )
                stall_dict['menu'] = [self._row_to_dict(m) for m in cursor.fetchall()]

                cursor.execute(
                    f'SELECT * FROM reviews WHERE stall_id = {ph} ORDER BY date DESC',
                    (stall_dict['id'],)
                )
                stall_dict['reviews'] = [self._row_to_dict(r) for r in cursor.fetchall()]

                result.append(stall_dict)

            return result

    def get_stall_by_id(self, stall_id, public=True):
        """Get a single stall by ID. public=True strips private fields."""
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute(f'SELECT * FROM stalls WHERE id = {ph}', (stall_id,))
            stall = cursor.fetchone()

            if not stall:
                return None

            stall_dict = self._row_to_dict(stall, public=public)

            cursor.execute(
                f'SELECT * FROM menu_items WHERE stall_id = {ph} ORDER BY id',
                (stall_id,)
            )
            stall_dict['menu'] = [self._row_to_dict(m) for m in cursor.fetchall()]

            cursor.execute(
                f'SELECT * FROM reviews WHERE stall_id = {ph} ORDER BY date DESC',
                (stall_id,)
            )
            stall_dict['reviews'] = [self._row_to_dict(r) for r in cursor.fetchall()]

            return stall_dict

    def signup_stall(self, stall_data):
        """Register a new stall with a hashed password."""
        password = stall_data.get('password', '')
        if not password or len(password) < 4:
            raise ValueError('Password must be at least 4 characters')

        # Check duplicate contact
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute(f'SELECT id FROM stalls WHERE contact = {ph}', (stall_data['contact'],))
            if cursor.fetchone():
                raise ValueError('A shop with this mobile number is already registered')

        password_hash = self._hash_password(password)
        stall_data['password_hash'] = password_hash
        return self.add_stall(stall_data)

    def login_by_contact(self, contact, password):
        """Login vendor by mobile number + password only (no shop ID needed)."""
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute(f'SELECT * FROM stalls WHERE contact = {ph}', (contact,))
            stall = cursor.fetchone()
            if not stall:
                return None
            row = self._row_to_dict(stall, public=False)
            if not self._verify_password(password, row.get('passwordHash')):
                return None
            return self.get_stall_by_id(row['id'], public=False)

    def vendor_login(self, stall_id, contact, password):
        """Login vendor — verify contact + password. Returns stall dict (private) or None."""
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute(f'SELECT * FROM stalls WHERE id = {ph}', (stall_id,))
            stall = cursor.fetchone()
            if not stall:
                return None
            row = self._row_to_dict(stall, public=False)
            if row.get('contact') != contact:
                return None
            if not self._verify_password(password, row.get('passwordHash')):
                return None
            return self.get_stall_by_id(stall_id, public=False)

    def add_stall(self, stall_data):
        """Add a new stall (internal — use signup_stall for public registration)."""
        ph = '%s' if self.is_postgresql else '?'
        ret = 'RETURNING id' if self.is_postgresql else ''
        with self._cursor() as cursor:
            cursor.execute(f'''
                INSERT INTO stalls (name, category, emoji, area, address, contact,
                                   password_hash, open_time, close_time, status,
                                   rating, total_reviews, today_discount)
                VALUES ({self._ph(13)})
                {ret}
            ''', (
                stall_data['name'],
                stall_data['category'],
                stall_data.get('emoji'),
                stall_data['area'],
                stall_data.get('address'),
                stall_data['contact'],
                stall_data.get('password_hash'),
                stall_data.get('open_time', stall_data.get('openTime', '09:00')),
                stall_data.get('close_time', stall_data.get('closeTime', '22:00')),
                stall_data.get('status', 'closed'),
                0,
                0,
                stall_data.get('today_discount', stall_data.get('todayDiscount'))
            ))

            if self.is_postgresql:
                stall_id = cursor.fetchone()['id']
            else:
                stall_id = cursor.lastrowid

            # Add menu items
            for item in stall_data.get('menu', []):
                cursor.execute(f'''
                    INSERT INTO menu_items (stall_id, item_name, price, available)
                    VALUES ({self._ph(4)})
                ''', (stall_id, item['itemName'], item['price'], item.get('available', True)))

            return self.get_stall_by_id(stall_id)

    def add_review(self, stall_id, review_data):
        """Add a review to a stall."""
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute(f'''
                INSERT INTO reviews (stall_id, rating, comment, date)
                VALUES ({self._ph(4)})
            ''', (stall_id, review_data['rating'], review_data.get('comment', ''),
                  datetime.now().strftime('%Y-%m-%d')))

            cursor.execute(f'''
                UPDATE stalls
                SET total_reviews = (SELECT COUNT(*) FROM reviews WHERE stall_id = {ph}),
                    rating = (SELECT AVG(rating) FROM reviews WHERE stall_id = {ph})
                WHERE id = {ph}
            ''', (stall_id, stall_id, stall_id))

            return self.get_stall_by_id(stall_id)

    def update_stall_status(self, stall_id, status):
        """Update stall open/closed status."""
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute(f'''
                UPDATE stalls SET status = {ph}, updated_at = CURRENT_TIMESTAMP
                WHERE id = {ph}
            ''', (status, stall_id))
            return self.get_stall_by_id(stall_id)

    def update_stall_discount(self, stall_id, discount):
        """Update stall's today discount."""
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute(f'''
                UPDATE stalls SET today_discount = {ph}, updated_at = CURRENT_TIMESTAMP
                WHERE id = {ph}
            ''', (discount, stall_id))
            return self.get_stall_by_id(stall_id)

    def update_menu_item_availability(self, stall_id, item_index, available):
        """Update a menu item's availability."""
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute(
                f'SELECT id FROM menu_items WHERE stall_id = {ph} ORDER BY id',
                (stall_id,)
            )
            items = cursor.fetchall()

            if item_index < len(items):
                item_row = items[item_index]
                item_id = item_row['id'] if isinstance(item_row, dict) else item_row[0]
                cursor.execute(f'''
                    UPDATE menu_items SET available = {ph} WHERE id = {ph}
                ''', (available, item_id))

            return self.get_stall_by_id(stall_id)

    def add_menu_item(self, stall_id, item_data):
        """Add a new menu item to a stall."""
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute(f'''
                INSERT INTO menu_items (stall_id, item_name, price, available)
                VALUES ({self._ph(4)})
            ''', (stall_id, item_data['itemName'], item_data['price'],
                  item_data.get('available', True)))
            return self.get_stall_by_id(stall_id)

    def update_menu(self, stall_id, menu_data):
        """Update entire menu for a stall."""
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute(f'DELETE FROM menu_items WHERE stall_id = {ph}', (stall_id,))

            for item in menu_data:
                cursor.execute(f'''
                    INSERT INTO menu_items (stall_id, item_name, price, available)
                    VALUES ({self._ph(4)})
                ''', (stall_id, item['itemName'], item['price'], item.get('available', True)))

            return self.get_stall_by_id(stall_id)

    def delete_stall(self, stall_id, contact, password):
        """Permanently delete a stall after verifying credentials."""
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute(f'SELECT * FROM stalls WHERE id = {ph}', (stall_id,))
            stall = cursor.fetchone()
            if not stall:
                return False, 'Shop not found'
            row = self._row_to_dict(stall, public=False)
            if row.get('contact') != contact:
                return False, 'Invalid credentials'
            if not self._verify_password(password, row.get('passwordHash')):
                return False, 'Invalid credentials'
            cursor.execute(f'DELETE FROM menu_items WHERE stall_id = {ph}', (stall_id,))
            cursor.execute(f'DELETE FROM reviews WHERE stall_id = {ph}', (stall_id,))
            cursor.execute(f'DELETE FROM stalls WHERE id = {ph}', (stall_id,))
            return True, 'Shop deleted'

    def verify_vendor_login(self, stall_id, contact, password=None):
        """Legacy: verify contact only (kept for backward compat)."""
        ph = '%s' if self.is_postgresql else '?'
        with self._cursor() as cursor:
            cursor.execute(
                f'SELECT * FROM stalls WHERE id = {ph} AND contact = {ph}',
                (stall_id, contact)
            )
            stall = cursor.fetchone()
            if not stall:
                return False
            if password is not None:
                row = self._row_to_dict(stall, public=False)
                return self._verify_password(password, row.get('passwordHash'))
            return True

    # ------------------------------------------------------------------
    # Row conversion
    # ------------------------------------------------------------------

    def _row_to_dict(self, row, public=True):
        """Convert database row to dictionary. If public=True, strip private fields."""
        if row is None:
            return None
        result = dict(row)

        # Convert snake_case to camelCase
        mapping = {
            'open_time': 'openTime',
            'close_time': 'closeTime',
            'total_reviews': 'totalReviews',
            'today_discount': 'todayDiscount',
            'item_name': 'itemName',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt',
            'password_hash': 'passwordHash',
        }
        for old_key, new_key in mapping.items():
            if old_key in result:
                result[new_key] = result[old_key]
                del result[old_key]

        # Strip private fields from public responses
        if public:
            result.pop('contact', None)
            result.pop('passwordHash', None)
            result.pop('password_hash', None)

        return result

    # ------------------------------------------------------------------
    # Data import
    # ------------------------------------------------------------------

    def import_from_json(self, json_path):
        """Import data from JSON file (for migration)."""
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        stalls = data.get('stalls', [])

        for stall in stalls:
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

            for review in stall.get('reviews', []):
                self.add_review(stall['id'], {
                    'rating': review['rating'],
                    'comment': review.get('comment', ''),
                    'date': review.get('date', datetime.now().strftime('%Y-%m-%d'))
                })


# Global database instance
db = Database()
