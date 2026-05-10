import re
import json

with open("script.js", "r", encoding="utf-8") as f:
    js_code = f.read()

# Extract districts
districts_match = re.search(r'const tamilNaduDistricts\s*=\s*(\{.*?\});', js_code, re.DOTALL)
districts_str = districts_match.group(1).replace("'", '"')
districts = json.loads(districts_str)
all_areas = set()
for areas in districts.values():
    all_areas.update(areas)

# Hardcode some mappings here for the transliterator to use
# I will use a simple mapping
ta_letters = {
    'A':'அ', 'a':'அ', 'Aa':'ஆ', 'aa':'ஆ', 'I':'இ', 'i':'இ', 'Ee':'ஈ', 'ee':'ஈ',
    'U':'உ', 'u':'உ', 'Oo':'ஊ', 'oo':'ஊ', 'E':'எ', 'e':'எ', 'Ai':'ஐ', 'ai':'ஐ',
    'O':'ஒ', 'o':'ஒ', 'Au':'ஔ', 'au':'ஔ',
    'k':'க்', 'K':'க்', 'c':'ச்', 'C':'ச்', 't':'ட்', 'T':'ட்', 'th':'த்', 'Th':'த்',
    'p':'ப்', 'P':'ப்', 'm':'ம்', 'M':'ம்', 'y':'ய்', 'Y':'ய்', 'r':'ர்', 'R':'ர்',
    'l':'ல்', 'L':'ல்', 'v':'வ்', 'V':'வ்', 's':'ஸ்', 'S':'ஸ்', 'h':'ஹ்', 'H':'ஹ்',
    'n':'ன்', 'N':'ன்', 'j':'ஜ்', 'J':'ஜ்', 'g':'க்', 'G':'க்', 'd':'ட்', 'D':'ட்',
    'b':'ப்', 'B':'ப்'
}

def basic_translit_ta(text):
    return text  # For simplicity, I'll just use a generic mapping or I can just use indic_transliteration

from indic_transliteration import sanscript
def transliterate(text, dest_lang):
    if dest_lang == 'ta':
        scheme = sanscript.TAMIL
    else:
        scheme = sanscript.DEVANAGARI
    # indic_transliteration requires precise ITRANS, but for general English it might fail.
    # Let's just use it as a fallback.
    return sanscript.transliterate(text, sanscript.ITRANS, scheme)

# To perfectly solve "Remove mixed-language rendering completely":
# I'll modify the `renderDistrictList` and `renderAreaList` JS code to not render the English sublabel.
