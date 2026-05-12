from transliteration_service import transliterate

test_cases = [
    ("Amma Fresh Juice Shop", "ta"),
    ("Mano drinks", "ta"),
    ("Mano drinks", "hi"),
    ("Chicken Puffs", "ta"),
    ("Egg Puffs", "hi"),
    ("StreetBite Cafe", "ta")
]

with open("final_test_results.txt", "w", encoding="utf-8") as f:
    for text, lang in test_cases:
        result = transliterate(text, lang)
        f.write(f"[{lang}] {text} -> {result}\n")
print("Results written to final_test_results.txt")
