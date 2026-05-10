import re
import json

with open("script.js", "r", encoding="utf-8") as f:
    js_code = f.read()

# Extract tamilNaduDistricts
districts_match = re.search(r'const tamilNaduDistricts\s*=\s*(\{.*?\});', js_code, re.DOTALL)
if districts_match:
    districts_str = districts_match.group(1)
    # very simple evaluation
    districts_str = re.sub(r'\'', '"', districts_str)
    districts = json.loads(districts_str)
    all_areas = set()
    for d, areas in districts.items():
        all_areas.update(areas)
    print("Found", len(all_areas), "areas")
    
    # Extract areaNamesLocalized
    areas_match = re.search(r'const areaNamesLocalized\s*=\s*(\{.*?\});', js_code, re.DOTALL)
    if areas_match:
        areas_str = areas_match.group(1)
        areas_str = re.sub(r'\'', '"', areas_str)
        # Handle trailing commas or unquoted keys if necessary, but it looks well-formed
        areas_localized = json.loads(areas_str)
        ta_dict = areas_localized['ta']
        hi_dict = areas_localized['hi']
        
        missing_ta = [a for a in all_areas if a not in ta_dict]
        print("Missing ta:", len(missing_ta))
