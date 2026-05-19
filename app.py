from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from itsdangerous import URLSafeTimedSerializer
from functools import wraps
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from database import db
from transliteration_service import transliterate
from concurrent.futures import ThreadPoolExecutor

app = Flask(__name__, static_folder='static')
# Issue #1: SECRET_KEY MUST be set via env var — no hardcoded fallback in production.
# The fallback below is intentionally weak so it fails obviously when not configured.
_secret = os.environ.get('SECRET_KEY')
if not _secret:
    import sys
    if os.environ.get('FLASK_ENV') == 'production' or os.environ.get('RENDER'):
        print('[FATAL] SECRET_KEY environment variable is not set. Refusing to start.', file=sys.stderr)
        sys.exit(1)
    _secret = 'dev-only-insecure-key-do-not-use-in-prod'
app.config['SECRET_KEY'] = _secret
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"]
)
CORS(app, resources={r"/api/*": {
    "origins": [
        "https://streetbite-1.onrender.com",
        "https://streetbite.onrender.com",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:3000"   # local frontend on separate dev port
    ],
    "allow_headers": ["Content-Type", "Authorization"],
    "expose_headers": ["Content-Type"],
    "supports_credentials": True,
    "max_age": 3600
}})

# ------------------------------------------------------------------
# Issue #4: Centralised input validation
# ------------------------------------------------------------------
_VALID_CATEGORIES = {
    'Fast Food', 'Biryani', 'Parotta & Meals', 'Grilled & Non-Veg',
    'Juice', 'Sweet & Beverages', 'Snacks', 'Others'
}

def validate_stall_data(data):
    """Validate stall registration payload. Returns a list of error strings."""
    errors = []

    # Required fields
    for field in ('name', 'category', 'district', 'area', 'contact', 'password'):
        if not data.get(field):
            errors.append(f'{field} is required')

    # Shop name length
    name = data.get('name', '')
    if name and (len(name) < 3 or len(name) > 100):
        errors.append('Shop name must be 3-100 characters')

    # Contact: exactly 10 digits
    contact = data.get('contact', '')
    if contact and (not contact.isdigit() or len(contact) != 10):
        errors.append('Contact must be exactly 10 digits')

    # Password minimum length
    password = data.get('password', '')
    if password and len(password) < 4:
        errors.append('Password must be at least 4 characters')

    # Category whitelist
    category = data.get('category', '')
    if category and category not in _VALID_CATEGORIES:
        errors.append(f'Invalid category. Must be one of: {", ".join(sorted(_VALID_CATEGORIES))}')

    # Menu: at least one item required
    menu = data.get('menu', [])
    if not isinstance(menu, list) or len(menu) == 0:
        errors.append('At least one menu item is required')
    else:
        for i, item in enumerate(menu):
            if not item.get('itemName') or not str(item.get('itemName', '')).strip():
                errors.append(f'Menu item {i + 1}: itemName is required')
            price = item.get('price')
            if price is None or not isinstance(price, (int, float)) or price <= 0:
                errors.append(f'Menu item {i + 1}: price must be a positive number')

    return errors

def generate_token(stall_id, contact):
    return serializer.dumps({'stall_id': stall_id, 'contact': contact})

def verify_token(token):
    try:
        return serializer.loads(token, max_age=86400)
    except Exception:
        return None

def vendor_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        stall_id = kwargs.get('stall_id')
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid token'}), 401
            
        token = auth_header.split(' ')[1]
        data = verify_token(token)
        
        if not data:
            return jsonify({'error': 'Token is invalid or expired'}), 401
            
        if data.get('stall_id') == -99:
            return f(*args, **kwargs)
            
        if stall_id is not None and data.get('stall_id') != stall_id:
            return jsonify({'error': 'Unauthorized for this shop'}), 401
            
        return f(*args, **kwargs)
    return decorated_function

# For fast parallel transliteration during signup
executor = ThreadPoolExecutor(max_workers=10)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

@app.route('/api/stalls', methods=['GET'])
def get_stalls():
    """Get all stalls — public data only (contact already stripped by db layer)."""
    stalls = db.get_all_stalls()
    # Issue #3: Belt-and-suspenders strip of contact from every stall in the list.
    # The DB layer already sets public=True, but we enforce it here too.
    for stall in stalls:
        stall.pop('contact', None)
        stall.pop('passwordHash', None)
    return jsonify(stalls)

@app.route('/api/stalls/<int:stall_id>', methods=['GET'])
def get_stall(stall_id):
    """Get a single stall by ID (public data only, unless authorized)."""
    stall = db.get_stall_by_id(stall_id, public=True)
    if not stall:
        return jsonify({'error': 'Stall not found'}), 404

    auth_header = request.headers.get('Authorization')
    is_owner = False
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        data = verify_token(token)
        if data and (data.get('stall_id') == stall_id or data.get('stall_id') == -99):
            is_owner = True
            
    if not is_owner and 'contact' in stall:
        del stall['contact']
        
    return jsonify(stall)

