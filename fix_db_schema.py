from database import db

def add_columns():
    print("Adding columns to database...")
    with db._cursor() as cursor:
        if db.is_postgresql:
            print("PostgreSQL detected.")
            cursor.execute('''
                DO $$ BEGIN
                    ALTER TABLE stalls ADD COLUMN name_ta TEXT;
                    ALTER TABLE stalls ADD COLUMN name_hi TEXT;
                    ALTER TABLE stalls ADD COLUMN district TEXT;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            ''')
            cursor.execute('''
                DO $$ BEGIN
                    ALTER TABLE menu_items ADD COLUMN item_name_ta TEXT;
                    ALTER TABLE menu_items ADD COLUMN item_name_hi TEXT;
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            ''')
        else:
            print("SQLite detected.")
            cols_stalls = ["name_ta", "name_hi", "district"]
            for col in cols_stalls:
                try:
                    cursor.execute(f"ALTER TABLE stalls ADD COLUMN {col} TEXT")
                    print(f"  Added stalls.{col}")
                except Exception as e:
                    print(f"  Column stalls.{col} might already exist: {e}")
            
            cols_menu = ["item_name_ta", "item_name_hi"]
            for col in cols_menu:
                try:
                    cursor.execute(f"ALTER TABLE menu_items ADD COLUMN {col} TEXT")
                    print(f"  Added menu_items.{col}")
                except Exception as e:
                    print(f"  Column menu_items.{col} might already exist: {e}")
    print("Done!")

if __name__ == "__main__":
    add_columns()
