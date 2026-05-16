
import os
from database import db

def clear_all_shops():
    """
    Deletes all shops, menu items, and reviews from the database.
    Works for both local SQLite and Render PostgreSQL.
    """
    print(f"Connecting to database: {'PostgreSQL' if db.is_postgresql else 'SQLite'}")
    
    with db._cursor() as cursor:
        print("Clearing 'menu_items' table...")
        cursor.execute("DELETE FROM menu_items")
        
        print("Clearing 'reviews' table...")
        cursor.execute("DELETE FROM reviews")
        
        print("Clearing 'stalls' table...")
        cursor.execute("DELETE FROM stalls")
        
        # Reset auto-increment counters if possible
        if db.is_postgresql:
            print("Resetting PostgreSQL sequences...")
            cursor.execute("ALTER SEQUENCE stalls_id_seq RESTART WITH 1")
            cursor.execute("ALTER SEQUENCE menu_items_id_seq RESTART WITH 1")
            cursor.execute("ALTER SEQUENCE reviews_id_seq RESTART WITH 1")
        else:
            print("Resetting SQLite sequences...")
            cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('stalls', 'menu_items', 'reviews')")
            
    print("\nSUCCESS: All shop data has been cleared from the database storage.")
    print("You can now start adding shops from scratch.")

if __name__ == "__main__":
    confirm = input("Are you sure you want to delete ALL shops, reviews, and menu items? (yes/no): ")
    if confirm.lower() == 'yes':
        clear_all_shops()
    else:
        print("Aborted.")
