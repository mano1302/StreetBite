import re

with open("script.js", "r", encoding="utf-8") as f:
    js = f.read()

# Revert SVGs inside translation strings
# Specifically, we find any string value in ta, hi, en that starts with '<svg'
# and strip the <svg> tag from it.

def remove_svg(match):
    full_string = match.group(0)
    # Remove the <svg ...</svg> part
    cleaned = re.sub(r'<svg.*?</svg>\s*', '', full_string)
    return cleaned

# Match string literals that contain <svg
js_cleaned = re.sub(r"'(<svg.*?</svg>)\s*(.*?)'", r"'\2'", js)
js_cleaned = re.sub(r'"(<svg.*?</svg>)\s*(.*?)"', r'"\2"', js_cleaned)
js_cleaned = re.sub(r"`(<svg.*?</svg>)\s*(.*?)`", r"`\2`", js_cleaned)

with open("script.js", "w", encoding="utf-8") as f:
    f.write(js_cleaned)

print("Reverted SVGs in strings.")
