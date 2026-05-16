# StreetBite 🌯

StreetBite is a modern street food discovery web application specifically designed for the vibrant food landscape of Tamil Nadu. It connects hungry users with local street food vendors, providing real-time information, digital menus, and community reviews.

Built with a focus on accessibility, StreetBite features full multilingual support to ensure every user and vendor can navigate the platform in their preferred language.

## 🌟 Features

- **Multilingual Support**: Fully localized interface in **English**, **Tamil (தமிழ்)**, and **Hindi (हिंदी)**.
- **Smart Discovery**: Filter and find shops across all **38 districts** of Tamil Nadu.
- **Live Shop Status**: Real-time "Open", "Closed", or "On Leave" status indicators for vendors.
- **Vendor Dashboard**: Secure authentication system for shop owners to manage their presence.
- **Digital Menu Management**: Vendors can add, update, or toggle availability of menu items instantly.
- **Community Reviews**: User-driven rating and review system with localized comment display.
- **Responsive Design**: Premium, mobile-first UI with smooth animations and modern aesthetics.
- **Phonetic Transliteration**: Automatic transliteration of shop and food names across supported languages.

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom Design System)
- **Backend**: Python Flask
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Security**: Flask-Limiter for rate limiting, secure password hashing, and session-based authentication.
- **Deployment**: Render

## 📸 Screenshots

![StreetBite Desktop Preview](https://via.placeholder.com/800x450?text=StreetBite+Desktop+Preview)
*Desktop Grid View with Category Filtering*

![StreetBite Mobile Preview](https://via.placeholder.com/300x600?text=StreetBite+Mobile+Preview)
*Mobile-Responsive Shop Detail Page*

## 🚀 How to Run Locally

### Prerequisites
- Python 3.8+
- pip

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/streetbite.git
   cd street-food-tracker
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize the database**
   The application will automatically create a `streetbite.db` (SQLite) file on the first run.

5. **Run the application**
   ```bash
   python app.py
   ```
   The app will be available at `http://localhost:5000`.

## 🛣️ API Endpoints

### Public Endpoints
- `GET /api/stalls`: Fetch all available shops.
- `GET /api/stalls/<id>`: Get detailed information for a specific shop.
- `POST /api/stalls/signup`: Register a new street food shop.
- `POST /api/stalls/<id>/review`: Submit a user review.

### Vendor Endpoints (Requires Authentication)
- `POST /api/vendor-login`: Authenticate vendor using contact number and password.
- `PUT /api/stalls/<id>/status`: Update live status (Open/Closed/Auto/Leave).
- `PUT /api/stalls/<id>/discount`: Update today's special offer.
- `POST /api/stalls/<id>/menu-item`: Add a new item to the menu.
- `PUT /api/stalls/<id>/menu-item`: Update item availability or details.
- `DELETE /api/stalls/<id>/menu-item`: Remove an item from the menu.

---

Built with ❤️ for the street food lovers of Tamil Nadu.
