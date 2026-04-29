# StreetBite - Street Food Tracker

A modern web application for tracking and discovering street food vendors in Chennai, India. Built with Flask and vanilla JavaScript.

## Features

- **Browse Food Stalls**: View all street food vendors with details like location, ratings, and menu
- **Search & Filter**: Find vendors by name, area, or food category
- **Category Tabs**: Quick filtering by food type (Dosa, Biryani, Rolls, Bajji, Juice, Chinese, Snacks)
- **Vendor Dashboard**: Vendors can manage their shop status, menu availability, and daily offers
- **Reviews & Ratings**: Users can rate and review their favorite food stalls
- **Multi-language Support**: Available in English, Tamil, and Hindi
- **Database Backend**: SQLite (local) / PostgreSQL (production)
- **Persistent Data**: All changes saved to database - shared across all users

## Tech Stack

- **Backend**: Python Flask with Gunicorn
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: SQLite (development) / PostgreSQL (production)
- **Deployment**: Render (free tier)
- **Location Features**: City/area-based filtering for Tamil Nadu locations
- **Responsive Design**: Mobile-first UI with modern CSS animations

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Initialize the database (creates stalls.db automatically)
python init_db.py

# Run the development server
python app.py
```

Visit `http://localhost:5000` in your browser.

### Database Setup

The application uses SQLite by default for local development. Data is stored in `stalls.db` which is created automatically on first run.

For production deployment with PostgreSQL:

```bash
# Uncomment in requirements.txt:
# psycopg2-binary==2.9.9

# Set environment variable:
export DATABASE_URL="postgresql://user:password@host:port/database"
```

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed migration instructions.

## Project Structure

```
street-food-tracker/
├── app.py                  # Flask backend server & API routes
├── database.py             # Database abstraction (SQLite/PostgreSQL)
├── init_db.py              # Database initialization script
├── data/
│   └── stalls.json         # Initial vendor data (for migration)
├── static/
│   ├── index.html          # Main HTML file
│   ├── script.js           # Frontend JavaScript logic
│   └── style.css           # Responsive CSS styles
├── requirements.txt        # Python dependencies
├── .github/workflows/      # GitHub Actions CI/CD
├── DATABASE_SETUP.md       # Database migration guide
└── README.md               # This file
```

## Usage

### For Customers

1. **Browse**: View all food stalls on the Home page
2. **Search**: Use the Search tab to find specific vendors or areas
3. **View Details**: Click on any stall to see menu, reviews, and contact info
4. **Write Reviews**: Rate and review your favorite stalls
5. **Language**: Switch between English, Tamil, and Hindi using the header selector

### For Vendors

1. Go to the Profile tab
2. Select your shop from the search dropdown
3. Enter your registered contact number
4. Login to access your dashboard where you can:
   - Toggle shop status (Open/Closed)
   - Update daily offers/discounts
   - Manage menu item availability
   - Add new menu items

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stalls` | Get all stalls |
| GET | `/api/stalls/<id>` | Get single stall by ID |
| POST | `/api/stalls` | Add new stall |
| POST | `/api/stalls/<id>/review` | Add review to stall |
| PUT | `/api/stalls/<id>/status` | Update stall open/closed status |
| PUT | `/api/stalls/<id>/discount` | Update stall's daily discount |
| PUT | `/api/stalls/<id>/menu` | Update entire menu |
| POST | `/api/stalls/<id>/menu-item` | Add single menu item |
| PUT | `/api/stalls/<id>/menu-item/<index>/availability` | Toggle menu item availability |
| POST | `/api/stalls/<id>/vendor-login` | Verify vendor login credentials |
| GET | `/api/health` | Health check endpoint |

## Database Schema

The application uses three tables:

- **stalls**: id, name, category, emoji, area, address, contact, open_time, close_time, status, rating, total_reviews, today_discount, created_at, updated_at
- **menu_items**: id, stall_id, item_name, price, available (foreign key to stalls)
- **reviews**: id, stall_id, rating, comment, date, created_at (foreign key to stalls)

Indexes are created on category, area, status, and foreign keys for query performance.

## Data Model (JSON Format)

Each stall has the following structure:

```json
{
  "id": 1,
  "name": "Shop Name",
  "category": "Dosa",
  "emoji": "🥞",
  "area": "T Nagar",
  "address": "Full address",
  "contact": "9876543210",
  "openTime": "06:00",
  "closeTime": "22:00",
  "status": "open",
  "rating": 4.5,
  "totalReviews": 128,
  "todayDiscount": "10% off",
  "menu": [
    {"itemName": "Dosa", "price": 30, "available": true}
  ],
  "reviews": [
    {"rating": 5, "comment": "Great food!", "date": "2026-04-20"}
  ]
}
```

## Categories

- Dosa (🥞)
- Biryani (🍚)
- Rolls (🌯)
- Bajji (🫓)
- Juice (🧃)
- Chinese (🍜)
- Snacks (🍿)

## Deployment to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create a New Web Service
1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: StreetBite (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `street-food-tracker`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

### Step 3: Set Environment Variables (if needed)
- No environment variables required for basic deployment

### Step 4: Deploy
1. Click **Create Web Service**
2. Render will build and deploy automatically
3. Your app will be live at `https://streetbite-xxxx.onrender.com`

### GitHub Actions (Optional CI/CD)

The included workflow can auto-deploy to Render when you push to main. You'll need:
1. Get your Render API Key from Dashboard → Settings → API Keys
2. Get your Service ID from the service page URL
3. Add these as GitHub Secrets:
   - `RENDER_API_KEY`
   - `RENDER_SERVICE_ID`

## Supported Locations

The application supports street food vendors across Tamil Nadu including:

- **Chennai**: T Nagar, Anna Nagar, Adyar, Mylapore, Vadapalani, Porur, Velachery, Tambaram, and 10+ more areas
- **Coimbatore**: RS Puram, Saibaba Colony, Gandhipuram, Peelamedu, and more
- **Madurai, Tiruchirappalli, Salem, Tiruppur, Erode, Vellore** and 15+ other cities

See `script.js` for the complete list of supported cities and areas.

## Future Enhancements

- [ ] User authentication for customers
- [ ] Image uploads for food items
- [ ] Map integration for location viewing
- [ ] Push notifications for vendors
- [ ] Analytics dashboard
- [ ] WhatsApp integration for vendor notifications
- [ ] Multi-city expansion beyond Tamil Nadu

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (optional) | Uses SQLite |

### CORS

CORS is enabled for all origins by default. Modify `app.py` to restrict CORS for production:

```python
CORS(app, origins=["https://yourdomain.com"])
```

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Credits

Built with ❤️ for street food vendors of Chennai.
