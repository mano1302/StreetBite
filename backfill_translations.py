from database import db
from transliteration_service import transliterate
import time

def backfill_translations():
    print("Fetching all stalls...")
    stalls = db.get_all_stalls()
    print(f"Found {len(stalls)} stalls. Starting backfill...")
    
    for stall in stalls:
        stall_id = stall['id']
        name = stall['name']
        print(f"Processing Stall {stall_id}: {name}")
        
        # Transliterate shop name
        name_ta = transliterate(name, 'ta')
        name_hi = transliterate(name, 'hi')
        
        # Update stall in database
        with db._cursor() as cursor:
            cursor.execute('''
                UPDATE stalls 
                SET name_ta = %s, name_hi = %s 
                WHERE id = %s
            ''' if db.is_postgresql else '''
                UPDATE stalls 
                SET name_ta = ?, name_hi = ? 
                WHERE id = ?
            ''', (name_ta, name_hi, stall_id))
        
        # Process menu items
        # We need to get items for this stall
        with db._cursor() as cursor:
            cursor.execute('SELECT id, item_name FROM menu_items WHERE stall_id = %s' if db.is_postgresql else 'SELECT id, item_name FROM menu_items WHERE stall_id = ?', (stall_id,))
            items = cursor.fetchall()
            
            for item_id, item_name in items:
                item_ta = transliterate(item_name, 'ta')
                item_hi = transliterate(item_name, 'hi')
                
                cursor.execute('''
                    UPDATE menu_items 
                    SET item_name_ta = %s, item_name_hi = %s 
                    WHERE id = %s
                ''' if db.is_postgresql else '''
                    UPDATE menu_items 
                    SET item_name_ta = ?, item_name_hi = ? 
                    WHERE id = ?
                ''', (item_ta, item_hi, item_id))
        
        # print(f"  Done: {name} -> {name_ta} / {name_hi}")
        time.sleep(0.5) # Be nice to the API

    print("Backfill complete!")

if __name__ == "__main__":
    backfill_translations()
