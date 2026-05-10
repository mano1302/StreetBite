import re
import json
import urllib.request
import urllib.parse
import time

with open("script.js", "r", encoding="utf-8") as f:
    js_code = f.read()

districts_match = re.search(r'const tamilNaduDistricts\s*=\s*(\{.*?\});', js_code, re.DOTALL)
districts_str = districts_match.group(1).replace("'", '"')
districts = json.loads(districts_str)

all_areas = set()
for d, areas in districts.items():
    all_areas.update(areas)

areas_list = list(all_areas)
print(f"Translating {len(areas_list)} areas using Google Translate API...")

def translate_gtx(text, target_lang):
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target_lang}&dt=t&q={urllib.parse.quote(text)}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data[0][0][0]
    except Exception as e:
        print("Failed:", text, e)
        return text

ta_dict = {}
hi_dict = {}
for i, area in enumerate(areas_list):
    ta_dict[area] = translate_gtx(area, 'ta')
    hi_dict[area] = translate_gtx(area, 'hi')
    if (i+1) % 50 == 0:
        print(f"Done {i+1}/{len(areas_list)}")
    time.sleep(0.05)

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

print("Done! script.js updated.")
