# StreetBite - Street Food Tracker

A modern web application for tracking and discovering street food vendors in Chennai, India. Built with Flask and vanilla JavaScript.

## Features

- **Browse Food Stalls**: View all street food vendors with details like location, ratings, and menu
- **Search & Filter**: Find vendors by name, area, or food category
- **Category Tabs**: Quick filtering by food type (Dosa, Biryani, Rolls, Bajji, Juice, Chinese, Snacks)
- **Vendor Dashboard**: Vendors can manage their shop status, menu availability, and daily offers
- **Reviews & Ratings**: Users can rate and review their favorite food stalls
- **Multi-language Support**: Available in English, Tamil, and Hindi
- **Persistent Data**: All changes saved to server - shared across all users

## Tech Stack

- **Backend**: Python Flask with Gunicorn
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Data Storage**: JSON file
- **Deployment**: Render (free tier)

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the development server
python app.py
```

Visit `http://localhost:5000` in your browser.

## Project Structure

```
street-food-tracker/
├── app.py                  # Flask backend server
├── data/
│   └── stalls.json         # Initial vendor data
├── static/
│   ├── index.html          # Main HTML file
│   ├── script.js           # Frontend JavaScript
│   └── style.css           # Styles
├── requirements.txt        # Python dependencies
├── .github/workflows/      # GitHub Actions CI/CD
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

## Data Model

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

## Future Enhancements

- [ ] Backend database integration (PostgreSQL/MongoDB)
- [ ] User authentication for customers
- [ ] Image uploads for food items
- [ ] Map integration for location viewing
- [ ] Push notifications for vendors
- [ ] Analytics dashboard

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Credits

Built with ❤️ for street food vendors of Chennai.
