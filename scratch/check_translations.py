
import re
import json

def check_missing_translations(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract tamilNaduDistricts
    dist_match = re.search(r'const tamilNaduDistricts = \{(.*?)\};', content, re.DOTALL)
    if not dist_match:
        print("Could not find tamilNaduDistricts")
        return
    
    dist_str = "{" + dist_match.group(1).replace("'", '"') + "}"
    # Basic cleanup for JSON parsing
    dist_str = re.sub(r',\s*\}', '}', dist_str)
    districts = json.loads(dist_str)

    # Extract areaNamesLocalized
    area_match = re.search(r'const areaNamesLocalized = \{(.*?)\};', content, re.DOTALL)
    if not area_match:
        print("Could not find areaNamesLocalized")
        return
    
    # We need to extract the 'ta' and 'hi' sub-objects
    ta_match = re.search(r'ta: \{(.*?)\}', area_match.group(1), re.DOTALL)
    hi_match = re.search(r'hi: \{(.*?)\}', area_match.group(1), re.DOTALL)

    def parse_dict(s):
        d = {}
        for line in s.split('\n'):
            line = line.strip()
            if ':' in line:
                m = re.search(r"'(.*?)':'(.*?)'", line)
                if m:
                    d[m.group(1)] = m.group(2)
        return d

    ta_map = parse_dict(ta_match.group(1)) if ta_match else {}
    hi_map = parse_dict(hi_match.group(1)) if hi_match else {}

    all_areas = set()
    for areas in districts.values():
        all_areas.update(areas)

    missing_ta = []
    missing_hi = []

    for area in all_areas:
        if area not in ta_map:
            missing_ta.append(area)
        if area not in hi_map:
            missing_hi.append(area)

    print(f"Total Unique Areas: {len(all_areas)}")
    print(f"Missing in TA ({len(missing_ta)}): {missing_ta[:10]}...")
    print(f"Missing in HI ({len(missing_hi)}): {missing_hi[:10]}...")

check_missing_translations('static/script.js')
