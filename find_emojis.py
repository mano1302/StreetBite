import re

with open('script.js', 'r', encoding='utf-8') as f:
    text = f.read()

# basic regex to find emojis
import emoji
def extract_emojis(s):
    return ''.join(c for c in s if c in emoji.EMOJI_DATA)

found = extract_emojis(text)
print("Emojis found:", set(found))
