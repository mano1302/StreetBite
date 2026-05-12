import requests
import re

# Manual keyword mapping for better results (sync with script.js dynamicTranslations)
DYNAMIC_TRANSLATIONS = {
    'Dosa': { 'ta': 'தோசை', 'hi': 'डोसा' },
    'Idli': { 'ta': 'இட்லி', 'hi': 'इडली' },
    'Vada': { 'ta': 'வடை', 'hi': 'वड़ा' },
    'Samosa': { 'ta': 'சமோசா', 'hi': 'समोसा' },
    'Biryani': { 'ta': 'பிரியாணி', 'hi': 'बिरयानी' },
    'Parotta': { 'ta': 'பரோட்டா', 'hi': 'परोठा' },
    'Noodles': { 'ta': 'நூடுல்ஸ்', 'hi': 'नूडल्स' },
    'Fried Rice': { 'ta': 'ப்ரைடு ரைஸ்', 'hi': 'फ्राइड राइस' },
    'Omelette': { 'ta': 'ஆம்லெட்', 'hi': 'आमलेट' },
    'Bread Omelette': { 'ta': 'பிரட் ஆம்லெட்', 'hi': 'ब्रेड आमलेट' },
    'Poori': { 'ta': 'பூரி', 'hi': 'पूरी' },
    'Pongal': { 'ta': 'பொங்கல்', 'hi': 'पोंगल' },
    'Meals': { 'ta': 'சாப்பாடு', 'hi': 'भोजन' },
    'Chicken': { 'ta': 'சிக்கன்', 'hi': 'चिकन' },
    'Mutton': { 'ta': 'மட்டன்', 'hi': 'मटन' },
    'Fish': { 'ta': 'மீன்', 'hi': 'मछली' },
    'Egg': { 'ta': 'முட்டை', 'hi': 'अंडा' },
    'Veg': { 'ta': 'வெஜ்', 'hi': 'वेज' },
    'Non-Veg': { 'ta': 'நான்-வெஜ்', 'hi': 'नॉन-वेज' },
    'Tea': { 'ta': 'டீ', 'hi': 'चाय' },
    'Coffee': { 'ta': 'காபி', 'hi': 'कॉफी' },
    'Milk': { 'ta': 'பால்', 'hi': 'दूध' },
    'Juice': { 'ta': 'ஜூஸ்', 'hi': 'जूस' },
    'Water': { 'ta': 'தண்ணீர்', 'hi': 'पानी' },
    'Rose Milk': { 'ta': 'ரோஸ் மில்க்', 'hi': 'रोज मिल्क' },
    'Badam Milk': { 'ta': 'பாதாம் பால்', 'hi': 'बादाम दूध' },
    'Chai': { 'ta': 'டீ', 'hi': 'चाय' },
    'Pav Bhaji': { 'ta': 'பாவ் பாஜி', 'hi': 'पाव भाजी' },
    'Pani Puri': { 'ta': 'பாணி பூரி', 'hi': 'पानी पूरी' },
    'Bhel Puri': { 'ta': 'பெல் பூரி', 'hi': 'भेल पूरी' },
    'Chat': { 'ta': 'சாட்', 'hi': 'चाट' },
    'Chilli': { 'ta': 'சில்லி', 'hi': 'चिली' },
    'Manchurian': { 'ta': 'மஞ்சூரியன்', 'hi': 'मंचூர்ियन' },
    'Soup': { 'ta': 'சூப்', 'hi': 'सूप' },
    'Ice Cream': { 'ta': 'ஐஸ் கிரீம்', 'hi': 'आइसक्रीम' },
    'Shop': { 'ta': 'கடை', 'hi': 'दुकान' },
    'Stall': { 'ta': 'கடை', 'hi': 'स्टॉल' },
    'Hotel': { 'ta': 'ஹோட்டல்', 'hi': 'होटल' },
    'Mess': { 'ta': 'மெஸ்', 'hi': 'मेस' },
    'Tiffin Centre': { 'ta': 'டிஃபின் சென்டர்', 'hi': 'टिफिन सेंटर' },
    'Snacks': { 'ta': 'சிற்றுண்டி', 'hi': 'नाश्ता' },
    'Others': { 'ta': 'மற்றவை', 'hi': 'अन्य' },
    'Puffs': { 'ta': 'பஃப்ஸ்', 'hi': 'पफ्स' },
    'Egg Puffs': { 'ta': 'முட்டை பஃப்ஸ்', 'hi': 'एग पफ्स' },
    'Veg Puffs': { 'ta': 'வெஜ் பஃப்ஸ்', 'hi': 'वेज पफ्स' },
    'Chicken Puffs': { 'ta': 'சிக்கன் பஃப்ஸ்', 'hi': 'चिकन पफ्स' },
    'Sandwich': { 'ta': 'சாண்ட்விச்', 'hi': 'सैंडविच' },
    'Momos': { 'ta': 'மோமோஸ்', 'hi': 'मोमोज' },
    'Burger': { 'ta': 'பர்கர்', 'hi': 'बर्गर' },
    'Pizza': { 'ta': 'பிட்சா', 'hi': 'पिज्जा' },
    'Pasta': { 'ta': 'பாஸ்தா', 'hi': 'पास्ता' },
    'Milkshake': { 'ta': 'மில்க் ஷேக்', 'hi': 'मिल्कशेक' },
    'Brownie': { 'ta': 'பிரவுனி', 'hi': 'ब्राउनी' },
    'Roll': { 'ta': 'ரோல்', 'hi': 'रोल' },
    'Spring Roll': { 'ta': 'ஸ்பிரிங் ரோல்', 'hi': 'स्प्रिंग रोल' },
    'Cutlet': { 'ta': 'கட்லெட்', 'hi': 'कटलेट' },
    'Maggi': { 'ta': 'மேகி', 'hi': 'मैगी' },
    'Mojito': { 'ta': 'மொகித்தோ', 'hi': 'मोजितो' },
    'Shake': { 'ta': 'ஷேக்', 'hi': 'शेक' },
    'Sweets': { 'ta': 'ஸ்வீட்ஸ்', 'hi': 'स्वीट्स' },
    'Cool Bar': { 'ta': 'கூல் பார்', 'hi': 'कूल बार' }
}

