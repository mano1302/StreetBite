import re
import json
import time
from deep_translator import GoogleTranslator

with open("script.js", "r", encoding="utf-8") as f:
    js_code = f.read()

districts_match = re.search(r'const tamilNaduDistricts\s*=\s*(\{.*?\});', js_code, re.DOTALL)
if not districts_match:
    print("Could not find districts")
    exit(1)

districts_str = districts_match.group(1).replace("'", '"')
districts = json.loads(districts_str)

all_areas = set()
for d, areas in districts.items():
    all_areas.update(areas)

areas_list = list(all_areas)

print(f"Translating {len(areas_list)} areas...")

translator_ta = GoogleTranslator(source='en', target='ta')
translator_hi = GoogleTranslator(source='en', target='hi')

ta_dict = {}
hi_dict = {}

for i, area in enumerate(areas_list):
    try:
        ta_trans = translator_ta.translate(area)
        hi_trans = translator_hi.translate(area)
    except Exception as e:
        print("Error on", area, e)
        ta_trans = area
        hi_trans = area
    ta_dict[area] = ta_trans
    hi_dict[area] = hi_trans
    if i % 20 == 0:
        print(f"Translated {i}/{len(areas_list)}...")

def format_dict(d):
    lines = []
    for k, v in d.items():
        v_clean = str(v).replace("'", "\\'")
        lines.append(f"        '{k}':'{v_clean}'")
    return "{\n" + ",\n".join(lines) + "\n    }"

new_area_names_localized = f"""const areaNamesLocalized = {{
    ta: {format_dict(ta_dict)},
    hi: {format_dict(hi_dict)}
}};"""

new_js = re.sub(r'const areaNamesLocalized\s*=\s*\{.*?\n\s*hi:\s*\{.*?\}\n\};', new_area_names_localized, js_code, flags=re.DOTALL)

with open("script.js", "w", encoding="utf-8") as f:
    f.write(new_js)

print("Translation successful and script.js updated!")
