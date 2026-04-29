# Database Setup Guide

## Overview

This app uses **SQLite** for local development with a built-in migration path to **PostgreSQL** for production deployment on Render.

## Local Development (SQLite)

### Step 1: Install Dependencies

```bash
cd street-food-tracker
pip install -r requirements.txt
```

### Step 2: Initialize Database

```bash
python init_db.py
```

This creates `stalls.db` and imports your existing data from `data/stalls.json`.

### Step 3: Run the App

```bash
python app.py
```

Visit `http://localhost:5000`

## Production Deployment (PostgreSQL on Render)

### Step 1: Add PostgreSQL to Render

1. Go to Render Dashboard
2. Click "New" → "PostgreSQL"
3. Choose free tier (1GB storage)
4. Create database

### Step 2: Copy DATABASE_URL

1. In your PostgreSQL dashboard, find the "Connection Info"
2. Copy the `DATABASE_URL` value

### Step 3: Update requirements.txt

Uncomment the psycopg2-binary line in `requirements.txt`:

```txt
# Change this line:
# psycopg2-binary==2.9.9
```

### Step 4: Set Environment Variable

In Render Dashboard:
1. Go to your web service
2. Click "Environment"
3. Add new variable: `DATABASE_URL` = (paste your connection string)

### Step 5: Deploy

Push your code - Render will automatically:
- Install psycopg2-binary
- Connect to PostgreSQL
- Create tables on first run

## Data Migration

### From SQLite to PostgreSQL

The app handles this automatically. When `DATABASE_URL` is set:
1. App uses PostgreSQL instead of SQLite
2. Tables are created automatically on startup
3. You'll need to re-import data or use a migration tool

To export from SQLite and import to PostgreSQL:

```bash
# Export SQLite data
python -c "
from database import db
import json
stalls = db.get_all_stalls()
with open('export.json', 'w') as f:
    json.dump({'stalls': stalls}, f, indent=2)
"
```

## File Structure

```
street-food-tracker/
├── app.py              # Flask application
├── database.py         # Database abstraction layer
├── init_db.py          # Database initialization script
├── requirements.txt    # Python dependencies
├── stalls.db           # SQLite database (created automatically)
├── data/
│   └── stalls.json     # Original JSON data (backup)
└── static/
    ├── index.html      # Frontend HTML
    └── script.js       # Frontend JavaScript
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stalls` | Get all stalls |
| GET | `/api/stalls/:id` | Get single stall |
| POST | `/api/stalls` | Add new stall |
| POST | `/api/stalls/:id/review` | Add review |
| PUT | `/api/stalls/:id/status` | Update status |
| PUT | `/api/stalls/:id/discount` | Update discount |
| PUT | `/api/stalls/:id/menu` | Update menu |
| POST | `/api/stalls/:id/menu-item` | Add menu item |
| POST | `/api/stalls/:id/vendor-login` | Vendor login |
| GET | `/api/health` | Health check |

## Troubleshooting

### "psycopg2 not found" error
- Make sure `psycopg2-binary==2.9.9` is uncommented in requirements.txt
- Run `pip install -r requirements.txt`

### "DATABASE_URL not set" error
- Set the environment variable in Render dashboard
- For local testing with PostgreSQL, set: `export DATABASE_URL=postgresql://...`

### Database locked error (SQLite)
- Close any other processes using the database
- Delete `stalls.db` and re-run `python init_db.py`

## Why SQLite → PostgreSQL?

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Setup | Zero config | Requires setup |
| Cost | Free | Free tier available |
| Concurrency | Single writer | Multiple writers |
| Scaling | Single server | Horizontal scaling |
| Render persistence | ❌ Resets on deploy | ✅ Persistent |

For your street food tracker:
- **SQLite**: Perfect for development and low-traffic single server
- **PostgreSQL**: Required for production on Render (free tier works great!)
