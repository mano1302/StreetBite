import requests
import re

# Manual keyword mapping for high-quality results
DYNAMIC_TRANSLATIONS = {
    'Dosa': { 'ta': 'தோசை', 'hi': 'डोसा' },
    'Idli': { 'ta': 'இட்லி', 'hi': 'इडली' },
    'Vada': { 'ta': 'வடை', 'hi': 'वड़ा' },
    'Samosa': { 'ta': 'சமோசா', 'hi': 'समोसा' },
    'Biryani': { 'ta': 'பிரியாணி', 'hi': 'बिरயானி' },
    'Parotta': { 'ta': 'பரோட்டா', 'hi': 'पரோठा' },
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
    'Badam Milk': { 'ta': 'பாதாம் பால்', 'hi': 'बादாம் दूध' },
    'Chai': { 'ta': 'டீ', 'hi': 'चाय' },
    'Pav Bhaji': { 'ta': 'பாவ் பாஜி', 'hi': 'पाव भाजी' },
    'Pani Puri': { 'ta': 'பாணி பூரி', 'hi': 'पानी पूरी' },
    'Bhel Puri': { 'ta': 'பெல் பூரி', 'hi': 'भेल पूरी' },
    'Chat': { 'ta': 'சாட்', 'hi': 'चाट' },
    'Chilli': { 'ta': 'சில்லி', 'hi': 'चिली' },
    'Manchurian': { 'ta': 'மஞ்சூரியன்', 'hi': 'मंचूरियन' },
    'Soup': { 'ta': 'சூப்', 'hi': 'सूप' },
    'Ice Cream': { 'ta': 'ஐஸ் கிரீம்', 'hi': 'आइसक्रीम' },
    'Shop': { 'ta': 'ஷாப்', 'hi': 'शॉप' },
    'Stall': { 'ta': 'ஸ்டால்', 'hi': 'स्टॉल' },
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
    'Cool Bar': { 'ta': 'கூல் பார்', 'hi': 'कूल बार' },
    'Corner': { 'ta': 'கார்னர்', 'hi': 'कॉर्नर' },
    'Point': { 'ta': 'பாயிண்ட்', 'hi': 'पॉइंट' },
    'Cafe': { 'ta': 'கபே', 'hi': 'कैफे' },
    'Restaurant': { 'ta': 'ரெஸ்டாரண்ட்', 'hi': 'रेस्टोरेंट' },
    'Fast Food': { 'ta': 'ஃபாஸ்ட் ஃபுட்', 'hi': 'फास्ट फूड' },
    'Bakery': { 'ta': 'பேக்கரி', 'hi': 'बेकरी' },
    'Drinks': { 'ta': 'டிரிங்க்ஸ்', 'hi': 'ड्रिंक्स' },
    'Cool': { 'ta': 'கூல்', 'hi': 'कूल' },
    'Fresh': { 'ta': 'ப்ரெஷ்', 'hi': 'फ्रेश' },
    'Special': { 'ta': 'ஸ்பெஷல்', 'hi': 'स्पेशल' },
    'Grand': { 'ta': 'கிராண்ட்', 'hi': 'ग्रैंड' },
    'New': { 'ta': 'நியூ', 'hi': 'न्यू' },
    'Classic': { 'ta': 'கிளாசிக்', 'hi': 'क्लासिक' },
    'Street': { 'ta': 'ஸ்ட்ரீட்', 'hi': 'स्ट्रीट' },
    'Bite': { 'ta': 'பைட்', 'hi': 'बைட்' },
    'Taste': { 'ta': 'டேஸ்ட்', 'hi': 'टेस्ट' },
    'Tasty': { 'ta': 'டேஸ்டி', 'hi': 'टेस्टी' },
    'Yummy': { 'ta': 'யம்மி', 'hi': 'यम्मी' },
    'Sweet': { 'ta': 'ஸ்வீட்', 'hi': 'स्वीट' },
    'Spicy': { 'ta': 'ஸ்பைசி', 'hi': 'स्पाइसी' },
    'Hot': { 'ta': 'ஹாட்', 'hi': 'हॉट' },
    'King': { 'ta': 'கிங்', 'hi': 'किंग' },
    'Queen': { 'ta': 'குவீன்', 'hi': 'क्वीन' },
    'Master': { 'ta': 'மாஸ்டர்', 'hi': 'मास्टर' },
    'Kitchen': { 'ta': 'கிச்சன்', 'hi': 'किचन' },
    'House': { 'ta': 'ஹவுஸ்', 'hi': 'हाउस' },
    'World': { 'ta': 'வேர்ல்ட்', 'hi': 'वर्ल्ड' },
    'Zone': { 'ta': 'ஜோன்', 'hi': 'जोन' },
    'Land': { 'ta': 'லேண்ட்', 'hi': 'लैंड' },
    'Hub': { 'ta': 'ஹப்', 'hi': 'हब' },
    'Spot': { 'ta': 'ஸ்பாட்', 'hi': 'स्पॉट' }
}

def call_google_api(text, itc):
    """Internal helper to call Google Input Tools API."""
    try:
        url = "https://inputtools.google.com/request"
        params = {
            'text': text,
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
            return result.strip()
    except Exception as e:
        print(f"API Error: {e}")
    return text

def transliterate(text, target_lang):
    """
    Robust transliteration that splits text into parts to ensure 
    high-quality phonetic conversion of English segments.
    """
    if not text or target_lang == 'en':
        return text

    # 1. Manual keyword mapping first (Longest phrases first)
    processed_text = text
    sorted_keys = sorted(DYNAMIC_TRANSLATIONS.keys(), key=len, reverse=True)
    
    # We use a placeholder system to avoid re-transliterating already mapped parts
    placeholders = {}
    for i, key in enumerate(sorted_keys):
        trans = DYNAMIC_TRANSLATIONS[key]
        if trans.get(target_lang):
            # Case-insensitive word boundary replacement with lookahead/lookbehind for delimiters
            pattern = re.compile(rf'(?i)\b{re.escape(key)}\b')
            if pattern.search(processed_text):
                placeholder = f"__PH_{i}__"
                placeholders[placeholder] = trans[target_lang]
                processed_text = pattern.sub(placeholder, processed_text)

    # 2. Transliterate remaining English parts using API
    itc_map = { 'ta': 'ta-t-i0-und', 'hi': 'hi-t-i0-und' }
    itc = itc_map.get(target_lang)
    
    if itc:
        # Split by placeholders to find pure English segments
        segments = re.split(r'(__PH_\d+__)', processed_text)
        final_segments = []
        for seg in segments:
            if seg in placeholders:
                final_segments.append(placeholders[seg])
            elif any(c.isalpha() for c in seg):
                # This segment contains English — transliterate it
                final_segments.append(call_google_api(seg, itc))
            else:
                final_segments.append(seg)
        processed_text = "".join(final_segments)
    else:
        # Fallback: just restore placeholders
        for ph, val in placeholders.items():
            processed_text = processed_text.replace(ph, val)

    return processed_text.strip()

def get_localized_data(text):
    """Returns a dict with ta and hi transliterations."""
    return {
        'ta': transliterate(text, 'ta'),
        'hi': transliterate(text, 'hi')
    }
