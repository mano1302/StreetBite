from transliteration_service import transliterate

test_cases = [
    ("Amma Hotel", "ta"),
    ("Amma Hotel", "hi"),
    ("Masala Dosa", "ta"),
    ("Masala Dosa", "hi"),
    ("Chicken Biryani", "ta"),
    ("Chicken Biryani", "hi"),
    ("New Shop", "ta"),
    ("New Shop", "hi")
]

with open("translit_results.txt", "w", encoding="utf-8") as f:
    for text, lang in test_cases:
        result = transliterate(text, lang)
        f.write(f"[{lang}] {text} -> {result}\n")
print("Results written to translit_results.txt")
