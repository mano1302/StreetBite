
import re
content = open('static/script.js','r',encoding='utf-8').read()
m = re.search(r'const tamilNaduDistricts = \{(.*?)\};', content, re.DOTALL)
keys = sorted([k.strip().strip("'").strip('"') for k in re.findall(r"['\"](.*?)['\"]\s*:", m.group(1))])
print(len(keys))
print(keys)
