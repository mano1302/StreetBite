from flask import Flask, send_from_directory, jsonify, request
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='static')

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'stalls.json')

def load_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

@app.route('/api/stalls', methods=['GET'])
def get_stalls():
    data = load_data()
    return jsonify(data['stalls'])

@app.route('/api/stalls/<int:stall_id>', methods=['GET'])
def get_stall(stall_id):
    data = load_data()
    for stall in data['stalls']:
        if stall['id'] == stall_id:
            return jsonify(stall)
    return jsonify({'error': 'Stall not found'}), 404

@app.route('/api/stalls', methods=['POST'])
def add_stall():
    data = load_data()
    new_stall = request.json

    # Generate new ID
    max_id = max([s['id'] for s in data['stalls']], default=0)
    new_stall['id'] = max_id + 1

    # Set defaults
    new_stall['status'] = 'closed'
    new_stall['rating'] = 0
    new_stall['totalReviews'] = 0
    new_stall['reviews'] = []
    new_stall['todayDiscount'] = new_stall.get('todayDiscount')

    # Add emoji based on category
    emoji_map = {
        'Dosa': '🥞',
        'Biryani': '🍚',
        'Rolls': '🌯',
        'Bajji': '🫓',
        'Juice': '🧃',
        'Chinese': '🍜',
        'Snacks': '🍿'
    }
    new_stall['emoji'] = emoji_map.get(new_stall.get('category', 'Snacks'), '🍽️')

    data['stalls'].append(new_stall)
    save_data(data)

    return jsonify(new_stall), 201

@app.route('/api/stalls/<int:stall_id>/review', methods=['POST'])
def add_review(stall_id):
    data = load_data()
    review_data = request.json

    for stall in data['stalls']:
        if stall['id'] == stall_id:
            new_review = {
                'rating': review_data['rating'],
                'comment': review_data['comment'],
                'date': datetime.now().strftime('%Y-%m-%d')
            }
            stall['reviews'].append(new_review)

            # Update rating
            total_reviews = len(stall['reviews'])
            avg_rating = sum(r['rating'] for r in stall['reviews']) / total_reviews
            stall['rating'] = round(avg_rating, 1)
            stall['totalReviews'] = total_reviews

            save_data(data)
            return jsonify(stall)

    return jsonify({'error': 'Stall not found'}), 404

@app.route('/api/stalls/<int:stall_id>/status', methods=['PUT'])
def update_status(stall_id):
    data = load_data()
    status_data = request.json

    for stall in data['stalls']:
        if stall['id'] == stall_id:
            stall['status'] = status_data['status']
            save_data(data)
            return jsonify(stall)

    return jsonify({'error': 'Stall not found'}), 404

@app.route('/api/stalls/<int:stall_id>/discount', methods=['PUT'])
def update_discount(stall_id):
    data = load_data()
    discount_data = request.json

    for stall in data['stalls']:
        if stall['id'] == stall_id:
            stall['todayDiscount'] = discount_data['discount']
            save_data(data)
            return jsonify(stall)

    return jsonify({'error': 'Stall not found'}), 404

@app.route('/api/stalls/<int:stall_id>/menu', methods=['PUT'])
def update_menu(stall_id):
    data = load_data()
    menu_data = request.json

    for stall in data['stalls']:
        if stall['id'] == stall_id:
            stall['menu'] = menu_data['menu']
            save_data(data)
            return jsonify(stall)

    return jsonify({'error': 'Stall not found'}), 404

@app.route('/api/stalls/<int:stall_id>/vendor-login', methods=['POST'])
def vendor_login(stall_id):
    data = load_data()
    login_data = request.json

    for stall in data['stalls']:
        if stall['id'] == stall_id:
            if stall['contact'] == login_data['contact']:
                return jsonify({'success': True, 'stall': stall})
            else:
                return jsonify({'success': False, 'error': 'Contact number does not match'}), 401

    return jsonify({'error': 'Stall not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
