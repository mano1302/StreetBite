import requests
import re

# Manual keyword mapping for high-quality results (strictly PHONETIC transliterations)
DYNAMIC_TRANSLATIONS = {
    'Dosa': { 'ta': 'தோசை', 'hi': 'डोसा' },
    'Idli': { 'ta': 'இட்லி', 'hi': 'इडली' },
    'Vada': { 'ta': 'வடை', 'hi': 'वड़ा' },
    'Samosa': { 'ta': 'சமோசா', 'hi': 'समोसा' },
    'Biryani': { 'ta': 'பிரியாணி', 'hi': 'बिरयानी' },
    'Parotta': { 'ta': 'பரோட்டா', 'hi': 'परोटा' },
    'Noodles': { 'ta': 'நூடுல்ஸ்', 'hi': 'नूडल्स' },
    'Fried Rice': { 'ta': 'ப்ரைடு ரைஸ்', 'hi': 'फ्राइड राइस' },
    'Omelette': { 'ta': 'ஆம்லெட்', 'hi': 'आमलेट' },
    'Bread Omelette': { 'ta': 'பிரட் ஆம்லெட்', 'hi': 'ब्रेड आमलेट' },
    'Poori': { 'ta': 'பூரி', 'hi': 'पूरी' },
    'Pongal': { 'ta': 'பொங்கல்', 'hi': 'पोंगल' },
    'Meals': { 'ta': 'மீல்ஸ்', 'hi': 'मील्स' },
    'Chicken': { 'ta': 'சிக்கன்', 'hi': 'चिकन' },
    'Mutton': { 'ta': 'மட்டன்', 'hi': 'मटन' },
    'Fish': { 'ta': 'பிஷ்', 'hi': 'फिश' },
    'Egg': { 'ta': 'எக்', 'hi': 'एग' },
    'Veg': { 'ta': 'வெஜ்', 'hi': 'वेज' },
    'Non-Veg': { 'ta': 'நான்-வெஜ்', 'hi': 'नॉन-वेज' },
    'Tea': { 'ta': 'டீ', 'hi': 'टी' },
    'Coffee': { 'ta': 'காபி', 'hi': 'कॉफी' },
    'Milk': { 'ta': 'மில்க்', 'hi': 'मिल्क' },
    'Juice': { 'ta': 'ஜூஸ்', 'hi': 'जूस' },
    'Water': { 'ta': 'வாட்டர்', 'hi': 'वाटर' },
    'Rose Milk': { 'ta': 'ரோஸ் மில்க்', 'hi': 'रोज मिल्क' },
    'Badam Milk': { 'ta': 'பாதாம் மில்க்', 'hi': 'बादाम मिल्क' },
    'Chai': { 'ta': 'டீ', 'hi': 'टी' },
    'Pav Bhaji': { 'ta': 'பாவ் பாஜி', 'hi': 'पाव भाजी' },
    'Pani Puri': { 'ta': 'பாணி பூரி', 'hi': 'पानी पूरी' },
    'Bhel Puri': { 'ta': 'பெல் பூரி', 'hi': 'भेल पूरी' },
    'Chat': { 'ta': 'சாட்', 'hi': 'चाट' },
    'Chilli': { 'ta': 'சில்லி', 'hi': 'चिली' },
    'Manchurian': { 'ta': 'மஞ்சூரியன்', 'hi': 'मंचूरियन' },
    'Soup': { 'ta': 'சூப்', 'hi': 'सूप' },
    'Ice Cream': { 'ta': 'ஐஸ் கிரீம்', 'hi': 'आइसक्रीम' },
    'Kadalai': { 'ta': 'கடலை', 'hi': 'कडलई' },
    'Kool': { 'ta': 'கூல்', 'hi': 'कूल' },
    'Idiyappam': { 'ta': 'இடியாப்பம்', 'hi': 'इडियप्पम' },
    'Appam': { 'ta': 'ஆப்பம்', 'hi': 'अप्पम' },
    'Puttu': { 'ta': 'புட்டு', 'hi': 'पुट्टू' },
    'Murukku': { 'ta': 'முறுக்கு', 'hi': 'मुरुक्कू' },
    'Sundal': { 'ta': 'சுண்டல்', 'hi': 'सुंडल' },
    'Bajji': { 'ta': 'பஜ்ஜி', 'hi': 'बज्जी' },
    'Bonda': { 'ta': 'போண்டா', 'hi': 'बोंடா' },
    'Aththo': { 'ta': 'அத்தோ', 'hi': 'अत्தோ' },
    'Bejo': { 'ta': 'பெஜோ', 'hi': 'बेजो' },
    'Mohinga': { 'ta': 'மோகிங்கா', 'hi': 'मोहिंंगा' },
    'Kalakki': { 'ta': 'கலக்கி', 'hi': 'कलक्की' },
    'Kizhi': { 'ta': 'கிழி', 'hi': 'किजी' },
    'Bun': { 'ta': 'பன்', 'hi': 'बन' },
    'Butter': { 'ta': 'பட்டர்', 'hi': 'बटर' },
    'Jam': { 'ta': 'ஜாம்', 'hi': 'जाम' },
    'Kulfi': { 'ta': 'குல்பி', 'hi': 'कुल्फी' },
    'Jigarthanda': { 'ta': 'ஜிகர்தண்டா', 'hi': 'जिगरठंडा' },
    'Halwa': { 'ta': 'அல்வா', 'hi': 'हलवा' },
    'Ladoo': { 'ta': 'லட்டு', 'hi': 'लड्डू' },
    'Jalebi': { 'ta': 'ஜிலேபி', 'hi': 'जलेबी' },
    'Pakoda': { 'ta': 'பக்கோடா', 'hi': 'पकोड़ा' },
    'Vadai': { 'ta': 'வடை', 'hi': 'वड़ा' },
    'Nellai': { 'ta': 'நெல்லை', 'hi': 'नेल्लई' },
    'Madurai': { 'ta': 'மதுரை', 'hi': 'मदुरई' },
    'Chennai': { 'ta': 'சென்னை', 'hi': 'चेन्नई' },
    'Madras': { 'ta': 'மெட்ராஸ்', 'hi': 'मद्रास' },
    'Bombay': { 'ta': 'பாம்பே', 'hi': 'बॉम्बे' },
    'Chettinadu': { 'ta': 'செட்டிநாடு', 'hi': 'चेट्टीनाडु' },
    'Karaikudi': { 'ta': 'காரைக்குடி', 'hi': 'काराइकुडी' },
    'Dindigul': { 'ta': 'திண்டுக்கல்', 'hi': 'डिंडीगुल' },
    'Ambur': { 'ta': 'ஆம்பூர்', 'hi': 'आम्बुर' },
    'Vaniyambadi': { 'ta': 'வாணியம்பாடி', 'hi': 'वाणियमबाड़ी' },
    'Thalappakatti': { 'ta': 'தலப்பாக்கட்டி', 'hi': 'थलप्पकट्टी' },
    'Saravana': { 'ta': 'சரவண', 'hi': 'सरवण' },
    'Annapoorna': { 'ta': 'அன்னபூர்ணா', 'hi': 'अन्नपूर्णा' },
    'Lakshmi': { 'ta': 'லட்சுமி', 'hi': 'लक्ष्मी' },
    'Ganesh': { 'ta': 'கணேஷ்', 'hi': 'गणेश' },
    'Murugan': { 'ta': 'முருகன்', 'hi': 'मुरुगन' },
    'Vilas': { 'ta': 'விலாஸ்', 'hi': 'विलास' },
    'Bhavan': { 'ta': 'பவன்', 'hi': 'भवन' },
    'Canteen': { 'ta': 'கேண்டீன்', 'hi': 'कैंटीन' },
    'Eatery': { 'ta': 'ஈட்டரி', 'hi': 'ईटरी' },
    'Dhaba': { 'ta': 'தாபா', 'hi': 'ढाबा' },
    'Tea Stall': { 'ta': 'டீ ஸ்டால்', 'hi': 'टी स्टॉल' },
    'Coffee Bar': { 'ta': 'காபி பார்', 'hi': 'कॉफी बार' },
    'Shop': { 'ta': 'ஷாப்', 'hi': 'शॉप' },
    'Stall': { 'ta': 'ஸ்டால்', 'hi': 'स्टॉल' },
    'Hotel': { 'ta': 'ஹோட்டல்', 'hi': 'होटल' },
    'Mess': { 'ta': 'மெஸ்', 'hi': 'मेस' },
    'Tiffin Centre': { 'ta': 'டிஃபின் சென்டர்', 'hi': 'टिफिन सेंटर' },
    'Snacks': { 'ta': 'ஸ்நாக்ஸ்', 'hi': 'स्नैक्स' },
    'Others': { 'ta': 'அதர்ஸ்', 'hi': 'अदर्स' },
    'Puffs': { 'ta': 'பஃப்ஸ்', 'hi': 'पफ्स' },
    'Egg Puffs': { 'ta': 'எக் பஃப்ஸ்', 'hi': 'एग पफ्स' },
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
    'Bite': { 'ta': 'பைட்', 'hi': 'बाइट' },
    'StreetBite': { 'ta': 'ஸ்ட்ரீட்பைட்', 'hi': 'स्ट्रीटबाइट' },
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
    if not any(c.isalpha() for c in text):
        return text
        
    try:
        url = "https://inputtools.google.com/request"
        params = {
            'text': text.strip(),
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
            
            # Restore surrounding spaces
            prefix = re.match(r'^\s*', text).group()
            suffix = re.search(r'\s*$', text).group()
            return f"{prefix}{result.strip()}{suffix}"
    except Exception as e:
        print(f"API Error: {e}")
    return text

# Cache for transliterations to speed up repeated calls
_trans_cache = {}

def transliterate(text, target_lang):
    """
    Robust transliteration that splits text into parts to ensure 
    high-quality phonetic conversion of English segments.
    """
    if not text or target_lang == 'en':
        return text

    cache_key = f"{text}_{target_lang}"
    if cache_key in _trans_cache:
        return _trans_cache[cache_key]

    # 1. Manual keyword mapping first (Longest phrases first)
    processed_text = text
    sorted_keys = sorted(DYNAMIC_TRANSLATIONS.keys(), key=len, reverse=True)
    
    # We use a placeholder system to avoid re-transliterating already mapped parts
    placeholders = {}
    for i, key in enumerate(sorted_keys):
        trans = DYNAMIC_TRANSLATIONS[key]
        if trans.get(target_lang):
            pattern = re.compile(rf'(?i)\b{re.escape(key)}\b')
            if pattern.search(processed_text):
                placeholder = f" __PH_{i}__ " # Add spaces to ensure word boundary for splitting
                placeholders[placeholder.strip()] = trans[target_lang]
                processed_text = pattern.sub(placeholder, processed_text)

    # 2. Transliterate remaining English parts using API
    itc_map = { 'ta': 'ta-t-i0-und', 'hi': 'hi-t-i0-und' }
    itc = itc_map.get(target_lang)
    
    if itc:
        # Split by placeholders
        segments = re.split(r'(__PH_\d+__)', processed_text)
        final_segments = []
        for seg in segments:
            stripped = seg.strip()
            if stripped in placeholders:
                final_segments.append(placeholders[stripped])
            elif any(c.isalpha() for c in seg):
                final_segments.append(call_google_api(seg, itc))
            else:
                final_segments.append(seg)
        result = "".join(final_segments)
    else:
        # Fallback: just restore placeholders
        for ph, val in placeholders.items():
            processed_text = processed_text.replace(f" {ph} ", val)
        result = processed_text

    # Final cleanup of multiple spaces
    result = re.sub(r'\s+', ' ', result).strip()
    _trans_cache[cache_key] = result
    return result

def get_localized_data(text):
    """Returns a dict with ta and hi transliterations."""
    return {
        'ta': transliterate(text, 'ta'),
        'hi': transliterate(text, 'hi')
    }
