from database import db
from transliteration_service import transliterate

def backfill_puffs():
    stalls = db.get_all_stalls()
    for stall in stalls:
        with db._cursor() as cursor:
            cursor.execute('SELECT id, item_name FROM menu_items WHERE stall_id = ?', (stall['id'],))
            items = cursor.fetchall()
            for item_id, item_name in items:
                if 'puffs' in item_name.lower():
                    item_ta = transliterate(item_name, 'ta')
                    cursor.execute('UPDATE menu_items SET item_name_ta = ? WHERE id = ?', (item_ta, item_id))
    print("Backfill complete!")

if __name__ == "__main__":
    backfill_puffs()
