# StreetBite 🌯

StreetBite is a modern street food discovery web application specifically designed for the vibrant food landscape of Tamil Nadu. It connects hungry users with local street food vendors, providing real-time information, digital menus, and community reviews.

Built with a focus on accessibility, StreetBite features full multilingual support to ensure every user and vendor can navigate the platform in their preferred language.

## 🌟 Features

- **Multilingual Support**: Fully localized interface in **English**, **Tamil (தமிழ்)**, and **Hindi (हिंदी)**.
- **Smart Discovery**: Filter and find shops across all **38 districts** of Tamil Nadu.
- **Live Shop Status**: Real-time "Open", "Closed", or "On Leave" status indicators for vendors.
- **Vendor Dashboard**: Secure JWT token-based authentication system for shop owners.
- **Digital Menu Management**: Vendors can add, update, or toggle availability of menu items instantly.
- **Community Reviews**: User-driven rating and review system with localized comment display.
- **Responsive Design**: Premium, mobile-first UI with smooth animations and modern aesthetics.
- **Phonetic Transliteration**: Automatic transliteration of shop and food names across supported languages.

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom Design System)
- **Backend**: Python Flask
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Security**: JWT token authentication (via `itsdangerous`), Flask-Limiter rate limiting, salted SHA-256 password hashing, input validation, XSS sanitization
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

4. **Configure environment variables**

   Copy the example file and fill in your values:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your own secrets (see [Environment Variables](#-environment-variables) below).

   > **⚠️ NEVER commit `.env` to version control.** It is already listed in `.gitignore`.

5. **Run the application**
   ```bash
   python app.py
   ```
   The app will be available at `http://localhost:5000`.
   The database (`streetbite_clean.db`) is created automatically on the first run.

## 🔐 Environment Variables

The app requires certain environment variables to run securely. A template is provided in [`.env.example`](.env.example).

| Variable | Required | Default (Dev) | Description |
|---|---|---|---|
| `SECRET_KEY` | **Yes (production)** | `dev-only-insecure-key...` | Signs JWT auth tokens. Must be a strong random string in production. |
| `ADMIN_CONTACT` | **Yes (production)** | *(none)* | Admin login mobile number (10 digits). |
| `ADMIN_PASSWORD` | **Yes (production)** | *(none)* | Admin login password. |
| `DATABASE_URL` | No | SQLite file | PostgreSQL connection string for production. |

### Generating a secure SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Security Rules

> **🚨 CRITICAL: Never use the default `SECRET_KEY` in production.**
> The app will **refuse to start** on Render (or any environment with `RENDER` or `FLASK_ENV=production` set) if `SECRET_KEY` is missing.

- **Do NOT commit `.env`** to Git — it contains secrets. The `.gitignore` already excludes it.
- **Do commit `.env.example`** — it serves as documentation for required variables.
- **Set env vars directly** on your deployment platform (Render Dashboard → Environment, Heroku Config Vars, etc.). Never put real credentials in source code.
- **Admin credentials** (`ADMIN_CONTACT`, `ADMIN_PASSWORD`) have no hardcoded fallback. If not set, admin login is simply disabled.

## 🛣️ API Endpoints

### Public Endpoints
- `GET /api/stalls`: Fetch all available shops (contact info excluded).
- `GET /api/stalls/<id>`: Get detailed information for a specific shop.
- `POST /api/stalls/signup`: Register a new street food shop (rate-limited: 5/hour).
- `POST /api/stalls/<id>/review`: Submit a user review (rate-limited: 10/min).

### Vendor Endpoints (Requires `Authorization: Bearer <token>` header)
- `POST /api/vendor-login`: Authenticate vendor and receive a JWT token (rate-limited: 5/min).
- `PUT /api/stalls/<id>/status`: Update live status (Open/Closed/Auto/Leave).
- `PUT /api/stalls/<id>/discount`: Update today's special offer.
- `POST /api/stalls/<id>/menu-item`: Add a new item to the menu.
- `PUT /api/stalls/<id>/menu-item`: Update item availability or details.
- `DELETE /api/stalls/<id>/menu-item`: Remove an item from the menu.
- `DELETE /api/stalls/<id>`: Delete the entire shop (owner or admin only).

## 🚢 Deployment (Render)

1. Push your code to GitHub (ensure `.env` is **not** committed).
2. Create a new **Web Service** on [Render](https://render.com).
3. Set the following **Environment Variables** in the Render Dashboard:
   - `SECRET_KEY` — generate with `python -c "import secrets; print(secrets.token_hex(32))"`
   - `ADMIN_CONTACT` — your admin mobile number
   - `ADMIN_PASSWORD` — a strong admin password
   - `DATABASE_URL` — provided automatically if you add a Render PostgreSQL database
4. Deploy. The app will detect Render and enforce strict security checks.

---

Built with ❤️ for the street food lovers of Tamil Nadu.
