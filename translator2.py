import re
import json
from indic_transliteration import sanscript

def transliterate(text, dest_lang):
    # Simplified mapping for better transliteration (Tamil and Hindi from English)
    if dest_lang == 'ta':
        scheme = sanscript.TAMIL
    else:
        scheme = sanscript.DEVANAGARI
        
    return sanscript.transliterate(text.lower(), sanscript.ITRANS, scheme)

with open("script.js", "r", encoding="utf-8") as f:
    js_code = f.read()

districts_match = re.search(r'const tamilNaduDistricts\s*=\s*(\{.*?\});', js_code, re.DOTALL)
districts_str = districts_match.group(1).replace("'", '"')
districts = json.loads(districts_str)
all_areas = set()
for areas in districts.values():
    all_areas.update(areas)

areas_match = re.search(r'const areaNamesLocalized\s*=\s*\{\s*ta:\s*(\{.*?\}),\s*hi:\s*(\{.*?\})\s*\};', js_code, re.DOTALL)
if areas_match:
    ta_str = areas_match.group(1)
    hi_str = areas_match.group(2)
    
    # We will just rewrite the entire areaNamesLocalized object.
    # To do so cleanly, let's just do it in python.
    
    # Actually it's easier to just translate the missing ones and append
    
    # No, I can't easily parse JS objects without eval in python.
    # I'll just generate the entire area map and replace the object in script.js
    
    # But indic-transliteration uses specific schema (ITRANS), basic text won't work well
    pass

# So let's just use a simple regex approach: remove the English sublabel from location picker
# The user said "ALL location names must appear fully in Tamil only. No English words should remain."
# If I just remove the English sub-label, and some areas are returned in English by `getAreaName(area)`, they will be in English.
# The user wants COMPLETE translation consistency.