@app.route('/api/stalls', methods=['POST'])
@vendor_required
def add_stall():
    """Add a new stall (admin-only internal endpoint).
    Protected by @vendor_required — only admin token (stall_id == -99) should use this.
    For public self-registration, vendors must use POST /api/stalls/signup instead.
    """
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.split(' ')[1] if ' ' in auth_header else ''
    token_data = verify_token(token)
    if not token_data or token_data.get('stall_id') != -99:
        return jsonify({'error': 'Admin access required'}), 403

    stall_data = request.json or {}
    stall_data.setdefault('status', 'auto')
    stall_data.setdefault('openTime', '09:00')
    stall_data.setdefault('closeTime', '22:00')
    try:
        new_stall = db.add_stall(stall_data)
        return jsonify(new_stall), 201
    except Exception as e:
        print(f'[ERROR] add_stall: {e}')
        return jsonify({'error': 'Failed to create stall'}), 500


@app.route('/api/stalls/signup', methods=['POST'])
@limiter.limit("5 per hour")
def signup_stall():
    """Public registration: creates a new shop with hashed password."""
    stall_data = request.get_json(silent=True)
    if not stall_data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    # Issue #4: Use centralised validation
    validation_errors = validate_stall_data(stall_data)
    if validation_errors:
        return jsonify({'error': 'Validation failed', 'details': validation_errors}), 400

    stall_data['status'] = 'auto'
    
    # Safe transliteration (Optimized with Parallel Execution)
    try:
        def do_trans(text, lang):
            return transliterate(text, lang)

        # Basic stall data tasks
        tasks = [
            ('name_ta', executor.submit(do_trans, stall_data['name'], 'ta')),
            ('name_hi', executor.submit(do_trans, stall_data['name'], 'hi')),
        ]
        
        # Menu item tasks
        menu_tasks = []
        if 'menu' in stall_data:
            for i, item in enumerate(stall_data['menu']):
                t_ta = executor.submit(do_trans, item.get('itemName', ''), 'ta')
                t_hi = executor.submit(do_trans, item.get('itemName', ''), 'hi')
                menu_tasks.append((i, t_ta, t_hi))

        # Collect results
        for key, future in tasks:
            stall_data[key] = future.result()
            
        for i, f_ta, f_hi in menu_tasks:
            stall_data['menu'][i]['itemName_ta'] = f_ta.result()
            stall_data['menu'][i]['itemName_hi'] = f_hi.result()
            
    except Exception as e:
        print(f"[Signup] Transliteration failed (non-critical): {e}")

    try:
        new_stall = db.signup_stall(stall_data)
        return jsonify({'success': True, 'stall': new_stall}), 201
    except ValueError as e:
        print(f"[Signup] Validation error: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"[Signup] Server error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An internal server error occurred during registration'}), 500

@app.route('/api/stalls/<int:stall_id>/review', methods=['POST'])
@limiter.limit("10 per minute")
def add_review(stall_id):
    """Add a review to a stall."""
    review_data = request.get_json(silent=True) or {}

    # Validate rating
    rating = review_data.get('rating')
    if rating is None:
        return jsonify({'error': 'Rating is required'}), 400
    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return jsonify({'error': 'Rating must be an integer'}), 400
    if rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    review_data['rating'] = rating

    # Validate comment (optional but bounded)
    comment = review_data.get('comment', '')
    if len(str(comment)) > 500:
        return jsonify({'error': 'Review comment must be 500 characters or fewer'}), 400

    # Ensure the stall exists
    if not db.get_stall_by_id(stall_id, public=True):
        return jsonify({'error': 'Stall not found'}), 404

    try:
        stall = db.add_review(stall_id, review_data)
        return jsonify(stall)
    except Exception as e:
        print(f'[ERROR] add_review stall={stall_id}: {e}')
        return jsonify({'error': 'Failed to submit review'}), 500

@app.route('/api/stalls/<int:stall_id>/status', methods=['PUT'])
@vendor_required
def update_status(stall_id):
    """Update stall open/closed status."""
    status_data = request.get_json(silent=True) or {}
    status = status_data.get('status') or request.args.get('status')
    if not status:
        return jsonify({'error': 'Status is required'}), 400

    stall = db.update_stall_status(stall_id, status, public=False)
    return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/discount', methods=['PUT'])
@vendor_required
def update_discount(stall_id):
    """Update stall's today discount."""
    discount_data = request.get_json(silent=True) or {}
    discount = discount_data.get('discount') if 'discount' in discount_data else request.args.get('discount')
    stall = db.update_stall_discount(stall_id, discount, public=False)
    return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/menu', methods=['PUT'])
@vendor_required
def update_menu(stall_id):
    """Update entire menu for a stall."""
    menu_data = request.get_json(silent=True) or {}
    if 'menu' not in menu_data:
        return jsonify({'error': 'Menu data is required'}), 400

    for item in menu_data['menu']:
        item['itemName_ta'] = transliterate(item['itemName'], 'ta')
        item['itemName_hi'] = transliterate(item['itemName'], 'hi')
        
    stall = db.update_menu(stall_id, menu_data['menu'])
    return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/menu', methods=['POST'])
def add_menu_item_post(stall_id):
    """Add a single menu item to a stall."""
    item_data = request.json
    if 'itemName' not in item_data or 'price' not in item_data:
        return jsonify({'error': 'Item name and price are required'}), 400
    
    # Auto-transliterate
    item_data['itemName_ta'] = transliterate(item_data['itemName'], 'ta')
    item_data['itemName_hi'] = transliterate(item_data['itemName'], 'hi')
    
    stall = db.add_menu_item(stall_id, item_data, public=False)
    return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/menu-item', methods=['POST', 'PUT', 'DELETE'])
@vendor_required
def menu_item_handler(stall_id):
    """POST: add menu item. PUT: toggle availability. DELETE: remove item by item_index."""
    item_data = request.get_json(silent=True) or {}

    if request.method == 'PUT':
        item_id = item_data.get('item_id') or request.args.get('item_id')
        if item_id is not None:
            try:
                item_id = int(item_id)
            except ValueError:
                pass
        available = item_data.get('available')
        if available is None:
            avail_str = request.args.get('available')
            if avail_str is not None:
                available = avail_str.lower() in ('true', '1', 'yes')
        if item_id is None or available is None:
            return jsonify({'error': 'item_id and available are required'}), 400
        stall = db.update_menu_item_availability(stall_id, item_id, available, public=False)
        return jsonify(stall)
    elif request.method == 'DELETE':
        item_id = item_data.get('item_id') or request.args.get('item_id')
        if item_id is not None:
            try:
                item_id = int(item_id)
            except ValueError:
                pass
        if item_id is None:
            return jsonify({'error': 'item_id is required'}), 400
        stall = db.delete_menu_item(stall_id, item_id, public=False)
        return jsonify(stall)
    else:
        if 'itemName' not in item_data or 'price' not in item_data:
            return jsonify({'error': 'Item name and price are required'}), 400
        item_data['itemName_ta'] = transliterate(item_data['itemName'], 'ta')
        item_data['itemName_hi'] = transliterate(item_data['itemName'], 'hi')
        stall = db.add_menu_item(stall_id, item_data, public=False)
        return jsonify(stall)



@app.route('/api/stalls/<int:stall_id>', methods=['DELETE'])
@vendor_required
def delete_stall(stall_id):
    """Delete a stall.

    Authentication is handled by @vendor_required (JWT token).
    The DB layer no longer re-checks credentials — token is the single source of truth.
    """
    try:
        success, message = db.delete_stall(stall_id)
        if success:
            return jsonify({'success': True, 'message': message})
        return jsonify({'error': message}), 404
    except Exception as e:
        print(f'[ERROR] delete_stall stall={stall_id}: {e}')
        return jsonify({'error': 'Failed to delete stall'}), 500

@app.route('/api/vendor-login', methods=['POST'])
@limiter.limit("5 per minute")
def vendor_login_by_contact():
    """Vendor login using mobile number + password only (no shop ID required)."""
    login_data = request.json
    contact = login_data.get('contact', '').strip()
    password = login_data.get('password', '')
    if not contact:
        return jsonify({'error': 'Mobile number is required'}), 400
    if not password:
        return jsonify({'error': 'Password is required'}), 400

    admin_contact = os.environ.get('ADMIN_CONTACT')
    admin_password = os.environ.get('ADMIN_PASSWORD')
    
    if admin_contact and admin_password and contact == admin_contact and password == admin_password:
        token = generate_token(-99, contact)
        return jsonify({
            'success': True,
            'token': token,
            'stall': {
                'id': -99,
                'name': 'StreetBite Administrator',
                'category': 'admin',
                'contact': admin_contact,
                'area': 'All Districts',
                'district': 'Tamil Nadu',
                'menu': [],
                'status': 'open',
                'openTime': '00:00',
                'closeTime': '23:59'
            }
        })
    elif contact == admin_contact:
        return jsonify({'success': False, 'error': 'Invalid mobile number or password'}), 401

    stall = db.login_by_contact(contact, password)
    if stall:
        token = generate_token(stall['id'], contact)
        return jsonify({'success': True, 'token': token, 'stall': stall})
    else:
        return jsonify({'success': False, 'error': 'Invalid mobile number or password'}), 401

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    import sys
    try:
        import psycopg2
        import_status = "success"
    except Exception as e:
        import_status = f"fail: {str(e)}"
        
    return jsonify({
        'status': 'healthy',
        'database': 'postgresql' if db.is_postgresql else 'sqlite',
        'psycopg2_import': import_status,
        'has_db_url_env': 'DATABASE_URL' in os.environ,
        'env_keys': [k for k in os.environ.keys() if 'DATABASE' in k or 'URL' in k or 'DB' in k]
    })

if __name__ == '__main__':
    # For local development
    print(f"Database type: {'PostgreSQL' if db.is_postgresql else 'SQLite'}")
    app.run(debug=True, port=5000, host='0.0.0.0')
