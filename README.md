# StreetBite - Street Food Tracker

A modern web application for tracking and discovering street food vendors in Chennai, India. Built with Flask and vanilla JavaScript, designed for deployment on GitHub Pages.

## Features

- **Browse Food Stalls**: View all street food vendors with details like location, ratings, and menu
- **Search & Filter**: Find vendors by name, area, or food category
- **Category Tabs**: Quick filtering by food type (Dosa, Biryani, Rolls, Bajji, Juice, Chinese, Snacks)
- **Vendor Dashboard**: Vendors can manage their shop status, menu availability, and daily offers
- **Reviews & Ratings**: Users can rate and review their favorite food stalls
- **Multi-language Support**: Available in English, Tamil, and Hindi
- **Offline-First**: Uses localStorage for data persistence - works on GitHub Pages without a backend

## Tech Stack

- **Backend**: Python Flask (for local development)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Data Storage**: localStorage (production) / JSON file (development)
- **Deployment**: GitHub Pages compatible

## Local Development

### Using Flask (Full Backend)

```bash
# Install Flask
pip install flask

# Run the development server
python app.py
```

Visit `http://localhost:5000` in your browser.

### Using GitHub Pages (Static Deployment)

1. Push the `street-food-tracker` folder contents to a GitHub repository
2. Enable GitHub Pages in repository settings
3. The app will work entirely using localStorage for data persistence

**Note**: For GitHub Pages deployment, the initial data loads from `data/stalls.json` and all subsequent changes are saved to browser localStorage.

## Project Structure

```
street-food-tracker/
├── app.py              # Flask backend server
├── data/
│   └── stalls.json     # Initial vendor data
├── static/
│   ├── index.html      # Main HTML file
│   ├── script.js       # Frontend JavaScript
│   └── style.css       # Styles
├── package-lock.json   # npm metadata
└── README.md           # This file
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

## Deployment Checklist

- [ ] Push code to GitHub repository
- [ ] Enable GitHub Pages in Settings > Pages
- [ ] Select main branch as source
- [ ] Verify app loads at `https://<username>.github.io/<repo>`
- [ ] Test all features (browse, search, vendor login, reviews)
- [ ] Share with users!

## Limitations (GitHub Pages Version)

- Data is stored in browser localStorage, so it's device-specific
- Each user's changes only affect their own browser
- For a multi-user production app with shared data, use the Flask backend with a database

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
