from transliteration_service import transliterate

test_cases = [
    ("Chicken Puffs", "ta"),
    ("Chicken Puffs", "hi"),
    ("Veg Puffs", "ta"),
    ("Veg Puffs", "hi"),
    ("Egg Puffs", "ta"),
    ("Egg Puffs", "hi"),
    ("Puffs", "hi")
]

with open("translit_results_v2.txt", "w", encoding="utf-8") as f:
    for text, lang in test_cases:
        result = transliterate(text, lang)
        f.write(f"[{lang}] {text} -> {result}\n")
print("Results written to translit_results_v2.txt")
