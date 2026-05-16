from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from database import db
from transliteration_service import transliterate
from concurrent.futures import ThreadPoolExecutor

app = Flask(__name__, static_folder='static')
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"]
)
CORS(app, origins=[
    "https://streetbite-1.onrender.com",
    "http://localhost:5000",
    "http://127.0.0.1:5000"
])

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
    """Get all stalls."""
    stalls = db.get_all_stalls()
    return jsonify(stalls)

@app.route('/api/stalls/<int:stall_id>', methods=['GET'])
def get_stall(stall_id):
    """Get a single stall by ID (public data only)."""
    stall = db.get_stall_by_id(stall_id, public=True)
    if stall:
        return jsonify(stall)
    return jsonify({'error': 'Stall not found'}), 404

@app.route('/api/stalls', methods=['POST'])
def add_stall():
    """Add a new stall (admin/internal use). For public registration use /api/stalls/signup."""
    stall_data = request.json
    if 'status' not in stall_data:
        stall_data['status'] = 'auto'
    if 'openTime' not in stall_data:
        stall_data['openTime'] = '09:00'
    if 'closeTime' not in stall_data:
        stall_data['closeTime'] = '22:00'
    emoji_map = {
        'Fast Food': '🍟', 'Biryani': '🍚', 'Parotta & Meals': '🫓',
        'Grilled & Non-Veg': '🍗', 'Juice': '🧃', 'Sweet & Beverages': '🍧',
        'Snacks': '🍿', 'Others': '🍽️'
    }
    if 'emoji' not in stall_data:
        stall_data['emoji'] = emoji_map.get(stall_data.get('category', ''), '🍽️')
    new_stall = db.add_stall(stall_data)
    return jsonify(new_stall), 201


@app.route('/api/stalls/signup', methods=['POST'])
def signup_stall():
    """Public registration: creates a new shop with hashed password."""
    stall_data = request.json
    required = ['name', 'category', 'district', 'area', 'contact', 'password']
    for field in required:
        if not stall_data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    if len(stall_data['password']) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400
    emoji_map = {
        'Fast Food': '🍟', 'Biryani': '🍚', 'Parotta & Meals': '🫓',
        'Grilled & Non-Veg': '🍗', 'Juice': '🧃', 'Sweet & Beverages': '🍧',
        'Snacks': '🍿', 'Others': '🍽️'
    }
    stall_data['emoji'] = emoji_map.get(stall_data.get('category', ''), '🍽️')
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
def add_review(stall_id):
    """Add a review to a stall."""
    review_data = request.json

    if 'rating' not in review_data:
        return jsonify({'error': 'Rating is required'}), 400

    stall = db.add_review(stall_id, review_data)
    return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/status', methods=['PUT'])
def update_status(stall_id):
    """Update stall open/closed status."""
    status_data = request.json
    contact = status_data.get('contact')
    password = status_data.get('password')

    if not db.vendor_login(stall_id, contact, password):
        return jsonify({'error': 'Authentication failed'}), 401

    if 'status' not in status_data:
        return jsonify({'error': 'Status is required'}), 400

    stall = db.update_stall_status(stall_id, status_data['status'], public=False)
    return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/discount', methods=['PUT'])
def update_discount(stall_id):
    """Update stall's today discount."""
    discount_data = request.json
    contact = discount_data.get('contact')
    password = discount_data.get('password')

    if not db.vendor_login(stall_id, contact, password):
        return jsonify({'error': 'Authentication failed'}), 401

    discount = discount_data.get('discount')
    stall = db.update_stall_discount(stall_id, discount, public=False)
    return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/menu', methods=['PUT'])
def update_menu(stall_id):
    """Update entire menu for a stall."""
    menu_data = request.json
    contact = menu_data.get('contact')
    password = menu_data.get('password')

    if not db.vendor_login(stall_id, contact, password):
        return jsonify({'error': 'Authentication failed'}), 401

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
def menu_item_handler(stall_id):
    """POST: add menu item. PUT: toggle availability. DELETE: remove item by item_index."""
    item_data = request.json
    contact = item_data.get('contact')
    password = item_data.get('password')

    if not db.vendor_login(stall_id, contact, password):
        return jsonify({'error': 'Authentication failed'}), 401

    if request.method == 'PUT':
        # Toggle availability: body = {item_id, available}
        item_id = item_data.get('item_id')
        available = item_data.get('available')
        if item_id is None or available is None:
            return jsonify({'error': 'item_id and available are required'}), 400
        stall = db.update_menu_item_availability(stall_id, item_id, available, public=False)
        return jsonify(stall)
    elif request.method == 'DELETE':
        # Remove item: body = {item_id}
        item_id = item_data.get('item_id')
        stall = db.delete_menu_item(stall_id, item_id, public=False)
        return jsonify(stall)
    else:
        # POST: Add new item
        if 'itemName' not in item_data or 'price' not in item_data:
            return jsonify({'error': 'Item name and price are required'}), 400
        
        # Auto-transliterate
        item_data['itemName_ta'] = transliterate(item_data['itemName'], 'ta')
        item_data['itemName_hi'] = transliterate(item_data['itemName'], 'hi')
        
        stall = db.add_menu_item(stall_id, item_data, public=False)
        return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/vendor-login', methods=['POST'])
@limiter.limit("5 per minute")
def vendor_login(stall_id):
    """Verify vendor login credentials (contact + password)."""
    login_data = request.json
    if 'contact' not in login_data:
        return jsonify({'error': 'Contact number is required'}), 400
    if 'password' not in login_data:
        return jsonify({'error': 'Password is required'}), 400

    stall = db.vendor_login(stall_id, login_data['contact'], login_data['password'])
    if stall:
        # Return stall data — contact visible to owner only in this response
        return jsonify({'success': True, 'stall': stall})
    else:
        return jsonify({'success': False, 'error': 'Invalid shop ID, contact, or password'}), 401

@app.route('/api/stalls/<int:stall_id>', methods=['DELETE'])
def delete_stall(stall_id):
    """Delete a stall — requires contact + password verification."""
    data = request.json or {}
    contact = data.get('contact', '').strip()
    password = data.get('password', '')
    if not contact or not password:
        return jsonify({'error': 'Contact and password are required'}), 400
    success, message = db.delete_stall(stall_id, contact, password)
    if success:
        return jsonify({'success': True, 'message': message})
    return jsonify({'success': False, 'error': message}), 401

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

    stall = db.login_by_contact(contact, password)
    if stall:
        return jsonify({'success': True, 'stall': stall})
    else:
        return jsonify({'success': False, 'error': 'Invalid mobile number or password'}), 401

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'database': 'postgresql' if db.is_postgresql else 'sqlite'
    })

if __name__ == '__main__':
    # For local development
    print(f"Database type: {'PostgreSQL' if db.is_postgresql else 'SQLite'}")
    app.run(debug=True, port=5000, host='0.0.0.0')
