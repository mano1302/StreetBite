from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os

from database import db

app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for API requests

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
    """Get a single stall by ID."""
    stall = db.get_stall_by_id(stall_id)
    if stall:
        return jsonify(stall)
    return jsonify({'error': 'Stall not found'}), 404

@app.route('/api/stalls', methods=['POST'])
def add_stall():
    """Add a new stall."""
    stall_data = request.json

    # Set defaults
    if 'status' not in stall_data:
        stall_data['status'] = 'closed'
    if 'openTime' not in stall_data:
        stall_data['openTime'] = '09:00'
    if 'closeTime' not in stall_data:
        stall_data['closeTime'] = '22:00'

    # Add emoji based on category if not provided
    emoji_map = {
        'Dosa': '🥞',
        'Biryani': '🍚',
        'Rolls': '🌯',
        'Bajji': '🫓',
        'Juice': '🧃',
        'Chinese': '🍜',
        'Snacks': '🍿'
    }
    if 'emoji' not in stall_data:
        stall_data['emoji'] = emoji_map.get(stall_data.get('category', 'Snacks'), '🍽️')

    new_stall = db.add_stall(stall_data)
    return jsonify(new_stall), 201

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

    if 'status' not in status_data:
        return jsonify({'error': 'Status is required'}), 400

    stall = db.update_stall_status(stall_id, status_data['status'])
    return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/discount', methods=['PUT'])
def update_discount(stall_id):
    """Update stall's today discount."""
    discount_data = request.json

    discount = discount_data.get('discount')
    stall = db.update_stall_discount(stall_id, discount)
    return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/menu', methods=['PUT'])
def update_menu(stall_id):
    """Update entire menu for a stall."""
    menu_data = request.json

    if 'menu' not in menu_data:
        return jsonify({'error': 'Menu data is required'}), 400

    stall = db.update_menu(stall_id, menu_data['menu'])
    return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/menu-item', methods=['POST'])
def add_menu_item(stall_id):
    """Add a single menu item to a stall."""
    item_data = request.json

    if 'itemName' not in item_data or 'price' not in item_data:
        return jsonify({'error': 'Item name and price are required'}), 400

    stall = db.add_menu_item(stall_id, item_data)
    return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/menu-item/<int:item_index>/availability', methods=['PUT'])
def update_menu_item_availability(stall_id, item_index):
    """Update a menu item's availability."""
    availability_data = request.json

    if 'available' not in availability_data:
        return jsonify({'error': 'Available status is required'}), 400

    stall = db.update_menu_item_availability(stall_id, item_index, availability_data['available'])
    return jsonify(stall)

@app.route('/api/stalls/<int:stall_id>/vendor-login', methods=['POST'])
def vendor_login(stall_id):
    """Verify vendor login credentials."""
    login_data = request.json

    if 'contact' not in login_data:
        return jsonify({'error': 'Contact number is required'}), 400

    if db.verify_vendor_login(stall_id, login_data['contact']):
        stall = db.get_stall_by_id(stall_id)
        return jsonify({'success': True, 'stall': stall})
    else:
        return jsonify({'success': False, 'error': 'Contact number does not match'}), 401

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