def transliterate(text, target_lang):
    """
    Transliterate English text to Tamil (ta) or Hindi (hi) using Google Input Tools API.
    """
    if not text or target_lang == 'en':
        return text

    # 1. Check for manual mapping first
    # Process text word-by-word or full match
    processed_text = text
    
    # Sort keys by length descending to match longer phrases first (e.g., "Chicken Puffs" before "Chicken")
    sorted_keys = sorted(DYNAMIC_TRANSLATIONS.keys(), key=len, reverse=True)
    
    for key in sorted_keys:
        trans = DYNAMIC_TRANSLATIONS[key]
        if trans.get(target_lang):
            # Case-insensitive word boundary replacement
            pattern = re.compile(rf'\b{re.escape(key)}\b', re.IGNORECASE)
            processed_text = pattern.sub(trans[target_lang], processed_text)

    # If the whole string is now non-English, return it
    if not any(c.isalpha() for c in processed_text):
        return processed_text

    # 2. Call Google Input Tools API for remaining parts
    itc_map = { 'ta': 'ta-t-i0-und', 'hi': 'hi-t-i0-und' }
    itc = itc_map.get(target_lang)
    if not itc:
        return processed_text

    try:
        url = "https://inputtools.google.com/request"
        params = {
            'text': processed_text,
            'itc': itc,
            'num': 1,
            'cp': 0,
            'cs': 1,
            'ie': 'utf-8',
            'oe': 'utf-8',
            'app': 'test'
        }
        response = requests.get(url, params=params, timeout=5)
        data = response.json()

        if data and data[0] == 'SUCCESS' and data[1]:
            result = ""
            for part in data[1]:
                if part[1] and len(part[1]) > 0:
                    result += part[1][0]
            
            # Clean up extra spaces if any
            result = result.strip()
            if result:
                return result
    except Exception as e:
        print(f"Transliteration error for {text} to {target_lang}: {e}")
    
    return processed_text

def get_localized_data(text):
    """Returns a dict with ta and hi transliterations."""
    return {
        'ta': transliterate(text, 'ta'),
        'hi': transliterate(text, 'hi')
    }
