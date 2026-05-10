import re
import json
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

# Convert to list to keep order stable
areas_list = list(all_areas)

print(f"Translating {len(areas_list)} areas...")

translator_ta = GoogleTranslator(source='en', target='ta')
translator_hi = GoogleTranslator(source='en', target='hi')

# Batch translate
ta_translations = translator_ta.translate_batch(areas_list)
hi_translations = translator_hi.translate_batch(areas_list)

ta_dict = {area: trans for area, trans in zip(areas_list, ta_translations)}
hi_dict = {area: trans for area, trans in zip(areas_list, hi_translations)}

# We must replace the old areaNamesLocalized object in script.js with the new complete one.
# Format the dictionaries nicely
def format_dict(d):
    lines = []
    for k, v in d.items():
        # Escape quotes if any
        v_clean = str(v).replace("'", "\\'")
        lines.append(f"        '{k}':'{v_clean}'")
    return "{\n" + ",\n".join(lines) + "\n    }"

new_area_names_localized = f"""const areaNamesLocalized = {{
    ta: {format_dict(ta_dict)},
    hi: {format_dict(hi_dict)}
}};"""

# Replace in script.js
new_js = re.sub(r'const areaNamesLocalized\s*=\s*\{.*?\n\s*hi:\s*\{.*?\}\n\};', new_area_names_localized, js_code, flags=re.DOTALL)

with open("script.js", "w", encoding="utf-8") as f:
    f.write(new_js)

print("Translation successful and script.js updated!")
