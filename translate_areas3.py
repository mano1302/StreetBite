import re
import json
from concurrent.futures import ThreadPoolExecutor
from deep_translator import GoogleTranslator

with open("script.js", "r", encoding="utf-8") as f:
    js_code = f.read()

districts_match = re.search(r'const tamilNaduDistricts\s*=\s*(\{.*?\});', js_code, re.DOTALL)
districts_str = districts_match.group(1).replace("'", '"')
districts = json.loads(districts_str)

all_areas = set()
for d, areas in districts.items():
    all_areas.update(areas)

areas_list = list(all_areas)
print(f"Translating {len(areas_list)} areas concurrently...")

def translate_ta(word):
    try:
        return GoogleTranslator(source='en', target='ta').translate(word)
    except:
        return word

def translate_hi(word):
    try:
        return GoogleTranslator(source='en', target='hi').translate(word)
    except:
        return word

with ThreadPoolExecutor(max_workers=50) as executor:
    ta_translations = list(executor.map(translate_ta, areas_list))

with ThreadPoolExecutor(max_workers=50) as executor:
    hi_translations = list(executor.map(translate_hi, areas_list))

ta_dict = {area: trans for area, trans in zip(areas_list, ta_translations)}
hi_dict = {area: trans for area, trans in zip(areas_list, hi_translations)}

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
