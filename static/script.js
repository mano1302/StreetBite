// State
// Global error handler for debugging
window.onerror = function(msg, url, line, col, error) {
    console.error('[Global Error]', msg, 'at', url, ':', line);
    if (typeof showToast === 'function') {
        showToast('Application Error: ' + msg, 'error');
    }
    return false;
};

let stalls = [];
let currentPage = 'home';
let selectedCategory = 'All';
let searchQuery = '';
let vendorShop = null;
function updateVendorShop(newShop) {
    if (!newShop) {
        vendorShop = null;
        return;
    }
    const pwdToUse = newShop._sessionPwd || (vendorShop && vendorShop._sessionPwd) || sessionStorage.getItem('vendorSessionPassword') || '';
    const contactToUse = newShop.contact || (vendorShop && vendorShop.contact) || localStorage.getItem('vendorContact') || '';
    
    vendorShop = newShop;
    
    if (pwdToUse) {
        vendorShop._sessionPwd = pwdToUse;
        sessionStorage.setItem('vendorSessionPassword', pwdToUse);
    }
    if (contactToUse) {
        vendorShop.contact = contactToUse;
        localStorage.setItem('vendorContact', contactToUse);
    }
}
let currentLanguage = 'en';
let currentStallId = null;

// Navigation history stack (Issue #10)
const navigationStack = [];

// Last user interaction timestamp for debouncing auto-refresh (Issue #8)
let lastInteractionTime = Date.now();
// Track interaction events to update lastInteractionTime
['click', 'scroll', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, () => { lastInteractionTime = Date.now(); }, { passive: true });
});

// XSS protection utility (Issue #16)
function escapeHTML(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// API base URL — smart detection so every environment works:
//   localhost / Render → '' (Flask serves both frontend + /api/... on same origin)
//   GitHub Pages or any other static host → full Render URL
// NOTE: All fetch calls use relative paths (e.g. '/api/stalls') which works fine
// when the frontend and backend share the same origin (Flask serves static files).
// API_BASE is kept here only for cross-origin deployments (e.g. GitHub Pages).
const API_BASE = (() => {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.onrender.com')) return '';
    return 'https://streetbite.onrender.com';
    // updateHeaderLocationBar() was previously here — dead code, removed (Issue #6)
})();
// updateHeaderLocationBar() is called in DOMContentLoaded instead (see below)

// Location state — district is remembered for display only; area is NOT persisted
// so all shops always show by default when the user opens the app
let selectedDistrict = localStorage.getItem('streetbite_district') || null;
let selectedArea = null; // Never auto-filter by area on startup
localStorage.removeItem('streetbite_area'); // clear any stale saved area filter
let locationStep = 'district'; // 'district' or 'area'


// Tamil Nadu Districts and Areas
const tamilNaduDistricts = {
    'Ariyalur': ['Ariyalur','Jayankondam','Sendurai','Udayarpalayam','Andimadam','T.Palur'],
    'Chengalpattu': ['Chengalpattu','Tambaram','Mahabalipuram','Vandalur','Guduvancheri','Kelambakkam','Padappai','Thiruporur','Pallavaram','Chrompet'],
    'Chennai': ['T Nagar','Anna Nagar','Adyar','Mylapore','Velachery','Porur','Guindy','Nungambakkam','Egmore','Tambaram','Chromepet','Kodambakkam','Vadapalani','Ashok Nagar','Thiruvanmiyur','Besant Nagar','Royapettah','Triplicane','Perambur','Tondiarpet','Sowcarpet','Kilpauk','Chetpet','Saidapet','Medavakkam'],
    'Coimbatore': ['Gandhipuram','RS Puram','Saibaba Colony','Peelamedu','Singanallur','Ukkadam','Town Hall','Sulur','Pollachi','Mettupalayam','Valparai','Kinathukadavu','Annur'],
    'Cuddalore': ['Cuddalore','Chidambaram','Virudhachalam','Panruti','Kattumannarkoil','Kurinjipadi','Bhuvanagiri'],
    'Dharmapuri': ['Dharmapuri','Palacode','Pennagaram','Harur','Nallampalli','Karimangalam'],
    'Dindigul': ['Dindigul','Palani','Oddanchatram','Natham','Kodaikanal','Vedasandur','Nilakottai','Batlagundu'],
    'Erode': ['Erode','Bhavani','Gobichettipalayam','Sathyamangalam','Perundurai','Anthiyur','Nambiyur'],
    'Kallakurichi': ['Kallakurichi','Ulundurpet','Sankarapuram','Chinnasalem','Tirukoilur','Rishivandiyam'],
    'Kancheepuram': ['Kancheepuram','Sriperumbudur','Uthiramerur','Walajabad','Kundrathur'],
    'Kanniyakumari': ['Nagercoil','Kanyakumari','Marthandam','Colachel','Padmanabhapuram','Thuckalay','Kuzhithurai'],
    'Karur': ['Karur','Kulithalai','Aravakurichi','Krishnarayapuram','Pugalur','Thanthoni'],
    'Krishnagiri': ['Krishnagiri','Hosur','Denkanikottai','Pochampalli','Uthangarai','Bargur','Shoolagiri'],
    'Madurai': ['Madurai North','Madurai South','Thiruparankundram','Melur','Vadipatti','Usilampatti','Peraiyur','Thirumangalam','Sholavandan','Kallikudi'],
    'Mayiladuthurai': ['Mayiladuthurai','Sirkazhi','Kuthalam','Tharangambadi','Poompuhar','Sembanarkoil'],
    'Nagapattinam': ['Nagapattinam','Thirukkuvalai','Kilvelur','Vedaranyam','Kollidam'],
    'Namakkal': ['Namakkal','Rasipuram','Tiruchengode','Paramathi Velur','Komarapalayam','Mohanur','Sendamangalam'],
    'Nilgiris': ['Ooty','Coonoor','Kotagiri','Gudalur','Kundah','Pandalur'],
    'Perambalur': ['Perambalur','Kunnam','Veppanthattai','Alathur'],
    'Pudukkottai': ['Pudukkottai','Aranthangi','Illuppur','Alangudi','Karambakudi','Thirumayam','Avudaiyarkoil'],
    'Ramanathapuram': ['Ramanathapuram','Rameswaram','Paramakudi','Mudukulathur','Kamuthi','Kadaladi','Thiruvadanai'],
    'Ranipet': ['Ranipet','Arakkonam','Walajah','Arcot','Sholinghur','Nemili','Timiri'],
    'Salem': ['Salem Town','Attur','Mettur','Omalur','Edappadi','Sankari','Yercaud','Gangavalli','Valapadi'],
    'Sivaganga': ['Sivaganga','Karaikudi','Devakottai','Manamadurai','Ilayangudi','Tirupathur','Kallal'],
    'Tenkasi': ['Tenkasi','Sankarankoil','Kadayanallur','Shenkottai','Courtallam','Alangulam','Vasudevanallur'],
    'Thanjavur': ['Thanjavur','Kumbakonam','Pattukkottai','Peravurani','Orathanadu','Thiruvidaimarudur','Thiruvaiyaru','Papanasam','Swarnapuri'],
    'Theni': ['Theni','Bodinayakanur','Periyakulam','Andipatti','Uthamapalayam','Cumbum'],
    'Thoothukudi': ['Thoothukudi','Kovilpatti','Tiruchendur','Kayathar','Vilathikulam','Ottapidaram','Srivaikundam','Eral'],
    'Tiruchirappalli': ['Trichy Town','Srirangam','Lalgudi','Musiri','Manachanallur','Thuraiyur','Manapparai','Thottiyam'],
    'Tirunelveli': ['Tirunelveli Town','Palayamkottai','Ambasamudram','Cheranmahadevi','Radhapuram','Nanguneri','Kalakkad','Pettai'],
    'Tirupattur': ['Tirupattur','Vaniyambadi','Ambur','Natrampalli','Jolarpet','Kandili'],
    'Tiruvallur': ['Tiruvallur','Avadi','Poonamallee','Ambattur','Thiruvottiyur','Gummidipoondi','Ponneri','Red Hills','Madhavaram'],
    'Tiruvannamalai': ['Tiruvannamalai','Polur','Arani','Cheyyar','Vandavasi','Chengam','Kilpennathur','Kalasapakkam'],
    'Tiruvarur': ['Tiruvarur','Mannargudi','Nannilam','Thiruthuraipoondi','Needamangalam','Valangaiman','Kodavasal'],
    'Vellore': ['Vellore Town','Katpadi','Gudiyatham','Pernambut','Anaicut','KV Kuppam','Kaniyambadi'],
    'Viluppuram': ['Viluppuram','Tindivanam','Gingee','Kallakurichi','Ulundurpettai','Thiruvennainallur','Vanur','Marakkanam'],
    'Virudhunagar': ['Virudhunagar','Sivakasi','Srivilliputhur','Rajapalayam','Aruppukkottai','Sattur','Tiruchuli','Watrap'],
    'Tiruppur': ['Tiruppur Town','Avinashi','Palladam','Dharapuram','Kangayam','Udumalaipettai','Vellakoil','Madathukulam']
};

// District names in Tamil
const districtNamesTa = {
    'Ariyalur':'அரியலூர்','Chengalpattu':'செங்கல்பட்டு','Chennai':'சென்னை',
    'Coimbatore':'கோயம்புத்தூர்','Cuddalore':'கடலூர்','Dharmapuri':'தர்மபுரி',
    'Dindigul':'திண்டுக்கல்','Erode':'ஈரோடு','Kallakurichi':'கள்ளக்குறிச்சி',
    'Kancheepuram':'காஞ்சிபுரம்','Kanniyakumari':'கன்னியாகுமரி','Karur':'கரூர்',
    'Krishnagiri':'கிருஷ்ணகிரி','Madurai':'மதுரை','Mayiladuthurai':'மயிலாடுதுறை',
    'Nagapattinam':'நாகப்பட்டினம்','Namakkal':'நாமக்கல்','Nilgiris':'நீலகிரி',
    'Perambalur':'பெரம்பலூர்','Pudukkottai':'புதுக்கோட்டை','Ramanathapuram':'ராமநாதபுரம்',
    'Ranipet':'ராணிப்பேட்டை','Salem':'சேலம்','Sivaganga':'சிவகங்கை',
    'Tenkasi':'தென்காசி','Thanjavur':'தஞ்சாவூர்','Theni':'தேனி',
    'Thoothukudi':'தூத்துக்குடி','Tiruchirappalli':'திருச்சிராப்பள்ளி',
    'Tirunelveli':'திருநெல்வேலி','Tirupattur':'திருப்பத்தூர்','Tiruvallur':'திருவள்ளூர்',
    'Tiruvannamalai':'திருவண்ணாமலை','Tiruvarur':'திருவாரூர்','Vellore':'வேலூர்',
    'Viluppuram':'விழுப்புரம்','Virudhunagar':'விருதுநகர்','Tiruppur':'திருப்பூர்'
};

// District names in Hindi
const districtNamesHi = {
    'Ariyalur':'अरियलूर','Chengalpattu':'चेंगलपट्टू','Chennai':'चेन्नई',
    'Coimbatore':'कोयंबटूर','Cuddalore':'कड्डलोर','Dharmapuri':'धर्मपुरी',
    'Dindigul':'डिंडीगुल','Erode':'इरोड','Kallakurichi':'कल्लकुरिची',
    'Kancheepuram':'कांचीपुरम','Kanniyakumari':'कन्याकुमारी','Karur':'करूर',
    'Krishnagiri':'कृष्णागिरि','Madurai':'मदुरई','Mayiladuthurai':'मयिलादुतुरई',
    'Nagapattinam':'नागपट्टिनम','Namakkal':'नामक्कल','Nilgiris':'नीलगिरि',
    'Perambalur':'पेरम्बलूर','Pudukkottai':'पुदुक्कोट्टई','Ramanathapuram':'रामनाथपुरम',
    'Ranipet':'रानीपेट','Salem':'सेलम','Sivaganga':'शिवगंगा',
    'Tenkasi':'तेनकासी','Thanjavur':'तंजावुर','Theni':'थेनी',
    'Thoothukudi':'थूथुकुडी','Tiruchirappalli':'तिरुचिरापल्ली',
    'Tirunelveli':'तिरुनेलवेली','Tirupattur':'तिरुपत्तूर','Tiruvallur':'तिरुवल्लूर',
    'Tiruvannamalai':'तिरुवन्नामलई','Tiruvarur':'तिरुवारूर','Vellore':'वेल्लोर',
    'Viluppuram':'विल्लुपुरम','Virudhunagar':'विरुधुनगर','Tiruppur':'तिरुपुर'
};

// Dynamic Translation for User Content (Shop Names, Menu Items)
const dynamicTranslations = {
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
    'Sweet': { 'ta': 'ஸ்வீட்', 'hi': 'स्वीட்' },
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
};

// Helper: translate dynamic content (shop names, menu items)
// Issue #15: Removed duplicate placeholder translateSingleStall — the real
// implementation at line ~1688 is kept. This stub was overriding it.


// Helper: get district display name in current language
function getDistrictName(district) {
    if (currentLanguage === 'ta') return districtNamesTa[district] || district;
    if (currentLanguage === 'hi') return districtNamesHi[district] || district;
    return district;
}

// Helper: get area display name in current language
// Area names use Tamil script transliterations for 'ta', Devanagari for 'hi'
const areaNamesLocalized = {
    ta: {
        'Kallikudi':'கல்லிக்குடி',
        'Omalur':'ஓமலூர்',
        'Chidambaram':'சிதம்பரம்',
        'Panruti':'பண்ருட்டி',
        'Tindivanam':'திண்டிவனம்',
        'Sulur':'சூலூர்',
        'Udayarpalayam':'உடையார்பாளையம்',
        'Thanthoni':'தாந்தோணி',
        'Mayiladuthurai':'மயிலாடுதுறை',
        'Alathur':'ஆலத்தூர்',
        'Perundurai':'பெருந்துறை',
        'Thiruvidaimarudur':'திருவிடைமருதூர்',
        'Pennagaram':'பென்னாகரம்',
        'Kallakurichi':'கள்ளக்குறிச்சி',
        'Ukkadam':'உக்கடம்',
        'Natham':'நத்தம்',
        'Bhavani':'பவானி',
        'Kuzhithurai':'குழித்துறை',
        'Kayathar':'கயத்தார்',
        'Manachanallur':'மணச்சநல்லூர்',
        'Alangudi':'ஆலங்குடி',
        'Srirangam':'ஸ்ரீரங்கம்',
        'Paramakudi':'பரமக்குடி',
        'Anna Nagar':'அண்ணா நகர்',
        'Batlagundu':'பட்லகுண்டு',
        'Rishivandiyam':'ரிஷிவந்தியம்',
        'Nilakottai':'நிலக்கோட்டை',
        'Ranipet':'ராணிப்பேட்டை',
        'Theni':'தேனி',
        'Sowcarpet':'Sowcarpet',
        'Uthangarai':'ஊத்தங்கரை',
        'Kundah':'குந்தா',
        'Sivakasi':'சிவகாசி',
        'Mannargudi':'மன்னார்குடி',
        'Gummidipoondi':'கும்மிடிப்பூண்டி',
        'Annur':'அன்னூர்',
        'Gudalur':'கூடலூர்',
        'Orathanadu':'ஒரத்தநாடு',
        'Nemili':'நெமிலி',
        'Tiruvallur':'திருவள்ளூர்',
        'Kunnam':'குன்னம்',
        'Tiruchengode':'திருச்செங்கோடு',
        'Arani':'ஆரணி',
        'Katpadi':'காட்பாடி',
        'Illuppur':'இலுப்பூர்',
        'Kadaladi':'கடலாடி',
        'Rameswaram':'ராமேஸ்வரம்',
        'Ulundurpet':'உளுந்தூர்பேட்டை',
        'Aravakurichi':'அரவக்குறிச்சி',
        'Tiruvarur':'திருவாரூர்',
        'Kovilpatti':'கோவில்பட்டி',
        'Royapettah':'ராயப்பேட்டை',
        'Periyakulam':'பெரியகுளம்',
        'Tirunelveli Town':'திருநெல்வேலி நகரம்',
        'Karimangalam':'காரிமங்கலம்',
        'Nambiyur':'நம்பியூர்',
        'Guindy':'கிண்டி',
        'Thuraiyur':'துறையூர்',
        'Kaniyambadi':'கணியம்பாடி',
        'Kumbakonam':'கும்பகோணம்',
        'Cumbum':'கம்பம்',
        'Srivaikundam':'ஸ்ரீவைகுண்டம்',
        'Medavakkam':'மேடவாக்கம்',
        'Kamuthi':'கமுதி',
        'Mylapore':'மயிலாப்பூர்',
        'Melur':'மேலூர்',
        'Andipatti':'ஆண்டிபட்டி',
        'Ambattur':'அம்பத்தூர்',
        'Ooty':'ஊட்டி',
        'Kurinjipadi':'குறிஞ்சிப்பாடி',
        'Pugalur':'புகளூர்',
        'Needamangalam':'நீடாமங்கலம்',
        'Chrompet':'குரோம்பேட்டை',
        'Walajabad':'வாலாஜாபாத்',
        'Nagercoil':'நாகர்கோவில்',
        'Poonamallee':'பூந்தமல்லி',
        'Devakottai':'தேவகோட்டை',
        'Swarnapuri':'ஸ்வர்ணபுரி',
        'Ramanathapuram':'ராமநாதபுரம்',
        'Vandalur':'வண்டலூர்',
        'Kuthalam':'குத்தாலம்',
        'Alangulam':'ஆலங்குளம்',
        'Bargur':'பர்கூர்',
        'Perambalur':'பெரம்பலூர்',
        'Sankarapuram':'சங்கராபுரம்',
        'Colachel':'கொலாச்சல்',
        'Chengalpattu':'செங்கல்பட்டு',
        'Vaniyambadi':'வாணியம்பாடி',
        'Vadipatti':'வாடிப்பட்டி',
        'Erode':'ஈரோடு',
        'Aranthangi':'அறந்தாங்கி',
        'Palani':'பழனி',
        'Courtallam':'குற்றாலம்',
        'Kalasapakkam':'கலசப்பாக்கம்',
        'Anaicut':'அணைக்கட்டு',
        'Tharangambadi':'தரங்கம்பாடி',
        'Sholavandan':'சோழவந்தான்',
        'Pattukkottai':'பட்டுக்கோட்டை',
        'Walajah':'வாலாஜா',
        'Sankari':'சங்கரி',
        'Kalakkad':'களக்காடு',
        'Kodaikanal':'கொடைக்கானல்',
        'Thirukkuvalai':'திருக்குவளை',
        'Sembanarkoil':'செம்பனார்கோயில்',
        'Mettur':'மேட்டூர்',
        'Karaikudi':'காரைக்குடி',
        'Valparai':'வால்பாறை',
        'Komarapalayam':'கொமாரபாளையம்',
        'Bodinayakanur':'போடிநாயக்கனூர்',
        'Sattur':'சாத்தூர்',
        'Valapadi':'வாழபாடி',
        'Yercaud':'ஏற்காடு',
        'Poompuhar':'பூம்புகார்',
        'Pandalur':'பந்தலூர்',
        'Kallal':'கல்லல்',
        'Tirukoilur':'திருக்கோவிலூர்',
        'Watrap':'வாட்ராப்',
        'Palayamkottai':'பாளையங்கோட்டை',
        'Uthamapalayam':'உத்தமபாளையம்',
        'Kotagiri':'கோத்தகிரி',
        'Sathyamangalam':'சத்தியமங்கலம்',
        'Thirumayam':'திருமயம்',
        'Andimadam':'ஆண்டிமடம்',
        'Padappai':'படப்பை',
        'Peravurani':'பேராவூரணி',
        'Kangayam':'காங்கயம்',
        'Pernambut':'பெர்னாம்புட்',
        'Sholinghur':'சோளிங்கர்',
        'Thiruvanmiyur':'திருவான்மியூர்',
        'Edappadi':'எடப்பாடி',
        'Vanur':'வானூர்',
        'Ambasamudram':'அம்பாசமுத்திரம்',
        'Sirkazhi':'சீர்காழி',
        'Sivaganga':'சிவகங்கை',
        'Gudiyatham':'குடியாத்தம்',
        'Ilayangudi':'இளையாங்குடி',
        'Chengam':'செங்கம்',
        'Usilampatti':'உசிலம்பட்டி',
        'Thottiyam':'தொட்டியம்',
        'Kulithalai':'குளித்தலை',
        'Tenkasi':'தென்காசி',
        'Thanjavur':'தஞ்சாவூர்',
        'Vedaranyam':'வேதாரண்யம்',
        'Thiruthuraipoondi':'திருத்துறைப்பூண்டி',
        'Gingee':'செஞ்சி',
        'Kancheepuram':'காஞ்சிபுரம்',
        'Kodavasal':'கொடவாசல்',
        'Avudaiyarkoil':'ஆவுடையார்கோயில்',
        'KV Kuppam':'கே.வி.குப்பம்',
        'Arakkonam':'அரக்கோணம்',
        'Karur':'கரூர்',
        'Ambur':'ஆம்பூர்',
        'Arcot':'ஆற்காடு',
        'Nungambakkam':'நுங்கம்பாக்கம்',
        'Tirupathur':'திருப்பத்தூர்',
        'Egmore':'எழும்பூர்',
        'Gandhipuram':'காந்திபுரம்',
        'Tiruchuli':'திருச்சுழி',
        'Krishnagiri':'கிருஷ்ணகிரி',
        'Lalgudi':'லால்குடி',
        'Perambur':'பெரம்பூர்',
        'Papanasam':'பாபநாசம்',
        'Tiruvannamalai':'திருவண்ணாமலை',
        'Rasipuram':'ராசிபுரம்',
        'Thiruvottiyur':'திருவொற்றியூர்',
        'Cheyyar':'செய்யார்',
        'Mettupalayam':'மேட்டுப்பாளையம்',
        'Kilvelur':'கீழ்வேளூர்',
        'T Nagar':'டி நகர்',
        'Saidapet':'சைதாப்பேட்டை',
        'Gobichettipalayam':'கோபிசெட்டிபாளையம்',
        'Veppanthattai':'வேப்பந்தட்டை',
        'Vedasandur':'வேடசந்தூர்',
        'Ulundurpettai':'உளுந்தூர்பேட்டை',
        'Thiruvadanai':'திருவாடானை',
        'Nanguneri':'நாங்குநேரி',
        'Thiruparankundram':'திருப்பரங்குன்றம்',
        'Mohanur':'மோகனூர்',
        'Musiri':'முசிறி',
        'Srivilliputhur':'ஸ்ரீவில்லிபுத்தூர்',
        'Rajapalayam':'ராஜபாளையம்',
        'Jayankondam':'ஜெயங்கொண்டம்',
        'Ottapidaram':'ஓட்டப்பிடாரம்',
        'Thoothukudi':'தூத்துக்குடி',
        'Shoolagiri':'சூளகிரி',
        'Bhuvanagiri':'புவனகிரி',
        'Paramathi Velur':'பரமத்தி வேலூர்',
        'Kanyakumari':'கன்னியாகுமரி',
        'Besant Nagar':'பெசன்ட் நகர்',
        'Nagapattinam':'நாகப்பட்டினம்',
        'Anthiyur':'அந்தியூர்',
        'Kadayanallur':'கடையநல்லூர்',
        'Namakkal':'நாமக்கல்',
        'Hosur':'ஓசூர்',
        'Marakkanam':'மரக்காணம்',
        'Valangaiman':'வலங்கைமான்',
        'Chetpet':'சேட்பேட்',
        'Marthandam':'மார்த்தாண்டம்',
        'Dharmapuri':'தருமபுரி',
        'Ariyalur':'அரியலூர்',
        'Adyar':'அடையாறு',
        'Chromepet':'குரோம்பேட்டை',
        'Palacode':'பாலக்கோடு',
        'Pudukkottai':'புதுக்கோட்டை',
        'Tiruchendur':'திருச்செந்தூர்',
        'Avadi':'ஆவடி',
        'Thirumangalam':'திருமங்கலம்',
        'Padmanabhapuram':'பத்மநாபபுரம்',
        'Karambakudi':'கறம்பக்குடி',
        'Kilpauk':'கீழ்ப்பாக்கம்',
        'Porur':'போரூர்',
        'Coonoor':'குன்னூர்',
        'Nannilam':'நன்னிலம்',
        'RS Puram':'ஆர்.எஸ்.புரம்',
        'Harur':'ஹரூர்',
        'Radhapuram':'ராதாபுரம்',
        'Town Hall':'டவுன் ஹால்',
        'Mahabalipuram':'மகாபலிபுரம்',
        'Pollachi':'பொள்ளாச்சி',
        'Trichy Town':'திருச்சி டவுன்',
        'Tambaram':'தாம்பரம்',
        'Saibaba Colony':'சாய்பாபா காலனி',
        'Uthiramerur':'உத்திரமேரூர்',
        'Sendamangalam':'சேந்தமங்கலம்',
        'Kandili':'கந்திலி',
        'Ponneri':'பொன்னேரி',
        'Viluppuram':'விழுப்புரம்',
        'Aruppukkottai':'அருப்புக்கோட்டை',
        'Kundrathur':'குன்றத்தூர்',
        'Madurai South':'மதுரை தெற்கு',
        'Sendurai':'செந்துறை',
        'Pettai':'பேட்டை',
        'Mudukulathur':'முதுகுளத்தூர்',
        'Ashok Nagar':'அசோக் நகர்',
        'Velachery':'வேளச்சேரி',
        'Kattumannarkoil':'காட்டுமன்னார்கோயில்',
        'Virudhachalam':'விருத்தாசலம்',
        'Sankarankoil':'சங்கரன்கோவில்',
        'Thiruvaiyaru':'திருவையாறு',
        'Thiruvennainallur':'திருவெண்ணைநல்லூர்',
        'Pochampalli':'போச்சம்பள்ளி',
        'Madurai North':'மதுரை வடக்கு',
        'Vadapalani':'வடபழனி',
        'Tondiarpet':'தொண்டியார்பேட்டை',
        'Nallampalli':'நல்லம்பள்ளி',
        'Gangavalli':'கங்கவல்லி',
        'Red Hills':'சிவப்பு மலைகள்',
        'Vellore Town':'வேலூர் நகரம்',
        'T.Palur':'டி.பாலூர்',
        'Guduvancheri':'கூடுவாஞ்சேரி',
        'Sriperumbudur':'ஸ்ரீபெரும்புதூர்',
        'Kelambakkam':'கேளம்பாக்கம்',
        'Dindigul':'திண்டுக்கல்',
        'Attur':'ஆத்தூர்',
        'Madhavaram':'மாதவரம்',
        'Denkanikottai':'தேன்கனிக்கோட்டை',
        'Cuddalore':'கடலூர்',
        'Salem Town':'சேலம் நகரம்',
        'Manapparai':'மணப்பாறை',
        'Chinnasalem':'சின்னசேலம்',
        'Vandavasi':'வந்தவாசி',
        'Oddanchatram':'ஒட்டன்சத்திரம்',
        'Singanallur':'சிங்காநல்லூர்',
        'Kinathukadavu':'கிணத்துக்கடவு',
        'Thuckalay':'தக்கலை',
        'Virudhunagar':'விருதுநகர்',
        'Thiruporur':'திருப்போரூர்',
        'Timiri':'திமிரி',
        'Vilathikulam':'விளாத்திகுளம்',
        'Eral':'ஏரல்',
        'Jolarpet':'ஜோலார்பேட்டை',
        'Vasudevanallur':'வாசுதேவநல்லூர்',
        'Natrampalli':'நாட்றம்பள்ளி',
        'Polur':'போளூர்',
        'Kollidam':'கொள்ளிடம்',
        'Cheranmahadevi':'சேரன்மஹாதேவி',
        'Tirupattur':'திருப்பத்தூர்',
        'Kilpennathur':'கீழ்பென்னாத்தூர்',
        'Krishnarayapuram':'கிருஷ்ணராயபுரம்',
        'Pallavaram':'பல்லாவரம்',
        'Shenkottai':'செங்கோட்டை',
        'Peelamedu':'பீளமேடு',
        'Kodambakkam':'கோடம்பாக்கம்',
        'Manamadurai':'மானாமதுரை',
        'Triplicane':'டிரிப்ளிகேன்',
        'Peraiyur':'பேரையூர்',
        'Tiruppur Town':'திருப்பூர் டவுன்',
        'Avinashi':'அவினாசி',
        'Palladam':'பல்லடம்',
        'Dharapuram':'தாராபுரம்',
        'Kangayam':'காங்கயம்',
        'Udumalaipettai':'உடுமலைப்பேட்டை',
        'Vellakoil':'வெள்ளகோவில்',
        'Madathukulam':'மடத்துக்குளம்'
    },
    hi: {
        'Kallikudi':'कल्लीकुडी',
        'Omalur':'ओमलुर',
        'Chidambaram':'चिदंबरम',
        'Panruti':'Panruti',
        'Tindivanam':'टिंडीवनम',
        'Sulur':'सुलूर',
        'Udayarpalayam':'Udayarpalayam',
        'Thanthoni':'थान्थोनी',
        'Mayiladuthurai':'माइलादुत्रयी',
        'Alathur':'अलाथुर',
        'Perundurai':'पेरुंदुरई',
        'Thiruvidaimarudur':'तिरुविदाईमरुदुर',
        'Pennagaram':'पेन्नाग्राम',
        'Kallakurichi':'कल्लाकुरिची',
        'Ukkadam':'उक्कदम',
        'Natham':'नाथम',
        'Bhavani':'भवानी',
        'Kuzhithurai':'कुझीथुराई',
        'Kayathar':'कायथर',
        'Manachanallur':'मनाचनल्लूर',
        'Alangudi':'अलंगुडी',
        'Srirangam':'श्रीरंगम',
        'Paramakudi':'परमाकुदी',
        'Anna Nagar':'अन्ना नगर',
        'Batlagundu':'वथ्लाकुंदु',
        'Rishivandiyam':'Rishivandiyam',
        'Nilakottai':'नीलाकोट्टई',
        'Ranipet':'रानीपेट',
        'Theni':'तब मैं',
        'Sowcarpet':'सोकार्पेट',
        'Uthangarai':'उथंगराई',
        'Kundah':'कुंदह',
        'Sivakasi':'शिवकाशी',
        'Mannargudi':'मन्नारगुडी',
        'Gummidipoondi':'गुम्मिडिपूंडी',
        'Annur':'अन्नूर',
        'Gudalur':'गुडलूर',
        'Orathanadu':'ओरथानाडु',
        'Nemili':'नेमिली',
        'Tiruvallur':'तिरुवल्लुर',
        'Kunnam':'कुन्नम',
        'Tiruchengode':'तिरुचेंगोडे',
        'Arani':'अरणि',
        'Katpadi':'कट्पडी',
        'Illuppur':'इलुप्पुर',
        'Kadaladi':'कदलाडी',
        'Rameswaram':'रामेश्वरम',
        'Ulundurpet':'उलुंदुरपेट',
        'Aravakurichi':'अरवाकुरिची',
        'Tiruvarur':'तिरुवरुर',
        'Kovilpatti':'कोविलपट्टी',
        'Royapettah':'रोयापेट्टा',
        'Periyakulam':'पेरियाकुलम',
        'Tirunelveli Town':'तिरुनेलवेली टाउन',
        'Karimangalam':'करीमंगलम',
        'Nambiyur':'नांबियूर',
        'Guindy':'गिंडी',
        'Thuraiyur':'थुरैयुर',
        'Kaniyambadi':'कनियमबाड़ी',
        'Kumbakonam':'कुम्भकोणम',
        'Cumbum':'कम्बम',
        'Srivaikundam':'श्रीवैकुंठम',
        'Medavakkam':'Medavakkam',
        'Kamuthi':'कामुथि',
        'Mylapore':'मायलापुर',
        'Melur':'मेलूर',
        'Andipatti':'अंडीपट्टी',
        'Ambattur':'अंबात्तुर',
        'Ooty':'ऊटी',
        'Kurinjipadi':'कुरिन्जिपदी',
        'Pugalur':'पुगलुर',
        'Needamangalam':'नीदमंगलम',
        'Chrompet':'क्रोमपेट',
        'Walajabad':'वालाजाबाद',
        'Nagercoil':'नागरकोइल',
        'Poonamallee':'Poonamallee',
        'Devakottai':'देवाकोत्तई',
        'Swarnapuri':'स्वर्णपुरी',
        'Ramanathapuram':'रामनाथपुरम',
        'Vandalur':'वंडालूर',
        'Kuthalam':'कुथलम',
        'Alangulam':'अलंगुलम',
        'Bargur':'बरगुर',
        'Perambalur':'पेरम्बलुर',
        'Sankarapuram':'शंकरपुरम',
        'Colachel':'कोलाचेल',
        'Chengalpattu':'चेंगलपट्टू',
        'Vaniyambadi':'वानियमबाडी',
        'Vadipatti':'वाडीपट्टी',
        'Erode':'इरोड',
        'Aranthangi':'Aranthangi',
        'Palani':'पलानी',
        'Courtallam':'कुट्रालम',
        'Kalasapakkam':'कलासपक्कम',
        'Anaicut':'अनाईकट',
        'Tharangambadi':'Tharangambadi',
        'Sholavandan':'शोलावंदन',
        'Pattukkottai':'पत्तुकोत्तई',
        'Walajah':'वालाजाह',
        'Sankari':'सांकरी',
        'Kalakkad':'कलक्कड़',
        'Kodaikanal':'कोडईकनाल',
        'Thirukkuvalai':'तिरुक्कुवलई',
        'Sembanarkoil':'सेम्बनारकोइल',
        'Mettur':'मेट्टुर',
        'Karaikudi':'कराइकुडी',
        'Valparai':'वालपराई',
        'Komarapalayam':'कोमारपालयम',
        'Bodinayakanur':'बोडीनायकनुर',
        'Sattur':'सत्तूर',
        'Valapadi':'वलपाडी',
        'Yercaud':'Yercaud',
        'Poompuhar':'पूम्पुहार',
        'Pandalur':'पंडालुर',
        'Kallal':'कल्लाल',
        'Tirukoilur':'तिरुकोइलूर',
        'Watrap':'वाट्रैप',
        'Palayamkottai':'Palayamkottai',
        'Uthamapalayam':'उथमपलयम',
        'Kotagiri':'कोटागिरी',
        'Sathyamangalam':'सत्यमंगलम',
        'Thirumayam':'थिरुमायम',
        'Andimadam':'अंदिमादम',
        'Padappai':'पदप्पई',
        'Peravurani':'पेरावुरानी',
        'Kangayam':'कंगायम',
        'Pernambut':'पर्नामबट',
        'Sholinghur':'शोलिंघुर',
        'Thiruvanmiyur':'Thiruvanmiyur',
        'Edappadi':'Edappadi',
        'Vanur':'वनूर',
        'Ambasamudram':'अम्बसमुद्रम',
        'Sirkazhi':'सिरकाज़ी',
        'Sivaganga':'शिवगंगा',
        'Gudiyatham':'गुडियाथम',
        'Ilayangudi':'इलैयांगुड़ी',
        'Chengam':'चंगम',
        'Usilampatti':'Usilampatti',
        'Thottiyam':'थोट्टियम',
        'Kulithalai':'Kulithalai',
        'Tenkasi':'तेनकासी',
        'Thanjavur':'तंजावुर',
        'Vedaranyam':'Vedaranyam',
        'Thiruthuraipoondi':'थिरुथुराईपूंडी',
        'Gingee':'गिंगी',
        'Kancheepuram':'कांचीपुरम',
        'Kodavasal':'कोडावसल',
        'Avudaiyarkoil':'अवुदैयारकोइल',
        'KV Kuppam':'केवी कुप्पम',
        'Arakkonam':'अराकोणम',
        'Karur':'करूर',
        'Ambur':'अम्बुर',
        'Arcot':'अर्काट',
        'Nungambakkam':'नुंगमबक्कम',
        'Tirupathur':'तिरुपथुर',
        'Egmore':'एग्मोर',
        'Gandhipuram':'Gandhipuram',
        'Tiruchuli':'तिरुचुली',
        'Krishnagiri':'कृष्णागिरी',
        'Lalgudi':'लालगुडी',
        'Perambur':'पेराम्बुर',
        'Papanasam':'पापनासम',
        'Tiruvannamalai':'तिरुवन्नामलाई',
        'Rasipuram':'रासीपुरम',
        'Thiruvottiyur':'तिरुवोट्टियूर',
        'Cheyyar':'चेय्यर',
        'Mettupalayam':'मेट्टुपालयम',
        'Kilvelur':'किलवेलूर',
        'T Nagar':'टी नगर',
        'Saidapet':'सैदापेट',
        'Gobichettipalayam':'गोबिचेट्टीपलायम',
        'Veppanthattai':'वेप्पनथट्टई',
        'Vedasandur':'वेदसंदुर',
        'Ulundurpettai':'उलुंदुरपेट्टई',
        'Thiruvadanai':'तिरुवदनई',
        'Nanguneri':'नांगुनेरी',
        'Thiruparankundram':'Thiruparankundram',
        'Mohanur':'मोहनूर',
        'Musiri':'मुसिरी',
        'Srivilliputhur':'श्रीविल्लीपुतुर',
        'Rajapalayam':'राजपालयम',
        'Jayankondam':'जयनकोंडम',
        'Ottapidaram':'ओट्टापिडारम',
        'Thoothukudi':'Thoothukudi',
        'Shoolagiri':'शूलगिरी',
        'Bhuvanagiri':'भुवनगिरी',
        'Paramathi Velur':'परमथी वेलूर',
        'Kanyakumari':'कन्याकुमारी',
        'Besant Nagar':'बसंत नगर',
        'Nagapattinam':'नागपट्टिनम',
        'Anthiyur':'Anthiyur',
        'Kadayanallur':'कडयानल्लूर',
        'Namakkal':'नमक्कल',
        'Hosur':'होसुर',
        'Marakkanam':'मरक्कनम',
        'Valangaiman':'वलंगइमन',
        'Chetpet':'चेटपेट',
        'Marthandam':'Marthandam',
        'Dharmapuri':'धर्मपुरी',
        'Ariyalur':'अरियालूर',
        'Adyar':'अड्यार',
        'Chromepet':'क्रोमपेट',
        'Palacode':'पलाकोड',
        'Pudukkottai':'पुदुक्कोट्टई',
        'Tiruchendur':'तिरुचेन्डुर',
        'Avadi':'अवादी',
        'Thirumangalam':'तिरूमंगलम',
        'Padmanabhapuram':'पद्मनाभपुरम',
        'Karambakudi':'करमबकुडी',
        'Kilpauk':'किल्पौक',
        'Porur':'पोरुर',
        'Coonoor':'कुन्नूर',
        'Nannilam':'नन्निलम',
        'RS Puram':'आरएस पुरम',
        'Harur':'हरुर',
        'Radhapuram':'राधापुरम',
        'Town Hall':'टाउन हॉल',
        'Mahabalipuram':'महाबलीपुरम',
        'Pollachi':'पोलाची',
        'Trichy Town':'त्रिची टाउन',
        'Tambaram':'ताम्बरम',
        'Saibaba Colony':'साईबाबा कॉलोनी',
        'Uthiramerur':'उथिरामेरूर',
        'Sendamangalam':'सेंदमंगलम',
        'Kandili':'कांदिली',
        'Ponneri':'पोन्नेरी',
        'Viluppuram':'विलुप्पुरम',
        'Aruppukkottai':'अरुप्पुक्कोट्टई',
        'Kundrathur':'Kundrathur',
        'Madurai South':'मदुरै दक्षिण',
        'Sendurai':'सेंदुरई',
        'Pettai':'पेट्टई',
        'Mudukulathur':'मुदुकुलथुर',
        'Ashok Nagar':'अशोकनगर',
        'Velachery':'वेलाचेरी',
        'Kattumannarkoil':'Kattumannarkoil',
        'Virudhachalam':'Virudhachalam',
        'Sankarankoil':'संकरनकोइल',
        'Thiruvaiyaru':'थिरुवैयारु',
        'Thiruvennainallur':'तिरुवेन्नैनल्लूर',
        'Pochampalli':'पोचमपल्ली',
        'Madurai North':'मदुरै उत्तर',
        'Vadapalani':'वडापलानी',
        'Tondiarpet':'टोंडियारपेट',
        'Nallampalli':'नल्लमपल्ली',
        'Gangavalli':'गंगावल्ली',
        'Red Hills':'लाल पहाड़ियाँ',
        'Vellore Town':'वेल्लोर टाउन',
        'T.Palur':'टी.पालुर',
        'Guduvancheri':'गुडुवनचेरी',
        'Sriperumbudur':'श्रीपेरुमबुदुर',
        'Kelambakkam':'Kelambakkam',
        'Dindigul':'डिंडीगुल',
        'Attur':'अत्तूर',
        'Madhavaram':'Madhavaram',
        'Denkanikottai':'डेंकानिकोट्टई',
        'Cuddalore':'कुड्डालोर',
        'Salem Town':'सेलम टाउन',
        'Manapparai':'मन्नापरई',
        'Chinnasalem':'चिन्नासलेम',
        'Vandavasi':'वंदावासी',
        'Oddanchatram':'Oddanchatram',
        'Singanallur':'सिंगानल्लुर',
        'Kinathukadavu':'किनाथुकादावु',
        'Thuckalay':'थुकले',
        'Virudhunagar':'विरुधुनगर',
        'Thiruporur':'Thiruporur',
        'Timiri':'तिमिरि',
        'Vilathikulam':'विलाथिकुलम',
        'Eral':'आम ए',
        'Jolarpet':'जोलारपेट',
        'Vasudevanallur':'वासुदेवानल्लुर',
        'Natrampalli':'नटरामपल्ली',
        'Polur':'पोलूर',
        'Kollidam':'कोलिदम',
        'Cheranmahadevi':'चेरनमहादेवी',
        'Tirupattur':'Tirupattur',
        'Kilpennathur':'किल्पेन्नाथुर',
        'Krishnarayapuram':'कृष्णरायपुरम',
        'Pallavaram':'पल्लावरम',
        'Shenkottai':'शेनकोट्टई',
        'Peelamedu':'Peelamedu',
        'Kodambakkam':'कोडमबक्कम',
        'Manamadurai':'मनमदुरै',
        'Triplicane':'त्रिपलीकेन',
        'Peraiyur':'पेराइयुर',
        'Tiruppur Town':'तिरुपुर टाउन',
        'Avinashi':'अविनाशी',
        'Palladam':'पल्लडम',
        'Dharapuram':'धारापुरम',
        'Kangayam':'कांगयम',
        'Udumalaipettai':'उदुमलाईपेट्टई',
        'Vellakoil':'वेल्लाकोइल',
        'Madathukulam':'मदथुकुलम'
    }
};

// Helper: get area display name in current language
function getAreaName(area) {
    if (currentLanguage === 'ta' && areaNamesLocalized.ta[area]) return areaNamesLocalized.ta[area];
    if (currentLanguage === 'hi' && areaNamesLocalized.hi[area]) return areaNamesLocalized.hi[area];
    return area;
}

// Helper: get category display name
function getCategoryName(cat) {
    const map = {
        'Fast Food': 'categoryFastFood',
        'Biryani': 'categoryBiryani',
        'Parotta & Meals': 'categoryParottaMeals',
        'Grilled & Non-Veg': 'categoryGrilledNonVeg',
        'Juice': 'categoryJuice',
        'Sweet & Beverages': 'categorySweetBeverages',
        'Snacks': 'categorySnacks',
        'Others': 'categoryOthers'
    };
    return map[cat] ? t(map[cat]) : cat;
}

const DATA_KEY = 'streetbite_stalls';

// Auto-refresh interval handle
let _autoRefreshTimer = null;

// Initialize — load stalls from the backend API (shared across ALL devices)
async function initializeData() {
    await loadStalls();
    renderHomePage();
    // Auto-refresh every 30 s so every device sees new shops immediately
    // Issue #23: Never auto-refresh on detail page (avoids resetting star rating)
    if (_autoRefreshTimer) clearInterval(_autoRefreshTimer);
    _autoRefreshTimer = setInterval(async () => {
        // Only refresh if no interaction in last 5 seconds
        if (Date.now() - lastInteractionTime < 5000) return;
        // Skip refresh entirely on detail page to preserve star rating state
        if (currentPage === 'detail') return;
        
        await loadStalls();
        // Only re-render grid if user is on home or search — don't interrupt other pages
        if (currentPage === 'home') renderHomePage();
        else if (currentPage === 'search') renderShopGrid();
        // Profile page: only refresh if vendor is NOT actively editing
        else if (currentPage === 'profile' && !document.activeElement?.closest('.vendor-dashboard-page')) renderProfilePage();
    }, 30000);
}

async function loadStalls() {
    showLoading(true);
    try {
        const res = await fetch('/api/stalls');
        stalls = await res.json();
        // Automatically translate all data if not English
        if (currentLanguage !== 'en') {
            await translateAllStalls();
        }
    } catch (e) {
        console.error('Could not load stalls:', e);
        stalls = [];
    }
    showLoading(false);
}

// saveData is kept for backward compat but now a no-op (API is the source of truth)
function saveData() {}

// Translations
const translations = {
    en: {
        appName: 'StreetBite',
        searchPlaceholder: 'Search shops or food...',
        home: 'Home',
        search: 'Search',
        addShop: 'Add Shop',
        profile: 'Profile',
        all: 'All',
        open: 'Open',
        closed: 'Closed',
        openNow: 'Open Now',
        yourShopIsCurrentlyOpen: 'Your shop is currently accepting orders',
        yourShopIsCurrentlyClosed: 'Your shop is currently closed to customers',
        shopStatus: 'Shop Status',
        currentStatus: 'Current',
        menu: 'Menu',
        reviews: 'Reviews',
        writeReview: 'Write a Review',
        submitReview: 'Submit Review',
        reviewPlaceholder: 'Share your experience...',
        noReviews: 'No reviews yet. Be the first!',
        addNewShop: 'Add New Shop',
        shopName: 'Shop Name',
        shopNamePlaceholder: 'Enter shop name',
        foodCategory: 'Food Category',
        selectCategory: 'Select category',
        areaLocation: 'Area/Location',
        areaPlaceholder: 'e.g., T Nagar, Anna Nagar',
        fullAddress: 'Full Address',
        addressPlaceholder: 'Complete address',
        contactNumber: 'Contact Number',
        todaysDiscount: "Today's Offer",
        discountPlaceholder: 'e.g., 10% off',
        openingTime: 'Opening Time',
        closingTime: 'Closing Time',
        menuItems: 'Menu Items',
        itemName: 'Item name',
        price: '₹',
        listMyShop: 'List My Shop',
        noItemsAdded: 'No items added yet',
        vendorLogin: 'Vendor Login',
        vendorLoginSub: 'Manage your shop status and menu',
        selectYourShop: 'Select Your Shop',
        chooseYourShop: 'Choose your shop',
        contactNumberLabel: 'Contact Number',
        contactPlaceholder: 'Your registered contact number',
        login: 'Login',
        noShopListed: "Don't have a shop listed?",
        addYourShop: 'Add Your Shop',
        vendorDashboard: 'Vendor Dashboard',
        logout: 'Logout',
        menuAvailability: 'Menu Availability',
        updateDiscount: 'Update Offer',
        language: 'Language',
        selectLanguage: 'Select Language',
        english: 'English',
        tamil: 'தமிழ்',
        hindi: 'हिंदी',
        available: 'Available',
        unavailable: 'Unavailable',
        on: 'ON',
        off: 'OFF',
        itemNowStatus: '{item} is now {status}',
        rating: 'Rating',
        tapToCall: 'Tap to call',
        noShopsFound: 'No shops found',
        addNewMenuItem: 'Add New Menu Item',
        itemNamePlaceholder: 'e.g., Masala Dosa',
        addItemToMenu: 'Add Item to Menu',
        categoryFastFood: 'Fast Food',
        categoryBiryani: 'Biryani',
        categoryParottaMeals: 'Parotta & Meals',
        categoryGrilledNonVeg: 'Grilled & Non-Veg',
        categoryJuice: 'Juice',
        categorySweetBeverages: 'Sweet & Beverages',
        categorySnacks: 'Snacks',
        categoryOthers: 'Others',
        welcomeTitle: 'Welcome to StreetBite!',
        welcomeSubtitle: 'Discover the best street food near you',
        adminConsole: 'StreetBite Admin Console',
        adminConsoleDesc: 'Manage and delete any listed street food stall',
        deleteShopBtn: 'Delete Shop',
        deletingShopBtn: 'Deleting...',
        deleteShopConfirm: 'Are you sure you want to permanently delete "{name}"?\n\nThis action cannot be undone.',
        shopDeletedSuccessfully: '"{name}" deleted successfully!',
        shopsAvailable: 'shops available',
        toggleOpen: 'Open',
        toggleClosed: 'Closed',
        selectLocation: 'Select Location',
        selectYourLocation: 'Select Your Location',
        selectLocationDesc: 'Use the District and Area dropdowns in the header to find street food shops near you!',
        selectDistrict: 'Select Your District',
        selectArea: 'Select Area in',
        changeLocation: 'Change',
        nearbyShops: 'Nearby shops in',
        searchDistrict: 'Search district...',
        searchArea: 'Search area...',
        allAreas: 'All Areas',
        district: 'District',
        listShopTitle: 'List Your Street Food Shop',
        listShopSub: 'Join hundreds of vendors on StreetBite and reach customers in your area instantly.',
        locationPinned: 'Location Pinned',
        getReviews: 'Get Reviews',
        digitalMenu: 'Digital Menu',
        liveStatus: 'Live Status',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        passwordPlaceholder: 'Min 4 characters',
        confirmPasswordPlaceholder: 'Repeat password',
        vendorPasswordPlaceholder: 'Your shop password',
        passwordTooShort: 'Password must be at least 4 characters',
        passwordsDoNotMatch: 'Passwords do not match',
        registrationFailed: 'Registration failed',
        shopRegistered: 'Shop registered! Visible to all users now.',
        networkError: 'Network error. Please try again.',
        loggingIn: 'Logging in...',
        invalidCredentials: 'Invalid mobile number or password',
        pleaseEnterDetails: 'Please enter your mobile number and password',
        welcomeVendor: 'Welcome',
        registering: 'Registering...',
        fillRequired: 'Please fill all required fields',
        addMenuItemError: 'Please add at least one menu item',
        itemAdded: 'Item added successfully',
        itemRemoved: 'Item removed',
        failedToRemoveItem: 'Failed to remove item',
        updateFailed: 'Update failed',
        offerUpdated: 'Offer updated!',
        loggedOut: 'Logged out',
        deletionFailed: 'Deletion failed. Check your password.',
        shopNotFound: 'Shop not found',
        pleaseSelectRating: 'Please select a rating and write a review',
        reviewSubmitted: 'Review submitted!',
        couldNotSubmitReview: 'Could not submit review',
        shopNowOpen: 'Shop is now Open',
        shopNowClosed: 'Shop is now Closed',
        adding: 'Adding...',
        dangerZone: 'Danger Zone',
        deleteShop: 'Delete My Shop',
        deleteShopDesc: 'This will permanently delete your shop and all its data. This action cannot be undone.',
        authRequiredTitle: 'Authentication Required',
        authRequiredDesc: 'Please enter your registered mobile number and password to delete your shop.',
        confirmMobileNumber: 'Confirm Mobile Number',
        confirmPassword: 'Confirm Password',
        mobileNumberPlaceholder: 'Enter your 10-digit mobile number',
        deleteConfirmTitle: 'Delete {name}?',
        deleteConfirmDesc: 'Are you absolutely sure? This action cannot be undone and all your shop data will be lost forever.',
        shopDeleted: 'Your shop has been permanently deleted.',
        deleting: 'Deleting...',
        ok: 'OK',
        cancel: 'Cancel',
        soldOut: 'Sold Out',
        statusAuto: 'Auto',
        statusOpen: 'Open',
        statusClosed: 'Closed',
        statusLeave: 'On Leave',
        shopOnLeave: 'Shop is on Leave',
        shopNowAuto: 'Status set to Auto',
        shopNowLeave: 'Status set to On Leave',
        onLeave: 'On Leave',
        // Issue #14: missing translation keys
        removeItem: 'Remove Item',
        selectDistrictFirst: 'Please select a district first'
    },
    ta: {
        appName: 'ஸ்ட்ரீட்பைட்',
        searchPlaceholder: 'கடை அல்லது உணவைத் தேடு...',
        home: 'முகப்பு',
        search: 'தேடல்',
        addShop: 'கடை சேர்',
        profile: 'சுயவிவரம்',
        all: 'அனைத்தும்',
        open: 'திறந்திருக்கிறது',
        closed: 'மூடியிருக்கிறது',
        openNow: 'இப்போது திறந்திருக்கிறது',
        yourShopIsCurrentlyOpen: 'உங்கள் கடை தற்போது ஆர்டர்களை ஏற்றுக்கொள்கிறது',
        yourShopIsCurrentlyClosed: 'உங்கள் கடை தற்போது வாடிக்கையாளர்களுக்கு மூடப்பட்டுள்ளது',
        shopStatus: 'கடை நிலை',
        currentStatus: 'தற்போதைய நிலை',
        menu: 'உணவுப் பட்டியல்',
        reviews: 'மதிப்புரைகள்',
        writeReview: 'மதிப்புரை எழுது',
        submitReview: 'சமர்ப்பி',
        reviewPlaceholder: 'உங்கள் அனுபவத்தைப் பகிர்ந்து கொள்ளுங்கள்...',
        noReviews: 'இன்னும் மதிப்புரைகள் இல்லை! முதலில் எழுதுங்கள்!',
        addNewShop: 'புதிய கடை சேர்',
        shopName: 'கடை பெயர்',
        shopNamePlaceholder: 'கடை பெயரை உள்ளிடுக',
        foodCategory: 'உணவு வகை',
        selectCategory: 'வகையைத் தேர்வு செய்',
        areaLocation: 'பகுதி / இடம்',
        areaPlaceholder: 'உதா: டி நகர், அண்ணா நகர்',
        fullAddress: 'முழு முகவரி',
        addressPlaceholder: 'சரியான முகவரியை உள்ளிடுக',
        contactNumber: 'தொடர்பு எண்',
        todaysDiscount: 'இன்றைய சலுகை',
        discountPlaceholder: 'உதா: 10% தள்ளுபடி',
        openingTime: 'திறக்கும் நேரம்',
        closingTime: 'மூடும் நேரம்',
        menuItems: 'உணவுப் பட்டியல்',
        itemName: 'உணவு பெயர்',
        price: '₹',
        listMyShop: 'என் கடையைப் பதிவு செய்',
        noItemsAdded: 'இன்னும் உணவுகள் சேர்க்கப்படவில்லை',
        vendorLogin: 'வியாபாரி நுழைவு',
        vendorLoginSub: 'உங்கள் கடை நிலை மற்றும் உணவுப் பட்டியலை நிர்வகிக்க',
        selectYourShop: 'உங்கள் கடையைத் தேர்வு செய்',
        chooseYourShop: 'உங்கள் கடையைத் தேர்ந்தெடுக்கவும்',
        contactNumberLabel: 'தொடர்பு எண்',
        contactPlaceholder: 'உங்கள் பதிவு செய்த எண்',
        login: 'உள்நுழை',
        noShopListed: 'கடை இல்லையா?',
        addYourShop: 'உங்கள் கடையைச் சேர்',
        vendorDashboard: 'வியாபாரி கட்டுப்பாட்டறை',
        logout: 'வெளியேறு',
        menuAvailability: 'உணவு கிடைக்கும் நிலை',
        updateDiscount: 'சலுகையைப் புதுப்பி',
        language: 'மொழி',
        selectLanguage: 'மொழியைத் தேர்வு செய்',
        english: 'ஆங்கிலம்',
        tamil: 'தமிழ்',
        hindi: 'இந்தி',
        available: 'கிடைக்கிறது',
        unavailable: 'கிடைக்காது',
        on: 'ஆன்',
        off: 'ஆஃப்',
        itemNowStatus: '{item} இப்போது {status}',
        rating: 'மதிப்பீடு',
        tapToCall: 'அழைக்க தொடுக',
        noShopsFound: 'கடைகள் ஏதும் கிடைக்கவில்லை',
        addNewMenuItem: 'புதிய உணவைச் சேர்',
        itemNamePlaceholder: 'உதா: மசால் தோசை',
        addItemToMenu: 'உணவுப் பட்டியலில் சேர்',
        categoryFastFood: 'ஃபாஸ்ட் ஃபுட்',
        categoryBiryani: 'பிரியாணி',
        categoryParottaMeals: 'பரோட்டா & மீல்ஸ்',
        categoryGrilledNonVeg: 'க்ரில்ட் & நான்-வெஜ்',
        categoryJuice: 'பழச்சாறு',
        categorySweetBeverages: 'இனிப்பு & பானங்கள்',
        categorySnacks: 'சிற்றுண்டி',
        categoryOthers: 'மற்றவை',
        welcomeTitle: 'ஸ்ட்ரீட்பைட்-க்கு வரவேற்பு!',
        welcomeSubtitle: 'உங்கள் அருகில் சிறந்த தெரு உணவுகளைக் கண்டறியுங்கள்',
        adminConsole: 'ஸ்ட்ரீட்பைட் நிர்வாக கன்சோல்',
        adminConsoleDesc: 'பட்டியலிடப்பட்ட எந்தவொரு தெரு உணவுக் கடையையும் நிர்வகிக்கவும் மற்றும் நீக்கவும்',
        deleteShopBtn: 'கடையை நீக்கு',
        deletingShopBtn: 'நீக்கப்படுகிறது...',
        deleteShopConfirm: '"{name}" கடையை நிரந்தரமாக நீக்க விரும்புகிறீர்களா?\n\nஇந்தச் செயலை மாற்ற முடியாது.',
        shopDeletedSuccessfully: '"{name}" வெற்றிகரமாக நீக்கப்பட்டது!',
        shopsAvailable: 'கடைகள் கிடைக்கின்றன',
        toggleOpen: 'திறந்திருக்கிறது',
        toggleClosed: 'மூடியிருக்கிறது',
        selectLocation: 'இடம் தேர்வு',
        selectYourLocation: 'உங்கள் இடத்தைத் தேர்ந்தெடுக்கவும்',
        selectLocationDesc: 'உங்களுக்கு அருகிலுள்ள தெரு உணவுக் கடைகளைக் கண்டறிய ஹெடரில் உள்ள மாவட்டம் மற்றும் பகுதி தேர்வுகளைப் பயன்படுத்தவும்!',
        selectDistrict: 'மாவட்டம் தேர்வு',
        selectArea: 'பகுதி தேர்வு -',
        changeLocation: 'மாற்று',
        nearbyShops: 'அருகிலுள்ள கடைகள் -',
        searchDistrict: 'மாவட்டம் தேடு...',
        searchArea: 'பகுதி தேடு...',
        allAreas: 'அனைத்து பகுதிகள்',
        district: 'மாவட்டம்',
        listShopTitle: 'உங்கள் தெரு உணவுக் கடையைப் பதிவு செய்யுங்கள்',
        listShopSub: 'ஸ்ட்ரீட்பைட்-இல் நூற்றுக்கணக்கான வியாபாரிகளுடன் இணைந்து, உங்கள் பகுதியில் உள்ள வாடிக்கையாளர்களை உடனடியாக சென்றடையுங்கள்.',
        locationPinned: 'இடம் குறிக்கப்பட்டது',
        getReviews: 'மதிப்புரைகளைப் பெறுங்கள்',
        digitalMenu: 'டிஜிட்டல் மெனு',
        liveStatus: 'நேரடி நிலை',
        password: 'கடவுச்சொல்',
        confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
        passwordPlaceholder: 'குறைந்தது 4 எழுத்துக்கள்',
        confirmPasswordPlaceholder: 'கடவுச்சொல்லை மீண்டும் உள்ளிடவும்',
        vendorPasswordPlaceholder: 'உங்கள் கடையின் கடவுச்சொல்',
        passwordTooShort: 'கடவுச்சொல் குறைந்தது 4 எழுத்துக்கள் இருக்க வேண்டும்',
        passwordsDoNotMatch: 'கடவுச்சொற்கள் பொருந்தவில்லை',
        registrationFailed: 'பதிவு தோல்வியடைந்தது',
        shopRegistered: 'கடை பதிவு செய்யப்பட்டது! இப்போது அனைவருக்கும் தெரியும்.',
        networkError: 'பிணைய பிழை. மீண்டும் முயற்சிக்கவும்.',
        loggingIn: 'உள்நுழைகிறது...',
        invalidCredentials: 'தவறான மொபைல் எண் அல்லது கடவுச்சொல்',
        pleaseEnterDetails: 'மொபைல் எண் மற்றும் கடவுச்சொல்லை உள்ளிடுக',
        welcomeVendor: 'வரவேற்கிறோம்',
        registering: 'பதிவு செய்யப்படுகிறது...',
        fillRequired: 'அனைத்து கட்டாய புலங்களையும் நிரப்பவும்',
        addMenuItemError: 'குறைந்தது ஒரு உணவையாவது சேர்க்கவும்',
        itemAdded: 'பொருள் வெற்றிகரமாக சேர்க்கப்பட்டது',
        itemRemoved: 'பொருள் நீக்கப்பட்டது',
        failedToRemoveItem: 'பொருளை நீக்க முடியவில்லை',
        updateFailed: 'புதுப்பிப்பு தோல்வி',
        offerUpdated: 'சலுகை புதுப்பிக்கப்பட்டது!',
        loggedOut: 'வெளியேறப்பட்டது',
        deletionFailed: 'நீக்கம் தோல்வி. உங்கள் கடவுச்சொல்லை சரிபார்க்கவும்.',
        shopNotFound: 'கடை காணப்படவில்லை',
        pleaseSelectRating: 'தயவுசெய்து மதிப்பை தேர்வு செய்து மதிப்பாய்வு எழுதவும்',
        reviewSubmitted: 'மதிப்பாய்வு சமர்ப்பிக்கப்பட்டது!',
        couldNotSubmitReview: 'மதிப்பாய்வை சமர்ப்பிக்க முடியவில்லை',
        shopNowOpen: 'கடை இப்போது திறக்கப்பட்டுள்ளது',
        shopNowClosed: 'கடை இப்போது மூடப்பட்டுள்ளது',
        adding: 'சேர்க்கப்படுகிறது...',
        dangerZone: 'ஆபத்தான பகுதி',
        deleteShop: 'என் கடையை நீக்கு',
        deleteShopDesc: 'இது உங்கள் கடையையும் அதன் அனைத்து தரவுகளையும் நிரந்தரமாக நீக்கிவிடும். இந்தச் செயலைத் தவிர்க்க முடியாது.',
        authRequiredTitle: 'அங்கீகாரம் தேவை',
        authRequiredDesc: 'உங்கள் கடையை நீக்க உங்கள் பதிவு செய்யப்பட்ட மொபைல் எண் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.',
        confirmMobileNumber: 'மொபைல் எண்ணை உறுதிப்படுத்தவும்',
        confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
        mobileNumberPlaceholder: 'உங்கள் 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்',
        deleteConfirmTitle: '{name} நீக்கவா?',
        deleteConfirmDesc: 'நிச்சயமாக நீக்க வேண்டுமா? இந்தச் செயலைத் தவிர்க்க முடியாது மற்றும் உங்கள் கடையின் அனைத்து தரவுகளும் நிரந்தரமாக இழக்கப்படும்.',
        shopDeleted: 'உங்கள் கடை நிரந்தரமாக நீக்கப்பட்டது.',
        deleting: 'நீக்கப்படுகிறது...',
        ok: 'சரி',
        cancel: 'ரத்து',
        soldOut: 'முடிந்துவிட்டது',
        statusAuto: 'தானியங்கி',
        statusOpen: 'திறந்திருக்கிறது',
        statusClosed: 'மூடியிருக்கிறது',
        statusLeave: 'விடுமுறையில்',
        shopOnLeave: 'கடை விடுமுறையில் உள்ளது',
        shopNowAuto: 'நிலை தானியங்கிக்கு மாற்றப்பட்டது',
        shopNowLeave: 'நிலை விடுமுறைக்கு மாற்றப்பட்டது',
        onLeave: 'விடுமுறையில்',
        removeItem: 'பொருளை நீக்கு',
        selectDistrictFirst: 'முதலில் மாவட்டத்தை தேர்வு செய்யுங்கள்'
    },
    hi: {
        appName: 'स्ट्रीटबाइट',
        searchPlaceholder: 'दुकान या खाना खोजें...',
        home: 'मुख्य पृष्ठ',
        search: 'खोजें',
        addShop: 'दुकान जोड़ें',
        profile: 'प्रोफ़ाइल',
        all: 'सभी',
        open: 'खुला है',
        closed: 'बंद है',
        openNow: 'अभी खुला है',
        yourShopIsCurrentlyOpen: 'आपकी दुकान वर्तमान में ऑर्डर स्वीकार कर रही है',
        yourShopIsCurrentlyClosed: 'आपकी दुकान वर्तमान में ग्राहकों के लिए बंद है',
        shopStatus: 'दुकान की स्थिति',
        currentStatus: 'वर्तमान स्थिति',
        menu: 'मेनू',
        reviews: 'समीक्षाएँ',
        writeReview: 'समीक्षा लिखें',
        submitReview: 'जमा करें',
        reviewPlaceholder: 'अपना अनुभव साझा करें...',
        noReviews: 'अभी कोई समीक्षा नहीं! पहली समीक्षा दें!',
        addNewShop: 'नई दुकान जोड़ें',
        shopName: 'दुकान का नाम',
        shopNamePlaceholder: 'दुकान का नाम लिखें',
        foodCategory: 'खाने की श्रेणी',
        selectCategory: 'श्रेणी चुनें',
        areaLocation: 'इलाका / स्थान',
        areaPlaceholder: 'जैसे: टी नगर, अन्ना नगर',
        fullAddress: 'पूरा पता',
        addressPlaceholder: 'पूरा पता यहाँ लिखें',
        contactNumber: 'संपर्क नंबर',
        todaysDiscount: 'आज की पेशकश',
        discountPlaceholder: 'जैसे: 10% छूट',
        openingTime: 'खुलने का समय',
        closingTime: 'बंद होने का समय',
        menuItems: 'मेनू आइटम',
        itemName: 'आइटम का नाम',
        price: '₹',
        listMyShop: 'अपनी दुकान सूचीबद्ध करें',
        noItemsAdded: 'कोई आइटम नहीं जोड़ा गया',
        vendorLogin: 'विक्रेता लॉगिन',
        vendorLoginSub: 'अपनी दुकान की स्थिति और मेनू प्रबंधित करें',
        selectYourShop: 'अपनी दुकान चुनें',
        chooseYourShop: 'अपनी दुकान का चयन करें',
        contactNumberLabel: 'संपर्क नंबर',
        contactPlaceholder: 'अपना पंजीकृत नंबर डालें',
        login: 'लॉगिन',
        noShopListed: 'दुकान सूचीबद्ध नहीं है?',
        addYourShop: 'अपनी दुकान जोड़ें',
        vendorDashboard: 'विक्रेता डैशबोर्ड',
        logout: 'लॉगआउट',
        menuAvailability: 'मेनू उपलब्धता',
        updateDiscount: 'पेशकश अपडेट करें',
        language: 'भाषा',
        selectLanguage: 'भाषा चुनें',
        english: 'अंग्रेज़ी',
        tamil: 'तमिल',
        hindi: 'हिंदी',
        available: 'उपलब्ध',
        unavailable: 'अनुपलब्ध',
        on: 'चालू',
        off: 'बंद',
        itemNowStatus: '{item} अब {status} है',
        rating: 'रेटिंग',
        tapToCall: 'कॉल करने के लिए टैप करें',
        noShopsFound: 'कोई दुकान नहीं मिली',
        addNewMenuItem: 'नया मेनू आइटम जोड़ें',
        itemNamePlaceholder: 'जैसे: मसाला दोसा',
        addItemToMenu: 'मेनू में जोड़ें',
        categoryFastFood: 'फास्ट फूड',
        categoryBiryani: 'बिरयानी',
        categoryParottaMeals: 'पराठा & मील्स',
        categoryGrilledNonVeg: 'ग्रिल्ड & नॉन-वेज',
        categoryJuice: 'जूस',
        categorySweetBeverages: 'मिठाई & पेय',
        categorySnacks: 'नाश्ता',
        categoryOthers: 'अन्य',
        welcomeTitle: 'स्ट्रीटबाइट में आपका स्वागत है!',
        welcomeSubtitle: 'आपके आस-पास का बेहतरीन स्ट्रीट फूड खोजें',
        adminConsole: 'स्ट्रीटबाइट एडमिन कंसोल',
        adminConsoleDesc: 'सूचीबद्ध किसी भी स्ट्रीट फूड स्टॉल को प्रबंधित और हटाएं',
        deleteShopBtn: 'दुकान हटाएं',
        deletingShopBtn: 'हटाया जा रहा है...',
        deleteShopConfirm: 'क्या आप "{name}" को स्थायी रूप से हटाना चाहते हैं?\n\nइस क्रिया को वापस नहीं लिया जा सकता।',
        shopDeletedSuccessfully: '"{name}" सफलतापूर्वक हटा दिया गया!',
        shopsAvailable: 'दुकानें उपलब्ध',
        toggleOpen: 'खुला है',
        toggleClosed: 'बंद है',
        selectLocation: 'स्थान चुनें',
        selectYourLocation: 'अपना स्थान चुनें',
        selectLocationDesc: 'अपने आस-पास की स्ट्रीट फूड दुकानों को खोजने के लिए हेडर में जिला और क्षेत्र ड्रॉपडाउन का उपयोग करें!',
        selectDistrict: 'अपना जिला चुनें',
        selectArea: 'क्षेत्र चुनें -',
        changeLocation: 'बदलें',
        nearbyShops: 'आस-पास की दुकानें -',
        searchDistrict: 'जिला खोजें...',
        searchArea: 'क्षेत्र खोजें...',
        allAreas: 'सभी क्षेत्र',
        district: 'जिला',
        listShopTitle: 'अपनी स्ट्रीट फूड दुकान सूचीबद्ध करें',
        listShopSub: 'स्ट्रीटबाइट पर सैकड़ों विक्रेताओं से जुड़ें और तुरंत अपने क्षेत्र के ग्राहकों तक पहुंचें।',
        locationPinned: 'स्थान पिन किया गया',
        getReviews: 'समीक्षाएँ प्राप्त करें',
        digitalMenu: 'डिजिटल मेनू',
        liveStatus: 'लाइव स्थिति',
        password: 'पासवर्ड',
        confirmPassword: 'पासवर्ड की पुष्टि करें',
        passwordPlaceholder: 'कम से कम 4 अक्षर',
        confirmPasswordPlaceholder: 'पासवर्ड दोबारा डालें',
        vendorPasswordPlaceholder: 'आपकी दुकान का पासवर्ड',
        passwordTooShort: 'पासवर्ड कम कम 4 अक्षर का होना चाहिए',
        passwordsDoNotMatch: 'पासवर्ड मेल नहीं खाते',
        registrationFailed: 'पंजीकरण विफल रहा',
        shopRegistered: 'दुकान पंजीकृत! अब सभी उपयोगकर्ताओं के लिए दृश्यमान है।',
        networkError: 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।',
        loggingIn: 'लॉग इन हो रहा है...',
        invalidCredentials: 'अमान्य मोबाइल नंबर या पासवर्ड',
        pleaseEnterDetails: 'मोबाइल नंबर और पासवर्ड डालें',
        welcomeVendor: 'स्वागत है',
        registering: 'पंजीकरण हो रहा है...',
        fillRequired: 'कृपया सभी आवश्यक फ़ील्ड भरें',
        addMenuItemError: 'कृपया कम से कम एक मेनू आइटम जोड़ें',
        itemAdded: 'आइटम सफलतापूर्वक जोड़ा गया',
        itemRemoved: 'आइटम हटा दिया गया',
        failedToRemoveItem: 'आइटम हटाने में विफल',
        updateFailed: 'अपडेट विफल',
        offerUpdated: 'ऑफर अपडेट किया गया!',
        loggedOut: 'लॉग आउट किया गया',
        deletionFailed: 'हटाने में विफल। अपना पासवर्ड जांचें।',
        shopNotFound: 'दुकान नहीं मिली',
        pleaseSelectRating: 'कृपया एक रेटिंग चुनें और एक समीक्षा लिखें',
        reviewSubmitted: 'समीक्षा प्रस्तुत की गई!',
        couldNotSubmitReview: 'समीक्षा प्रस्तुत नहीं की जा सकी',
        shopNowOpen: 'दुकान अब खुली है',
        shopNowClosed: 'दुकान अब बंद है',
        adding: 'जोड़ा जा रहा है...',
        dangerZone: 'खतरा क्षेत्र',
        deleteShop: 'मेरी दुकान हटाएँ',
        deleteShopDesc: 'यह आपकी दुकान और उसके सभी डेटा को स्थायी रूप से हटा देगा। यह क्रिया वापस नहीं ली जा सकती।',
        authRequiredTitle: 'प्रमाणीकरण आवश्यक',
        authRequiredDesc: 'अपनी दुकान हटाने के लिए कृपया अपना पंजीकृत मोबाइल नंबर और पासवर्ड दर्ज करें।',
        confirmMobileNumber: 'मोबाइल नंबर की पुष्टि करें',
        confirmPassword: 'पासवर्ड की पुष्टि करें',
        mobileNumberPlaceholder: 'अपना 10-अंकीय मोबाइल नंबर दर्ज करें',
        deleteConfirmTitle: '{name} हटाएं?',
        deleteConfirmDesc: 'क्या आप पूरी तरह से आश्वस्त हैं? इस क्रिया को पूर्ववत नहीं किया जा सकता है और आपकी दुकान का सारा डेटा हमेशा के लिए खो जाएगा।',
        shopDeleted: 'आपकी दुकान स्थायी रूप से हटा दी गई है।',
        deleting: 'हटाया जा रहा है...',
        ok: 'ठीक है',
        cancel: 'रद्द करें',
        soldOut: 'खत्म हो गया',
        statusAuto: 'ऑटो',
        statusOpen: 'खुला है',
        statusClosed: 'बंद है',
        statusLeave: 'छुट्टी पर',
        shopOnLeave: 'दुकान छुट्टी पर है',
        shopNowAuto: 'स्थिति ऑटो पर सेट है',
        shopNowLeave: 'स्थिति छुट्टी पर सेट है',
        onLeave: 'छुट्टी पर',
        removeItem: 'आइटम हटाएं',
        selectDistrictFirst: 'कृपया पहले जिला चुनें'
    }
};

// Category SVG Icons (inline, 20x20, stroke-based)
const categorySVGs = {
    'Fast Food': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16h.01"/><path d="m2 16 20 6-6-20A20 20 0 0 0 2 16"/><path d="M5.71 17.11a17.04 17.04 0 0 1 11.4-11.4"/></svg>', /* Pizza style */
    'Biryani': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M12 12c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4Z"/></svg>', /* Rice Bowl style */
    'Parotta & Meals': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 12s-2-2-2-5 2-5 2-5 2 2 2 5-2 5-2 5Z"/><path d="M12 12s2 2 2 5-2 5-2 5-2-2-2-5 2-5 2-5Z"/></svg>', /* Plate style */
    'Grilled & Non-Veg': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>', /* Flame style */
    'Juice': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z"/><path d="M14 2 9 8"/></svg>',
    'Sweet & Beverages': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21H4V12l8-7 8 7v9Z"/><path d="M12 5v7"/><path d="M4 12h16"/></svg>',
    'Snacks': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M18 12h.01"/><path d="M15 16h.01"/><path d="M11 15h.01"/><path d="M8 12h.01"/><path d="M11 9h.01"/></svg>', /* Cookie style */
    'Others': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>'
};

// Legacy compat — categoryEmojis now returns SVG markup
const categoryEmojis = categorySVGs;

// Convert 24-hour time to 12-hour format
// Fix #11: guard against null/non-string input to prevent crash
function formatTime12Hour(time24) {
    if (!time24 || typeof time24 !== 'string' || !time24.includes(':')) return 'N/A';
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    if (isNaN(h)) return 'N/A';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // 0 becomes 12
    return `${h}:${minutes || '00'} ${ampm}`;
}

// Get translation
function t(key) {
    return translations[currentLanguage][key] || translations['en'][key] || key;
}

// Check if shop is currently open based on status mode and timing
function isShopOpen(stall) {
    if (!stall) return false;
    if (stall.status === 'open') return true;
    if (stall.status === 'closed' || stall.status === 'leave') return false;
    
    // Auto mode: check timing
    if (stall.status === 'auto' || !stall.status) {
        const now = new Date();
        const currentH = now.getHours();
        const currentM = now.getMinutes();
        const currentTime = currentH * 60 + currentM;

        const [openH, openM] = (stall.openTime || '09:00').split(':').map(Number);
        const [closeH, closeM] = (stall.closeTime || '22:00').split(':').map(Number);
        
        const openTime = openH * 60 + openM;
        const closeTime = closeH * 60 + closeM;

        if (closeTime > openTime) {
            return currentTime >= openTime && currentTime < closeTime;
        } else {
            // Overnights
            return currentTime >= openTime || currentTime < closeTime;
        }
    }
    return false;
}

// Get status label and color class
function getShopStatusInfo(stall) {
    const open = isShopOpen(stall);
    if (stall.status === 'leave') {
        return { label: t('onLeave'), class: 'leave', icon: '✕ ' };
    }
    return {
        label: open ? t('open') : t('closed'),
        class: open ? 'open' : 'closed',
        icon: open ? '✓ ' : '✕ '
    };
}

// Helper: render a category tab button with SVG icon
function getCategoryTabHTML(categoryKey, categoryValue, selectedCategory) {
    const isAll = categoryKey === 'All';
    const svgIcon = isAll ? '' : `<span class="cat-icon">${categorySVGs[categoryKey] || ''}</span> `;
    const label = isAll ? t('all') : t(categoryValue);
    return `<button class="category-tab ${selectedCategory === categoryKey ? 'active' : ''}" data-category="${categoryKey}">${svgIcon}${label}</button>`;
}

// Build all category tabs HTML
function buildCategoryTabsHTML(selectedCategory) {
    const categories = [
        ['All', 'all'],
        ['Fast Food', 'categoryFastFood'],
        ['Biryani', 'categoryBiryani'],
        ['Parotta & Meals', 'categoryParottaMeals'],
        ['Grilled & Non-Veg', 'categoryGrilledNonVeg'],
        ['Juice', 'categoryJuice'],
        ['Sweet & Beverages', 'categorySweetBeverages'],
        ['Snacks', 'categorySnacks'],
        ['Others', 'categoryOthers']
    ];
    return categories.map(([key, val]) => getCategoryTabHTML(key, val, selectedCategory)).join('\n                ');
}

// Total Conversion Translation System (Google API Fallback)
// Issue #18: Bounded LRU cache — max 500 entries; oldest evicted on overflow
const TRANSLATION_CACHE_MAX = 500;
const stallTranslationCache = {};
const _cacheKeyOrder = []; // LRU order tracker

function _cacheSet(key, value) {
    if (!stallTranslationCache[key]) {
        if (_cacheKeyOrder.length >= TRANSLATION_CACHE_MAX) {
            // Evict least-recently-used (front of queue)
            const evict = _cacheKeyOrder.shift();
            delete stallTranslationCache[evict];
        }
        _cacheKeyOrder.push(key);
    } else {
        // Move to end (most recently used)
        const idx = _cacheKeyOrder.indexOf(key);
        if (idx !== -1) _cacheKeyOrder.splice(idx, 1);
        _cacheKeyOrder.push(key);
    }
    stallTranslationCache[key] = value;
}

async function getTranslation(text, targetLang) {
    if (!text || targetLang === 'en') return text;
    const cacheKey = `${targetLang}:${text}`;
    if (stallTranslationCache[cacheKey]) return stallTranslationCache[cacheKey];

    // Try manual dictionary first for common terms
    let translated = text;
    let found = false;
    for (const [enKey, translations] of Object.entries(dynamicTranslations)) {
        if (translations[targetLang]) {
            const regex = new RegExp(`\\b${enKey}\\b`, 'gi');
            if (regex.test(translated)) {
                translated = translated.replace(regex, translations[targetLang]);
                found = true;
            }
        }
    }
    if (found && translated !== text) return translated;

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            const result = data[0][0][0];
            _cacheSet(cacheKey, result);
            return result;
        }
    } catch (e) {
        console.warn("API Translation failed, using original:", text);
    }
    return text;
}

async function getTransliteration(text, targetLang) {
    if (!text || targetLang === 'en') return text;
    const cacheKey = `translit:${targetLang}:${text}`;
    if (stallTranslationCache[cacheKey]) return stallTranslationCache[cacheKey];

    // 0. Check Manual Map first — exact match (case-insensitive)
    if (dynamicTranslations[text] && dynamicTranslations[text][targetLang]) {
        stallTranslationCache[cacheKey] = dynamicTranslations[text][targetLang];
        return dynamicTranslations[text][targetLang];
    }
    const lowerText = text.toLowerCase();
    for (let key in dynamicTranslations) {
        if (key.toLowerCase() === lowerText && dynamicTranslations[key][targetLang]) {
            stallTranslationCache[cacheKey] = dynamicTranslations[key][targetLang];
            return dynamicTranslations[key][targetLang];
        }
    }

    const itcMap = { 'ta': 'ta-t-i0-und', 'hi': 'hi-t-i0-und' };
    const itc = itcMap[targetLang];

    if (itc) {
        try {
            // 1. Use PLACEHOLDER system: replace known words with __PH_N__ markers
            //    so we NEVER send mixed-script text to the API
            let processedText = text;
            const placeholders = {};
            let phIndex = 0;

            // Sort keys longest-first to match multi-word phrases before single words
            const sortedKeys = Object.keys(dynamicTranslations).sort((a, b) => b.length - a.length);

            for (const key of sortedKeys) {
                const trans = dynamicTranslations[key];
                if (trans && trans[targetLang]) {
                    const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                    if (regex.test(processedText)) {
                        const ph = `__PH_${phIndex}__`;
                        placeholders[ph] = trans[targetLang];
                        processedText = processedText.replace(regex, ph);
                        phIndex++;
                    }
                }
            }

            // 2. If everything was replaced (no English letters remain), just restore placeholders
            if (!/[a-zA-Z]/.test(processedText.replace(/__PH_\d+__/g, ''))) {
                let result = processedText;
                for (const [ph, val] of Object.entries(placeholders)) {
                    result = result.replace(new RegExp(ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), val);
                }
                result = result.replace(/\s+/g, ' ').trim();
                _cacheSet(cacheKey, result);
                return result;
            }

            // 3. Split by placeholders, transliterate only the English segments
            const segments = processedText.split(/(__PH_\d+__)/);
            const resultParts = [];

            for (const seg of segments) {
                const trimmed = seg.trim();
                if (!trimmed) {
                    resultParts.push(seg); // preserve whitespace
                    continue;
                }
                if (placeholders[trimmed]) {
                    // Known word — use our manual translation
                    resultParts.push(placeholders[trimmed]);
                } else if (/[a-zA-Z]/.test(seg)) {
                    // English text — transliterate full segment via API
                    const segmentText = seg.trim();
                    let transText = segmentText;
                    try {
                        const wUrl = `https://inputtools.google.com/request?text=${encodeURIComponent(segmentText)}&itc=${itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`;
                        const wRes = await fetch(wUrl);
                        const wData = await wRes.json();
                        if (wData && wData[0] === 'SUCCESS' && wData[1]) {
                            transText = '';
                            for (const part of wData[1]) {
                                if (part[1] && part[1].length > 0) {
                                    transText += part[1][0];
                                } else if (part[0]) {
                                    transText += part[0];
                                }
                            }
                        }
                    } catch (e) { /* fallback to original */ }
                    // Restore leading and trailing spaces from the original segment
                    const prefixMatch = seg.match(/^\s*/);
                    const suffixMatch = seg.match(/\s*$/);
                    const prefix = prefixMatch ? prefixMatch[0] : '';
                    const suffix = suffixMatch ? suffixMatch[0] : '';
                    resultParts.push(prefix + transText + suffix);
                } else {
                    resultParts.push(seg);
                }
            }

            const finalResult = resultParts.join(' ').replace(/\s+/g, ' ').trim();
            if (finalResult && finalResult !== text) {
                _cacheSet(cacheKey, finalResult);
                return finalResult;
            }
        } catch (e) {
            console.warn("Transliteration failed:", e);
        }
    }
    return await getTranslation(text, targetLang);
}

async function translateSingleStall(stall, lang) {
    if (!stall || lang === 'en') return;
    try {
        // 1. Check if database already has the transliteration
        const dbName = lang === 'ta' ? stall.nameTa : stall.nameHi;
        if (dbName) {
            stall.name_localized = dbName;
        } else {
            stall.name_localized = await getTransliteration(stall.name, lang);
        }
        
        // Translate area and address (meaning-based) — usually from fixed list or Google Translate
        stall.area_localized = await getTranslation(stall.area, lang);
        stall.address_localized = await getTranslation(stall.address, lang);
        if (stall.todayDiscount) {
            stall.todayDiscount_localized = await getTranslation(stall.todayDiscount, lang);
        }
        
        if (stall.menu) {
            for (let item of stall.menu) {
                const dbItemName = lang === 'ta' ? item.itemNameTa : item.itemNameHi;
                if (dbItemName) {
                    item.itemName_localized = dbItemName;
                } else {
                    item.itemName_localized = await getTransliteration(item.itemName, lang);
                }
            }
        }
        if (stall.reviews) {
            for (let rev of stall.reviews) {
                rev.comment_localized = await getTranslation(rev.comment, lang);
            }
        }
    } catch (e) {
        console.error("Error in translateSingleStall:", e);
    }
}

async function translateAllStalls() {
    if (currentLanguage === 'en' || stalls.length === 0) return;
    const lang = currentLanguage;
    
    const promises = stalls.map(stall => translateSingleStall(stall, lang));
    if (vendorShop) promises.push(translateSingleStall(vendorShop, lang));
    
    await Promise.all(promises);
}

// Helper: translate dynamic content (shop names, menu items)
function td(text, obj = null) {
    if (!text || currentLanguage === 'en') return text;
    
    // If it's a menu item object
    if (obj) {
        const dbItemName = currentLanguage === 'ta' ? obj.itemNameTa : obj.itemNameHi;
        if (dbItemName && text === obj.itemName) return dbItemName;
        if (obj.itemName_localized && text === obj.itemName) return obj.itemName_localized;
    }

    // If it's a stall or review object
    if (obj) {
        const dbName = currentLanguage === 'ta' ? obj.nameTa : obj.nameHi;
        if (dbName && text === obj.name) return dbName;
        
        if (obj.name_localized && text === obj.name) return obj.name_localized;
        if (obj.area_localized && text === obj.area) return obj.area_localized;
        if (obj.address_localized && text === obj.address) return obj.address_localized;
        if (obj.comment_localized && text === obj.comment) return obj.comment_localized;
        if (obj.todayDiscount_localized && text === obj.todayDiscount) return obj.todayDiscount_localized;
    }

    let translated = text;
    for (const [enKey, translations] of Object.entries(dynamicTranslations)) {
        if (translations[currentLanguage]) {
            const regex = new RegExp(`\\b${enKey}\\b`, 'gi');
            translated = translated.replace(regex, translations[currentLanguage]);
        }
    }
    return translated;
}

// Helper: translate district names dynamically
function tDistrict(dist) {
    if (!dist) return '';
    if (currentLanguage === 'ta') {
        return districtNamesTa[dist] || dist;
    } else if (currentLanguage === 'hi') {
        return districtNamesHi[dist] || dist;
    }
    return dist;
}

// Load saved language preference
function loadLanguagePreference() {
    const savedLang = localStorage.getItem('streetbite_lang');
    if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
        updateHeaderLanguageSelector();
    }
}

// Change language and re-render everything
async function changeLanguage(lang) {
    if (lang === currentLanguage) return;
    currentLanguage = lang;
    localStorage.setItem('streetbite_lang', lang);
    
    showLoading(true);
    await translateAllStalls();
    showLoading(false);
    
    // Destroy existing Add Shop modal so it re-renders with the new language
    const modal = document.getElementById('add-shop-modal');
    if (modal) modal.remove();

    // Re-render current state
    if (currentPage === 'home') renderHomePage();
    else if (currentPage === 'search') renderSearchPage();
    else if (currentPage === 'profile') renderProfilePage();
    else if (currentPage === 'detail' && currentStallId) showShopDetail(currentStallId);
    
    updateHeaderLanguageSelector();
    updateHeaderLocationBar();
    updateNavigationLabels();
}

// Populate header location dropdowns (Unified Single Box)
// Populate header location dropdowns (Unified Custom Attractive Box - Clean Version)
function updateHeaderLocationBar() {
    const trigger = document.getElementById('location-trigger');
    const triggerText = document.getElementById('location-trigger-text');
    const optionsContainer = document.getElementById('location-options');
    if (!trigger || !optionsContainer) return;

    // Update Trigger Text
    if (selectedArea && selectedArea !== 'All Areas') {
        triggerText.textContent = getAreaName(selectedArea);
    } else if (selectedDistrict) {
        triggerText.textContent = getDistrictName(selectedDistrict);
    } else {
        triggerText.textContent = t('selectLocation');
    }

    // Build Options HTML
    let optionsHTML = '';
    if (!selectedDistrict) {
        // Step 1: District Selection
        optionsHTML = Object.keys(tamilNaduDistricts).sort().map(d => `
            <div class="custom-option" onclick="handleLocationSelection('dist:${d}')">
                ${getDistrictName(d)}
            </div>
        `).join('');
    } else {
        // Step 2: Area Selection within the SAME box
        const areas = tamilNaduDistricts[selectedDistrict] || [];
        const districtName = getDistrictName(selectedDistrict);
        
        optionsHTML = `
            <div class="custom-option back-option" onclick="handleLocationSelection('back')">
                ✕ ${districtName}
            </div>
            <div class="custom-option ${(!selectedArea || selectedArea === 'All Areas') ? 'selected' : ''}" onclick="handleLocationSelection('area:All Areas')">
                ${t('allAreas')}
            </div>
        ` + areas.sort().map(a => `
            <div class="custom-option ${selectedArea === a ? 'selected' : ''}" onclick="handleLocationSelection('area:${a}')">
                ${getAreaName(a)}
            </div>
        `).join('');
    }
    
    optionsContainer.innerHTML = optionsHTML;

    // Toggle Dropdown
    trigger.onclick = (e) => {
        e.stopPropagation();
        optionsContainer.classList.toggle('active');
    };
}

// Global handler for location selection
window.handleLocationSelection = function(val) {
    const optionsContainer = document.getElementById('location-options');
    if (val === 'back') {
        selectedDistrict = null;
        selectedArea = null;
        localStorage.removeItem('streetbite_district');
        localStorage.removeItem('streetbite_area');
    } else if (val.startsWith('dist:')) {
        selectedDistrict = val.replace('dist:', '');
        selectedArea = 'All Areas';
        localStorage.setItem('streetbite_district', selectedDistrict);
        localStorage.setItem('streetbite_area', 'All Areas');
    } else if (val.startsWith('area:')) {
        selectedArea = val.replace('area:', '');
        localStorage.setItem('streetbite_area', selectedArea);
    }
    
    updateHeaderLocationBar();
    if (currentPage === 'home') renderHomePage();
    else if (currentPage === 'search') renderSearchPage();
    
    // Keep open if picking district to show areas, else close
    if (!val.startsWith('dist:')) {
        if (optionsContainer) optionsContainer.classList.remove('active');
    } else {
        // Stay active to show areas immediately
        if (optionsContainer) optionsContainer.classList.add('active');
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    const locOptions = document.getElementById('location-options');
    if (locOptions) locOptions.classList.remove('active');
    const langOptions = document.getElementById('language-options');
    if (langOptions) langOptions.classList.remove('active');
});
window.changeLanguage = changeLanguage;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadLanguagePreference();
    setupNavigation();
    updateLocationButtonText();
    updateHeaderLocationBar();
    initializeData();
});

// Setup bottom navigation
function setupNavigation() {
    updateNavigationLabels();
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            const page = item.dataset.page;
            // If the add-shop modal is currently open and visible, just render
            // the page BEHIND it — the modal stays on top (data preserved).
            const modal = document.getElementById('add-shop-modal');
            const modalOpen = modal && modal.classList.contains('active');
            navigateTo(page, true);
            // Re-show modal on top if it was open
            if (modalOpen) modal.classList.add('active');
        });
    });
}

// Update navigation labels with current language
function updateNavigationLabels() {
    const navLabels = {
        'home': t('home'),
        'search': t('search'),
        'profile': t('profile')
    };
    document.querySelectorAll('.nav-item').forEach(item => {
        const label = item.querySelector('.nav-label');
        if (label && navLabels[item.dataset.page]) {
            label.textContent = navLabels[item.dataset.page];
        }
    });
}

// Update header language selector
function updateHeaderLanguageSelector() {
    const triggerText = document.getElementById('language-trigger-text');
    const optionsContainer = document.getElementById('language-options');
    const trigger = document.getElementById('language-trigger');
    
    if (triggerText) {
        const langMap = { 'en': 'EN', 'ta': 'தமிழ்', 'hi': 'हिंदी' };
        triggerText.textContent = langMap[currentLanguage] || currentLanguage.toUpperCase();
    }
    
    if (trigger && optionsContainer) {
        // Toggle Dropdown
        trigger.onclick = (e) => {
            e.stopPropagation();
            optionsContainer.classList.toggle('active');
            
            // Close location options if open
            const locOptions = document.getElementById('location-options');
            if (locOptions) locOptions.classList.remove('active');
        };
        
        // Mark the selected one
        const options = optionsContainer.querySelectorAll('.custom-option');
        options.forEach(opt => {
            const onclickStr = opt.getAttribute('onclick') || '';
            if (onclickStr.includes(`'${currentLanguage}'`) || onclickStr.includes(`"${currentLanguage}"`)) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }
}

// Navigation
function navigateTo(page, skipPush = false) {
    if (!skipPush && currentPage && currentPage !== page) {
        navigationStack.push({ page: currentPage, stallId: currentStallId });
    }
    currentPage = page;
    selectedCategory = 'All';
    searchQuery = '';

    switch(page) {
        case 'home':
            renderHomePage();
            break;
        case 'search':
            renderSearchPage();
            break;
        case 'add':
            // 'add' is now always a modal overlay — render profile page behind it
            renderProfilePage();
            renderAddShopPage();
            break;
        case 'profile':
            renderProfilePage();
            break;
    }
}

window.goBack = function() {
    if (navigationStack.length > 0) {
        const prev = navigationStack.pop();
        currentPage = prev.page;
        currentStallId = prev.stallId;
        
        if (currentPage === 'home') renderHomePage();
        else if (currentPage === 'search') renderSearchPage();
        else if (currentPage === 'profile') renderProfilePage();
        else if (currentPage === 'detail' && currentStallId) showShopDetail(currentStallId);
        
        // Update nav UI
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-page="${currentPage}"]`);
        if (navItem) navItem.classList.add('active');
    } else {
        navigateTo('home', true);
    }
}

// Reload stalls from API and re-render home
async function reloadStalls() {
    await loadStalls();
    renderHomePage();
}

// Show/Hide loading spinner
function showLoading(show) {
    document.getElementById('loading').classList.toggle('active', show);
}

// Render Home Page
function renderHomePage() {
    const app = document.getElementById('app');
    updateHeaderLanguageSelector();
    updateNavigationLabels();
    updateLocationButtonText();

    // Build location chip HTML
    let locationChipHTML = '';
    if (selectedDistrict && selectedArea && selectedArea !== 'All Areas') {
        locationChipHTML = `
            <div class="selected-location-chip">
                <span class="location-chip-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>
                <span class="location-chip-text">${t('nearbyShops')} <strong>${getAreaName(selectedArea)}, ${getDistrictName(selectedDistrict)}</strong></span>
                <button class="location-chip-change" onclick="openLocationPicker()">${t('changeLocation')}</button>
            </div>
        `;
    } else if (selectedDistrict) {
        locationChipHTML = `
            <div class="selected-location-chip">
                <span class="location-chip-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>
                <span class="location-chip-text">${t('nearbyShops')} <strong>${getDistrictName(selectedDistrict)}</strong></span>
                <button class="location-chip-change" onclick="openLocationPicker()">${t('changeLocation')}</button>
            </div>
        `;
    }

    app.innerHTML = `
        <div class="page home-page">
            <div class="welcome-banner">
                <div class="welcome-text">
                    <h2 class="welcome-title">${t('welcomeTitle')}</h2>
                    <p class="welcome-subtitle">${t('welcomeSubtitle')}</p>
                </div>
            </div>
            ${locationChipHTML}
            ${(selectedDistrict || selectedArea) ? `
            <div class="category-tabs">
                ${buildCategoryTabsHTML(selectedCategory)}
            </div>
            <div class="shop-grid" id="shop-grid"></div>
            ` : `
            <div class="select-location-prompt">
                <div class="prompt-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>
                <h3 class="prompt-title">${t('selectYourLocation')}</h3>
                <p class="prompt-desc">${t('selectLocationDesc')}</p>
            </div>
            `}
        </div>
    `;

    if (selectedDistrict || selectedArea) {
        // Setup category tabs
        app.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                selectedCategory = tab.dataset.category;
                app.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderShopGrid();
            });
        });
        renderShopGrid();
    }
}

// Render shop grid — strictly filtered by selected location
function renderShopGrid() {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;
    let filtered = stalls;

    // Strict location filtering — user must select an area/district to see shops
    if (!selectedArea || selectedArea === 'All Areas') {
        // User requested: do NOT show any shop if only district is selected. Area must be selected.
        filtered = [];
    } else {
        // Specific area selected — show only shops in that area
        // Match against both 'area' and 'address' fields for maximum coverage
        const areaLower = selectedArea.toLowerCase();
        filtered = filtered.filter(s => {
            const shopArea = (s.area || '').toLowerCase();
            const shopAddr = (s.address || '').toLowerCase();
            return shopArea.includes(areaLower) || shopAddr.includes(areaLower) ||
                   areaLower.includes(shopArea);
        });
    }

    // Filter by category
    if (selectedCategory !== 'All') {
        filtered = filtered.filter(s => s.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.area.toLowerCase().includes(query) ||
            s.category.toLowerCase().includes(query)
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div>
                <p>${t('noShopsFound')}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(stall => `
        <div class="shop-card" data-id="${stall.id}">
            <div class="shop-card-header">
                <span class="shop-name">${escapeHTML(td(stall.name, stall))}</span>
                <span class="shop-category-icon">${categorySVGs[stall.category] || ''}</span>
            </div>
            <span class="shop-category">${getCategoryName(stall.category)}</span>
            <div class="shop-area"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${escapeHTML(td(stall.area, stall))}</div>
            <div>
                <span class="shop-status ${getShopStatusInfo(stall).class}">${getShopStatusInfo(stall).icon}${getShopStatusInfo(stall).label}</span>
                <span class="shop-rating"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; color:#fbbf24;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${(stall.rating || 0).toFixed(1)} (${stall.totalReviews || 0})</span>
            </div>
            ${stall.todayDiscount ? `<div class="shop-discount"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; color:#22c55e;"><polyline points="20 6 9 17 4 12"/></svg> ${escapeHTML(td(stall.todayDiscount, stall))}</div>` : ''}
        </div>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.shop-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            showShopDetail(id);
        });
    });
}

// Render Search Page
// Issue #13: Search page now respects location filter — shows all stalls when
// no location is selected (search is intentionally global by design), but
// renderShopGrid() already applies location filters when selectedDistrict is set.
function renderSearchPage() {
    const app = document.getElementById('app');
    updateHeaderLanguageSelector();
    updateNavigationLabels();

    app.innerHTML = `
        <div class="page search-page">
            <div class="search-section">
                <input type="text" class="search-input" placeholder="${t('searchPlaceholder')}" value="${searchQuery}" autofocus>
            </div>
            <div class="category-tabs">
                ${buildCategoryTabsHTML(selectedCategory)}
            </div>
            <div class="shop-grid" id="shop-grid"></div>
        </div>
    `;

    // Setup search
    const searchInput = app.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        lastInteractionTime = Date.now();
        renderShopGrid();
    });

    // Setup category tabs
    app.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            selectedCategory = tab.dataset.category;
            app.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            lastInteractionTime = Date.now();
            renderShopGrid();
        });
    });

    selectedCategory = 'All'; // Reset for search
    renderShopGrid();
}

// Show Shop Detail (static version for GitHub Pages)
function showShopDetail(id) {
    if (currentPage && currentPage !== 'detail') {
        navigationStack.push({ page: currentPage, stallId: currentStallId });
    }
    currentStallId = id;
    currentPage = 'detail';
    showLoading(true);
    const stall = stalls.find(s => s.id === id);
    if (stall) {
        renderShopDetailPage(stall);
    } else {
        showToast(t('shopNotFound'), 'error');
    }
    showLoading(false);
}

// Render Shop Detail Page
function renderShopDetailPage(stall) {
    const app = document.getElementById('app');
    const isOpen = stall.status === 'open';
    const openTime12 = formatTime12Hour(stall.openTime);
    const closeTime12 = formatTime12Hour(stall.closeTime);

    app.innerHTML = `
        <div class="page shop-detail-page">
            <div class="page-header">
                <button class="back-btn" onclick="goBack()">←</button>
                <h2>${escapeHTML(td(stall.name, stall))}</h2>
            </div>

            <div class="detail-header">
                <div class="detail-name-row">
                    <span class="detail-icon">${categorySVGs[stall.category] || ''}</span>
                    <span class="detail-name-text">${escapeHTML(td(stall.name, stall))}</span>
                </div>
                <div class="detail-category">${getCategoryName(stall.category)}</div>

                <div class="status-banner ${getShopStatusInfo(stall).class}">
                    <span class="status-dot"></span>
                    <span>${getShopStatusInfo(stall).label}</span>
                    <span>• ${openTime12} - ${closeTime12}</span>
                </div>

                <div class="detail-info">
                    <div class="info-row">
                        <span class="icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>
                        <span>${escapeHTML(td(stall.address || stall.area, stall))}</span>
                    </div>
                    ${stall.contact ? `
                    <button class="submit-btn" style="background:#4CAF50; margin-top:10px;" onclick="window.location.href='tel:${escapeHTML(stall.contact)}'">
                        📞 Call Shop
                    </button>` : '<p style="color:#999;">Contact not available</p>'}
                    <div class="info-row">
                        <span class="icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; color:#fbbf24;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>
                        <span>${(stall.rating || 0).toFixed(1)} ${t('rating')} (${stall.totalReviews || 0})</span>
                    </div>
                </div>
            </div>

            ${stall.todayDiscount ? `
                <div class="discount-banner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; color:#22c55e;"><polyline points="20 6 9 17 4 12"/></svg> ${escapeHTML(td(stall.todayDiscount, stall))}
                </div>
            ` : ''}

            <h3 class="section-title">${t('menu')}</h3>
            <div class="menu-list">
                ${stall.menu.map(item => {
                    const itemAvailable = isShopOpen(stall) ? item.available : false;
                    return `
                    <div class="menu-item ${!itemAvailable ? 'menu-item-unavailable' : ''}">
                        <div class="menu-item-info">
                            <div class="menu-item-name">${escapeHTML(td(item.itemName, item))}</div>
                            <div class="menu-item-price">₹${item.price}</div>
                        </div>
                        ${!itemAvailable ? `<div class="sold-out-badge">${t('soldOut')}</div>` : ''}
                    </div>
                `}).join('')}
            </div>

            <h3 class="section-title">${t('reviews')} (${stall.reviews.length})</h3>
            <div class="reviews-list">
                ${stall.reviews.length > 0 ? stall.reviews.map(review => `
                    <div class="review-card">
                        <div class="review-header">
                            <div class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                            <span class="review-date">${escapeHTML(review.date)}</span>
                        </div>
                        <div class="review-comment">${escapeHTML(td(review.comment, review))}</div>
                    </div>
                `).join('') : `<div class="empty-state"><p>${t('noReviews')}</p></div>`}
            </div>

            <div class="add-review-form">
                <h3 class="section-title">${t('writeReview')}</h3>
                <div class="star-rating" id="star-rating">
                    ${[1,2,3,4,5].map(n => `<button data-rating="${n}" class="star-btn">☆</button>`).join('')}
                </div>
                <textarea class="review-input" placeholder="${t('reviewPlaceholder')}" id="review-text"></textarea>
                <button class="submit-btn" id="submit-review">${t('submitReview')}</button>
            </div>
        </div>
    `;

    // Setup star rating
    let selectedRating = 0;
    const starButtons = app.querySelectorAll('.star-btn');
    starButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedRating = parseInt(btn.dataset.rating);
            starButtons.forEach((b, i) => {
                b.classList.toggle('active', i < selectedRating);
                b.textContent = i < selectedRating ? '★' : '☆';
            });
        });
    });

    // Setup submit review — POST to API
    app.querySelector('#submit-review').addEventListener('click', async () => {
        const comment = app.querySelector('#review-text').value.trim();
        if (!comment || selectedRating === 0) {
            showToast(t('pleaseSelectRating'), 'error');
            return;
        }
        try {
            const res = await fetch(`/api/stalls/${stall.id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: selectedRating, comment })
            });
            const updated = await res.json();
            // Update local stall data
            const idx = stalls.findIndex(s => s.id === stall.id);
            if (idx !== -1) stalls[idx] = updated;
            showToast(t('reviewSubmitted'), 'success');
            renderShopDetailPage(updated);
        } catch (e) {
            showToast(t('couldNotSubmitReview'), 'error');
        }
    });
}

// Render Add Shop as a persistent full-screen modal
function renderAddShopPage() {
    console.log('[AddShop] renderAddShopPage() called');

    // If modal already exists, remove it and recreate (ensures latest logic/listeners are used)
    const existingModal = document.getElementById('add-shop-modal');
    if (existingModal) {
        console.log('[AddShop] Removing existing modal to refresh logic');
        existingModal.remove();
    }
    
    console.log('[AddShop] Creating fresh modal instance');
    let menuItems = [];

    // Create modal element and append to body
    const modal = document.createElement('div');
    modal.id = 'add-shop-modal';
    modal.className = 'add-shop-modal active';

    modal.innerHTML = `
        <div class="add-shop-modal-inner">
            <!-- LEFT: Orange preview panel (visible on laptop+) -->
            <div class="add-shop-preview-panel">
                <div class="add-shop-preview-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg></div>
                <div class="add-shop-preview-title">${t('listShopTitle')}</div>
                <div class="add-shop-preview-sub">${t('listShopSub')}</div>
                <div class="add-shop-preview-badges">
                    <span class="add-shop-preview-badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${t('locationPinned')}</span>
                    <span class="add-shop-preview-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; color:#fbbf24;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${t('getReviews')}</span>
                    <span class="add-shop-preview-badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg> ${t('digitalMenu')}</span>
                    <span class="add-shop-preview-badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg> ${t('liveStatus')}</span>
                </div>
            </div>

            <!-- RIGHT: Form section -->
            <div class="add-shop-form-section">
                <div class="add-shop-modal-header">
                    <h2 class="add-shop-modal-title">${t('addNewShop')}</h2>
                    <button class="add-shop-close-btn" id="add-shop-close-btn" title="Close">✕</button>
                </div>
                <div class="add-shop-modal-body">
                    <div class="form-section">
                        <div class="form-group">
                            <label>${t('shopName')} *</label>
                            <input type="text" id="shop-name" placeholder="${t('shopNamePlaceholder')}" required>
                        </div>

                        <div class="form-group">
                            <label>${t('foodCategory')} *</label>
                            <select id="shop-category">
                                <option value="">${t('selectCategory')}</option>
                                <option value="Fast Food">${t('categoryFastFood')}</option>
                                <option value="Biryani">${t('categoryBiryani')}</option>
                                <option value="Parotta &amp; Meals">${t('categoryParottaMeals')}</option>
                                <option value="Grilled &amp; Non-Veg">${t('categoryGrilledNonVeg')}</option>
                                <option value="Juice">${t('categoryJuice')}</option>
                                <option value="Sweet &amp; Beverages">${t('categorySweetBeverages')}</option>
                                <option value="Snacks">${t('categorySnacks')}</option>
                                <option value="Others">${t('categoryOthers')}</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>${t('district')} *</label>
                                <div class="form-custom-select-container" id="signup-district-custom">
                                    <div class="form-custom-select-trigger" id="signup-district-trigger">
                                        <span id="signup-district-text">${t('selectDistrict')}</span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
                                    </div>
                                    <div class="form-custom-select-options" id="signup-district-options"></div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>${t('areaLocation')} *</label>
                                <div class="form-custom-select-container" id="signup-area-custom">
                                    <div class="form-custom-select-trigger" id="signup-area-trigger">
                                        <span id="signup-area-text">${t('selectArea')}</span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
                                    </div>
                                    <div class="form-custom-select-options" id="signup-area-options"></div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>${t('fullAddress')}</label>
                            <textarea id="shop-address" placeholder="${t('addressPlaceholder')}" rows="2"></textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>${t('contactNumber')} *</label>
                                <input type="tel" id="shop-contact" placeholder="9876543210" maxlength="10">
                            </div>
                            <div class="form-group">
                                <label>${t('todaysDiscount')}</label>
                                <input type="text" id="shop-discount" placeholder="${t('discountPlaceholder')}">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>${t('password')} *</label>
                                <div class="password-wrapper">
                                    <input type="password" id="shop-password" placeholder="${t('passwordPlaceholder')}" autocomplete="new-password">
                                    <button class="eye-toggle-btn" type="button" tabindex="-1">
                                        <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>${t('confirmPassword')} *</label>
                                <div class="password-wrapper">
                                    <input type="password" id="shop-password-confirm" placeholder="${t('confirmPasswordPlaceholder')}" autocomplete="new-password">
                                    <button class="eye-toggle-btn" type="button" tabindex="-1">
                                        <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>${t('openingTime')}</label>
                                <div class="time-picker-12h">
                                    <select id="open-hour" class="time-select">${Array.from({length:12},(_,i)=>{const h=i+1;return `<option value="${h}" ${h===9?'selected':''}>  ${h}</option>`;}).join('')}</select>
                                    <span class="time-sep">:</span>
                                    <select id="open-min" class="time-select">${['00','05','10','15','20','25','30','35','40','45','50','55'].map(m=>`<option value="${m}" ${m==='00'?'selected':''}>${m}</option>`).join('')}</select>
                                    <select id="open-ampm" class="time-select time-ampm"><option value="AM" selected>AM</option><option value="PM">PM</option></select>
                                </div>
                                <input type="hidden" id="open-time" value="09:00">
                            </div>
                            <div class="form-group">
                                <label>${t('closingTime')}</label>
                                <div class="time-picker-12h">
                                    <select id="close-hour" class="time-select">${Array.from({length:12},(_,i)=>{const h=i+1;return `<option value="${h}" ${h===10?'selected':''}>  ${h}</option>`;}).join('')}</select>
                                    <span class="time-sep">:</span>
                                    <select id="close-min" class="time-select">${['00','05','10','15','20','25','30','35','40','45','50','55'].map(m=>`<option value="${m}" ${m==='00'?'selected':''}>${m}</option>`).join('')}</select>
                                    <select id="close-ampm" class="time-select time-ampm"><option value="AM">AM</option><option value="PM" selected>PM</option></select>
                                </div>
                                <input type="hidden" id="close-time" value="22:00">
                            </div>
                        </div>


                        <div class="menu-items-section">
                            <h3 class="section-title">${t('menuItems')}</h3>
                            <div class="menu-input-row">
                                <input type="text" id="menu-item-name" placeholder="${t('itemName')}">
                                <input type="tel" id="menu-item-price" placeholder="${t('price')}" inputmode="numeric">
                                <button class="add-menu-btn" id="add-menu-item">+</button>
                            </div>
                            <div class="added-menu-list" id="added-menu-list"></div>
                        </div>

                        <button class="submit-btn" id="submit-shop" style="margin-top: 20px; margin-bottom: 20px;">${t('listMyShop')}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    function renderMenuList() {
        const list = modal.querySelector('#added-menu-list');
        if (menuItems.length === 0) {
            list.innerHTML = `<p style="color:#999;text-align:center;">${t('noItemsAdded')}</p>`;
            return;
        }
        list.innerHTML = menuItems.map((item, index) => `
            <div class="added-menu-item">
                <span>${escapeHTML(item.itemName)} - ₹${item.price}</span>
                <button class="remove-menu-btn" data-index="${index}">×</button>
            </div>
        `).join('');
        list.querySelectorAll('.remove-menu-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                menuItems.splice(parseInt(btn.dataset.index), 1);
                renderMenuList();
            });
        });
    }

    renderMenuList();
    setupPasswordToggles(modal);

    // ── Custom 12-Hour Time Picker Logic ──────────────────────────────────────
    // Converts the three select values (hour / minute / AM-PM) into a 24-hour
    // string stored in the hidden <input id="open-time"> / <input id="close-time">
    // so the form submission still sends the correct 24hr value to the backend.

    function getTime24(prefix) {
        let h = parseInt(modal.querySelector(`#${prefix}-hour`).value);
        const min = modal.querySelector(`#${prefix}-min`).value;
        const ampm = modal.querySelector(`#${prefix}-ampm`).value;
        if (ampm === 'AM' && h === 12) h = 0;          // 12 AM → 00:xx
        if (ampm === 'PM' && h !== 12) h += 12;        // 1-11 PM → 13-23
        return `${String(h).padStart(2, '0')}:${min}`;
    }

    function syncTimePickers() {
        modal.querySelector('#open-time').value  = getTime24('open');
        modal.querySelector('#close-time').value = getTime24('close');
    }

    ['open-hour','open-min','open-ampm','close-hour','close-min','close-ampm']
        .forEach(id => modal.querySelector(`#${id}`).addEventListener('change', syncTimePickers));

    syncTimePickers(); // initialise hidden inputs on load

    // Custom Dropdown Logic for Signup (District & Area)
    let signupSelectedDistrict = '';
    let signupSelectedArea = '';

    const districtTrigger = modal.querySelector('#signup-district-trigger');
    const districtOptions = modal.querySelector('#signup-district-options');
    const districtText = modal.querySelector('#signup-district-text');
    
    const areaTrigger = modal.querySelector('#signup-area-trigger');
    const areaOptions = modal.querySelector('#signup-area-options');
    const areaText = modal.querySelector('#signup-area-text');

    // Populate District Options
    function renderSignupDistrictOptions() {
        districtOptions.innerHTML = Object.keys(tamilNaduDistricts).sort().map(d => `
            <div class="form-custom-option" data-value="${d}">${getDistrictName(d)}</div>
        `).join('');

        districtOptions.querySelectorAll('.form-custom-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                signupSelectedDistrict = opt.dataset.value;
                districtText.textContent = getDistrictName(signupSelectedDistrict);
                districtOptions.classList.remove('active');
                districtTrigger.classList.remove('active');
                
                // Reset and populate Area
                signupSelectedArea = '';
                areaText.textContent = t('selectArea');
                renderSignupAreaOptions();
            });
        });
    }

    function renderSignupAreaOptions() {
        if (!signupSelectedDistrict) {
            areaOptions.innerHTML = `<div class="form-custom-option disabled" style="color:#999;cursor:default;">${t('selectDistrictFirst')}</div>`;
            return;
        }
        const areas = tamilNaduDistricts[signupSelectedDistrict] || [];
        areaOptions.innerHTML = areas.sort().map(a => `
            <div class="form-custom-option" data-value="${a}">${getAreaName(a)}</div>
        `).join('');

        areaOptions.querySelectorAll('.form-custom-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                signupSelectedArea = opt.dataset.value;
                areaText.textContent = getAreaName(signupSelectedArea);
                areaOptions.classList.remove('active');
                areaTrigger.classList.remove('active');
            });
        });
    }

    districtTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = districtOptions.classList.contains('active');
        // Close others
        areaOptions.classList.remove('active');
        areaTrigger.classList.remove('active');
        
        if (isActive) {
            districtOptions.classList.remove('active');
            districtTrigger.classList.remove('active');
        } else {
            districtOptions.classList.add('active');
            districtTrigger.classList.add('active');
        }
    });

    areaTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = areaOptions.classList.contains('active');
        // Close others
        districtOptions.classList.remove('active');
        districtTrigger.classList.remove('active');

        if (isActive) {
            areaOptions.classList.remove('active');
            areaTrigger.classList.remove('active');
        } else {
            areaOptions.classList.add('active');
            areaTrigger.classList.add('active');
        }
    });

    // Close on outside click
    modal.addEventListener('click', () => {
        districtOptions.classList.remove('active');
        districtTrigger.classList.remove('active');
        areaOptions.classList.remove('active');
        areaTrigger.classList.remove('active');
    });

    renderSignupDistrictOptions();
    renderSignupAreaOptions();

    // ✕ Close — hide modal (keep DOM intact so form data is preserved)
    // If user opens "Add Your Shop" again, data will still be there.
    modal.querySelector('#add-shop-close-btn').addEventListener('click', () => {
        console.log('[AddShop] Close button clicked — hiding modal');
        modal.classList.remove('active');
        // Make sure profile nav is highlighted
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const profileNav = document.querySelector('.nav-item[data-page="profile"]');
        if (profileNav) profileNav.classList.add('active');
        // Render profile page (login screen) behind
        currentPage = 'profile';
        renderProfilePage();
    });

    // Add menu item
    modal.querySelector('#add-menu-item').addEventListener('click', () => {
        const name = modal.querySelector('#menu-item-name').value.trim();
        const price = parseInt(modal.querySelector('#menu-item-price').value);
        if (!name || isNaN(price) || price <= 0) {
            showToast(t('fillRequired'), 'error');
            return;
        }
        menuItems.push({ itemName: name, price, available: true });
        modal.querySelector('#menu-item-name').value = '';
        modal.querySelector('#menu-item-price').value = '';
        renderMenuList();
    });

    // Submit shop — POST to /api/stalls/signup
    const submitBtn = modal.querySelector('#submit-shop');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            console.log('[AddShop] Submit button clicked');
            const name = modal.querySelector('#shop-name').value.trim();
            const category = modal.querySelector('#shop-category').value;
            const district = signupSelectedDistrict;
            const area = signupSelectedArea;
            const address = modal.querySelector('#shop-address').value.trim();
            const contact = modal.querySelector('#shop-contact').value.trim();
            const discount = modal.querySelector('#shop-discount').value.trim();
            const openTime = modal.querySelector('#open-time').value;
            const closeTime = modal.querySelector('#close-time').value;
            const password = modal.querySelector('#shop-password').value;
            const confirmPassword = modal.querySelector('#shop-password-confirm').value;

            console.log('[AddShop] Validation check...', { name, category, district, area, contact });

            if (!name || !category || !district || !area || !contact) {
                showToast(t('fillRequired'), 'error');
                return;
            }
            if (contact.length !== 10) {
                showToast('Contact number must be exactly 10 digits', 'error');
                return;
            }
            if (!password || password.length < 4) {
                showToast(t('passwordTooShort'), 'error');
                return;
            }
            if (password !== confirmPassword) {
                showToast(t('passwordsDoNotMatch'), 'error');
                return;
            }
            if (menuItems.length === 0) {
                showToast(t('addMenuItemError'), 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = t('registering');

            try {
                console.log('[AddShop] Sending fetch request...');
                const res = await fetch('/api/stalls/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name, category, area, district,
                        address: address || `${area}, ${district}, Tamil Nadu`,
                        contact, password,
                        open_time: openTime,
                        close_time: closeTime,
                        today_discount: discount || null,
                        menu: menuItems
                    })
                });
                
                let data = {};
                try {
                    const contentType = res.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        data = await res.json();
                    } else {
                        const text = await res.text();
                        console.error('[AddShop] Raw response:', text);
                        data = { error: 'Server error: ' + (text.substring(0, 100)) };
                    }
                } catch (jsonErr) {
                    console.error('[AddShop] JSON parse error:', jsonErr);
                    data = { error: 'Could not parse server response' };
                }

                if (!res.ok) {
                    showToast(data.error || t('registrationFailed'), 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = t('listMyShop');
                    return;
                }

                // Success
                console.log('[AddShop] Registration success!');
                modal.remove();
                showToast(t('shopRegistered'), 'success');
                await loadStalls();
                
                // Go to home and mark Home nav active
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                const homeNav = document.querySelector('.nav-item[data-page="home"]');
                if (homeNav) homeNav.classList.add('active');
                currentPage = 'home';
                renderHomePage();
                
            } catch (e) {
                console.error('[AddShop] Submission error:', e);
                showToast(e.message || t('networkError'), 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = t('listMyShop');
            }
        });
    } else {
        console.error('[AddShop] Submit button not found in modal!');
    }
}

// Close add shop modal if open (called when navigating away is fine — modal persists)
function closeAddShopModal() {
    const modal = document.getElementById('add-shop-modal');
    if (modal) modal.remove();
}
window.closeAddShopModal = closeAddShopModal;




// Render Profile/Vendor Page
function renderProfilePage() {
    const app = document.getElementById('app');

    if (vendorShop) {
        if (vendorShop.id === -99) {
            // Admin Dashboard View
            app.innerHTML = `
                <div class="page admin-dashboard-page" style="padding: 20px; max-width: 800px; margin: 0 auto;">
                    <div class="dashboard-header" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; margin-bottom: 30px; border-bottom: 2px solid #fee2e2; padding-bottom: 15px; gap: 16px;">
                        <div style="flex: 1; min-width: 250px;">
                            <h2 class="section-title" style="margin: 0; color:#dc2626; display:flex; align-items:center; gap:8px;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                ${t('adminConsole')}
                            </h2>
                            <p style="color: #666; margin: 5px 0 0 0; font-size: 0.9rem;">${t('adminConsoleDesc')}</p>
                        </div>
                        <button class="logout-btn" id="logout-btn" style="background:#eee; color:#333; padding:10px 20px; border-radius:12px; font-weight:600; border:none; cursor:pointer; white-space:nowrap;">${t('logout')}</button>
                    </div>

                    <div class="admin-shop-list" style="display: flex; flex-direction: column; gap: 16px;">
                        ${stalls.map(stall => `
                            <div class="admin-shop-card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; border: 1px solid #f0f0f0; gap: 16px;">
                                <div style="flex: 1; min-width: 200px;">
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                        <span style="font-size: 1.5rem;">${categorySVGs[stall.category] || '🏪'}</span>
                                        <h4 style="margin: 0; font-size: 1.15rem; color: #111; font-weight: 700;">${td(stall.name, stall)}</h4>
                                    </div>
                                    <div style="color: #666; font-size: 0.85rem; display: flex; flex-direction: column; gap: 4px;">
                                        <span>📍 ${tDistrict(stall.district)} - ${td(stall.area, stall)}</span>
                                        <span>📞 ${stall.contact || 'Contact admin'}</span>
                                    </div>
                                </div>
                                <button class="submit-btn admin-delete-btn" data-id="${stall.id}" data-name="${stall.name}" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; margin: 0; padding: 10px 18px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; white-space: nowrap; height: fit-content;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                    ${t('deleteShopBtn')}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            // Attach Logout Event
            app.querySelector('#logout-btn').addEventListener('click', () => {
                vendorShop = null;
                localStorage.removeItem('vendorShopId');
                localStorage.removeItem('vendorContact');
                localStorage.removeItem('vendorToken');
                localStorage.removeItem('vendorLoginTime');
                renderProfilePage();
            });

            // Attach Delete Events
            app.querySelectorAll('.admin-delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const stallId = parseInt(btn.dataset.id);
                    const stallObj = stalls.find(s => s.id === stallId);
                    const stallName = stallObj ? stallObj.name : btn.dataset.name;
                    const localizedName = stallObj ? td(stallObj.name, stallObj) : stallName;
                    
                    showCustomConfirm(t('deleteShopConfirm').replace('{name}', localizedName), async () => {
                        btn.disabled = true;
                        btn.textContent = t('deletingShopBtn');
                        try {
                            const res = await fetch(`/api/stalls/${stallId}`, {
                                method: 'DELETE',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('vendorToken')}`
                                }
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                                showToast(t('shopDeletedSuccessfully').replace('{name}', localizedName), 'success');
                                await loadStalls();
                                renderProfilePage();
                            } else {
                                showToast(data.error || t('deletionFailed'), 'error');
                                btn.disabled = false;
                                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> ${t('deleteShopBtn')}`;
                            }
                        } catch (e) {
                            showToast(t('networkError'), 'error');
                            btn.disabled = false;
                            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> ${t('deleteShopBtn')}`;
                        }
                    });
                });
            });
            return;
        }

        // Vendor dashboard
        const openTime12 = formatTime12Hour(vendorShop.openTime);
        const closeTime12 = formatTime12Hour(vendorShop.closeTime);
        const isOpen = vendorShop.status === 'open';

        // Render complete HTML including add menu item section
        app.innerHTML = `
            <div class="page vendor-dashboard-page">
                <div class="dashboard-header">
                    <h2 class="section-title">${t('vendorDashboard')}</h2>
                    <button class="logout-btn" id="logout-btn">${t('logout')}</button>
                </div>

                <div class="vendor-dashboard">
                    <h3 class="dashboard-shop-name">${categorySVGs[vendorShop.category] || ''} ${escapeHTML(td(vendorShop.name, vendorShop))}</h3>
                    <p style="color: #666; margin-bottom: 20px;">${escapeHTML(td(vendorShop.area, vendorShop))}</p>
                    <p style="font-size: 0.85rem; color: #888; margin-bottom: 15px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${openTime12} - ${closeTime12}</p>

                    <div class="status-control-card">
                        <div class="status-label-group">
                            <h4 class="status-main-label">${t('shopStatus')}</h4>
                            <span class="status-sub-label">${getShopStatusInfo(vendorShop).label}</span>
                        </div>
                        <div class="status-modes">
                            <button class="mode-btn ${vendorShop.status === 'auto' ? 'active' : ''}" data-mode="auto">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span>${t('statusAuto')}</span>
                            </button>
                            <button class="mode-btn ${vendorShop.status === 'open' ? 'active' : ''}" data-mode="open">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                <span>${t('statusOpen')}</span>
                            </button>
                            <button class="mode-btn ${vendorShop.status === 'closed' ? 'active' : ''}" data-mode="closed">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                <span>${t('statusClosed')}</span>
                            </button>
                            <button class="mode-btn ${vendorShop.status === 'leave' ? 'active' : ''}" data-mode="leave">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
                                <span>${t('statusLeave')}</span>
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>${t('todaysDiscount')}</label>
                        <input type="text" id="vendor-discount" value="${vendorShop.todayDiscount || ''}" placeholder="${t('discountPlaceholder')}">
                        <button class="submit-btn" id="update-discount" style="margin-top: 10px;">${t('updateDiscount')}</button>
                    </div>

                    <h3 class="section-title" style="margin-top: 20px;">${t('menuAvailability')}</h3>
                    <div class="menu-list" id="vendor-menu-list">
                        <!-- Menu items rendered here -->
                    </div>

                    <!-- Add New Menu Item Section -->
                    <div class="form-section" style="margin-top: 20px;">
                        <h3 class="section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M5 12h14"/><path d="M12 5v14"/></svg> ${t('addNewMenuItem')}</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${t('itemName')}</label>
                                <input type="text" id="new-item-name" placeholder="${t('itemNamePlaceholder')}">
                            </div>
                            <div class="form-group">
                                <label>${t('price')}</label>
                                <input type="tel" id="new-item-price" placeholder="₹ 50" inputmode="numeric">
                            </div>
                        </div>
                        <button class="submit-btn" id="add-new-item-btn" style="background: #28a745; margin-top: 10px;">${t('addItemToMenu')}</button>
                    </div>

                    <!-- Delete Account Section -->
                    <div class="form-section" style="margin-top: 30px; border-top: 2px solid #fee2e2; padding-top: 20px;">
                        <h3 class="section-title" style="color:#dc2626;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> ${t('dangerZone')}</h3>
                        <p style="color:#666; font-size:0.85rem; margin-bottom:12px;">${t('deleteShopDesc')}</p>
                        <button class="submit-btn" id="delete-shop-btn" style="background:#dc2626; margin-top:0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> ${t('deleteShop')}</button>
                    </div>
                </div>
            </div>
        `;

        // Status mode selection — API call
        app.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const newStatus = btn.dataset.mode;
                if (vendorShop.status === newStatus) return;

                const token = localStorage.getItem('vendorToken');
                try {
                    const res = await fetch(`/api/stalls/${vendorShop.id}/status`, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: newStatus })
                    });
                    const data = await res.json();
                    vendorShop.status = newStatus;
                    await reloadStalls();
                    renderProfilePage();
                    
                    let toastMsg = t('updateFailed');
                    if (newStatus === 'auto') toastMsg = t('shopNowAuto');
                    else if (newStatus === 'open') toastMsg = t('shopNowOpen');
                    else if (newStatus === 'closed') toastMsg = t('shopNowClosed');
                    else if (newStatus === 'leave') toastMsg = t('shopNowLeave');
                    
                    showToast(toastMsg, 'success');
                } catch (e) { showToast(t('updateFailed'), 'error'); }
            });
        });

        // Discount update — API call
        const discountInput = app.querySelector('#vendor-discount');
        const updateDiscountBtn = app.querySelector('#update-discount');

        const updateDiscount = async () => {
            const discount = app.querySelector('#vendor-discount').value.trim();
            const token = localStorage.getItem('vendorToken');
            try {
                await fetch(`/api/stalls/${vendorShop.id}/discount`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ discount: discount || null })
                });
                vendorShop.todayDiscount = discount || null;
                showToast(t('offerUpdated'), 'success');
            } catch (e) { showToast(t('updateFailed'), 'error'); }
        };

        updateDiscountBtn.addEventListener('click', updateDiscount);
        discountInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') updateDiscount(); });

        // Issue #20: renderVendorMenuList is now a module-level function (defined below
        // renderProfilePage). Calling it here re-renders the menu into #vendor-menu-list.
        renderVendorMenuList();

        // Logout
        app.querySelector('#logout-btn').addEventListener('click', () => {
            vendorShop = null;
            localStorage.removeItem('vendorShopId');
            localStorage.removeItem('vendorContact');
            localStorage.removeItem('vendorToken');
            localStorage.removeItem('vendorLoginTime');
            sessionStorage.removeItem('vendorSessionPassword');
            renderProfilePage();
            showToast(t('loggedOut'), 'success');
        });

        // Add new menu item — Fixed implementation following 9-step requirement
        const addNewItemBtn = app.querySelector('#add-new-item-btn');
        addNewItemBtn.addEventListener('click', async () => {
            const nameInput = app.querySelector('#new-item-name');
            const priceInput = app.querySelector('#new-item-price');
            const itemName = nameInput.value.trim();
            const price = parseInt(priceInput.value);
            
            // Step 2: Validate item name and price
            app.querySelectorAll('.error-msg').forEach(el => el.remove());
            let hasError = false;
            
            if (!itemName) {
                const err = document.createElement('div');
                err.className = 'error-msg';
                err.textContent = 'Item name is required';
                nameInput.parentNode.appendChild(err);
                hasError = true;
            }
            if (isNaN(price) || price <= 0) {
                const err = document.createElement('div');
                err.className = 'error-msg';
                err.textContent = 'Please enter a valid price';
                priceInput.parentNode.appendChild(err);
                hasError = true;
            }
            if (hasError) return;

            addNewItemBtn.disabled = true;
            addNewItemBtn.textContent = t('adding');

            const token = localStorage.getItem('vendorToken');
            try {
                // Step 3: Send POST request to backend
                const res = await fetch(`/api/stalls/${vendorShop.id}/menu-item`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        itemName, price, available: true
                    })
                });
                
                if (!res.ok) throw new Error('API Error');
                
                const updated = await res.json();
                updateVendorShop(updated);

                // Step 5: Directly add to screen with animation (Optimistic/Direct DOM)
                const listContainer = app.querySelector('#vendor-menu-list');
                const newItem = vendorShop.menu[vendorShop.menu.length - 1];
                
                const itemEl = document.createElement('div');
                itemEl.className = 'menu-item new-item'; // Step 6: Smooth fade-in
                itemEl.dataset.id = newItem.id;
                itemEl.innerHTML = `
                    <div class="menu-item-info">
                        <div class="menu-item-name">${escapeHTML(td(newItem.itemName, newItem))}</div>
                        <div class="menu-item-price">₹${newItem.price}</div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <button class="availability-toggle available" data-id="${newItem.id}">${t('on')}</button>
                        <button class="remove-item-btn" data-id="${newItem.id}" title="${t('removeItem')}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    </div>
                `;
                listContainer.appendChild(itemEl);
                
                // Re-attach listeners just for this new element or refresh list logic
                // For simplicity and correctness, we refresh the list after a tiny delay
                // but the element is already there instantly.
                setTimeout(() => renderVendorMenuList(), 1000); 

                // Step 7: Clear inputs
                nameInput.value = '';
                priceInput.value = '';
                
                // Step 8: Show green toast
                const toast = document.createElement('div');
                toast.className = 'toast';
                toast.textContent = t('itemAdded');
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);

                loadStalls(); // Background sync
            } catch (e) { 
                // Step 9: Show red error toast, don't clear inputs
                const toast = document.createElement('div');
                toast.className = 'toast error';
                toast.textContent = t('updateFailed');
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            } finally {
                addNewItemBtn.disabled = false;
                addNewItemBtn.textContent = t('addItemToMenu');
            }
        });

        // Delete My Shop
        app.querySelector('#delete-shop-btn').addEventListener('click', async (e) => {
            const btn = e.target;
            if (btn.disabled) return;
            
            showCustomConfirm(`${t('deleteConfirmTitle').replace('{name}', vendorShop.name)}\n\n${t('deleteConfirmDesc')}`, () => {
                showDeleteAuthModal(async (enteredContact, enteredPwd) => {
                    performDelete(enteredContact, enteredPwd, btn);
                });
            });
        });



    } else {
        // Login form — check for persistent login via API
        const savedShopId = localStorage.getItem('vendorShopId');
        const loginTime = localStorage.getItem('vendorLoginTime');
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (loginTime && Date.now() - loginTime > sevenDays) {
            localStorage.removeItem('vendorShopId');
            localStorage.removeItem('vendorContact');
            localStorage.removeItem('vendorToken');
            localStorage.removeItem('vendorLoginTime');
        }
        const savedContact = localStorage.getItem('vendorContact');
        const savedToken = localStorage.getItem('vendorToken');

        if (savedShopId) {
            const isAdmin = savedShopId === '-99';
            
            if (!isAdmin && !savedToken) {
                // If normal vendor is auto-logging in, but does not have token,
                // do not auto-login (which would cause all dashboard actions to fail authentication).
                // Instead, clear the savedShopId to show the login form directly.
                localStorage.removeItem('vendorShopId');
                localStorage.removeItem('vendorContact');
                localStorage.removeItem('vendorLoginTime');
            } else {
                // Show a loading placeholder immediately so the page visibly changes
                app.innerHTML = `
                    <div class="page vendor-login-page" style="display:flex;align-items:center;justify-content:center;min-height:60vh;">
                        <div style="text-align:center;">
                            <div class="spinner" style="margin:0 auto 16px;"></div>
                            <p style="color:#888;">${t('loggingIn')}</p>
                        </div>
                    </div>
                `;
                // Re-fetch from API to get fresh data
                if (savedShopId === '-99') {
                    vendorShop = {
                        id: -99,
                        name: 'StreetBite Administrator',
                        category: 'admin',
                        contact: savedContact,
                        area: 'All Districts',
                        district: 'Tamil Nadu',
                        menu: [],
                        status: 'open',
                        openTime: '00:00',
                        closeTime: '23:59',
                        _sessionPwd: '' // Admin uses token-based auth; no stored password needed
                    };
                    renderProfilePage();
                    return;
                }

                fetch(`/api/stalls/${savedShopId}`, {
                    headers: { 'Authorization': `Bearer ${savedToken}` }
                })
                    .then(r => r.json())
                    .then(shop => {
                        if (shop && shop.id) {
                            updateVendorShop(shop);
                            // Re-attach contact from localStorage so delete/actions work
                            if (savedContact) vendorShop.contact = savedContact;
                            
                            // Ensure it is transliterated for the dashboard
                            translateSingleStall(vendorShop, currentLanguage).then(() => {
                                renderProfilePage();
                            });
                        } else {
                            // Saved ID no longer valid — show login form
                            localStorage.removeItem('vendorShopId');
                            renderProfilePage();
                        }
                    })
                    .catch(() => {
                        // Network error — still show login form
                        localStorage.removeItem('vendorShopId');
                        renderProfilePage();
                    });
                return;
            }
        }

        app.innerHTML = `
            <div class="page vendor-login-page">
                <h2 class="section-title">${t('vendorLogin')}</h2>
                <p style="color: #666; margin-bottom: 20px;">${t('vendorLoginSub')}</p>

                <div class="form-section">
                    <div class="form-group">
                        <label>${t('language')}</label>
                        <select id="language-select" onchange="changeLanguage(this.value)">
                            <option value="en" ${currentLanguage === 'en' ? 'selected' : ''}>${t('english')}</option>
                            <option value="ta" ${currentLanguage === 'ta' ? 'selected' : ''}>${t('tamil')}</option>
                            <option value="hi" ${currentLanguage === 'hi' ? 'selected' : ''}>${t('hindi')}</option>
                        </select>
                    </div>

                    <div class="vendor-login-form">
                        <div class="form-group">
                            <label>${t('contactNumberLabel')}</label>
                            <input type="tel" id="vendor-contact" placeholder="${t('contactPlaceholder')}" inputmode="numeric" maxlength="10">
                        </div>

                        <div class="form-group">
                            <label>${t('password')}</label>
                            <div class="password-wrapper">
                                <input type="password" id="vendor-password" placeholder="${t('vendorPasswordPlaceholder')}" autocomplete="current-password">
                                <button class="eye-toggle-btn" type="button" tabindex="-1">
                                    <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                </button>
                            </div>
                        </div>

                        <button class="submit-btn" id="vendor-login-btn">${t('login')}</button>
                    </div>

                    <div style="text-align: center; margin-top: 30px; color: #666;">
                        <p>${t('noShopListed')}</p>
                        <button class="add-shop-from-profile-btn" id="add-shop-from-profile">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M5 12h14"/><path d="M12 5v14"/></svg> ${t('addYourShop')}
                        </button>
                    </div>
                </div>
            </div>
        `;

        setupPasswordToggles(app);

        // "Add Your Shop" button
        app.querySelector('#add-shop-from-profile').addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            const profileNav = document.querySelector('.nav-item[data-page="profile"]');
            if (profileNav) profileNav.classList.add('active');
            renderAddShopPage();
        });

        // Login — mobile number + password only, no shop selection
        app.querySelector('#vendor-login-btn').addEventListener('click', async () => {
            const contact = app.querySelector('#vendor-contact').value.trim();
            const password = app.querySelector('#vendor-password').value;

            if (!contact) {
                showToast(currentLanguage === 'ta' ? 'மொபைல் எண்ணை உள்ளிடுக' : currentLanguage === 'hi' ? 'मोबाइल नंबर डालें' : 'Please enter your mobile number', 'error');
                app.querySelector('#vendor-contact').focus();
                return;
            }
            if (!password) {
                showToast(currentLanguage === 'ta' ? 'கடவுச்சொல்லை உள்ளிடுக' : currentLanguage === 'hi' ? 'पासवर्ड डालें' : 'Please enter your password', 'error');
                app.querySelector('#vendor-password').focus();
                return;
            }

            const loginBtn = app.querySelector('#vendor-login-btn');
            loginBtn.disabled = true;
            loginBtn.textContent = t('loggingIn');

            try {
                const res = await fetch('/api/vendor-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contact, password })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    localStorage.setItem('vendorToken', data.token);
                    updateVendorShop(data.stall);
                    localStorage.setItem('vendorShopId', vendorShop.id);
                    localStorage.setItem('vendorLoginTime', Date.now());
                    localStorage.setItem('vendorContact', contact);
                    
                    // Ensure it is transliterated for the dashboard
                    await translateSingleStall(vendorShop, currentLanguage);
                    
                    renderProfilePage();
                    showToast(`${t('welcomeVendor')}, ${td(vendorShop.name, vendorShop)}!`, 'success');
                } else {
                    showToast(data.error || t('invalidCredentials'), 'error');
                    loginBtn.disabled = false;
                    loginBtn.textContent = t('login');
                }
            } catch (e) {
                showToast(t('networkError'), 'error');
                loginBtn.disabled = false;
                loginBtn.textContent = t('login');
            }
        });

        // Allow pressing Enter on password field to submit
        app.querySelector('#vendor-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') app.querySelector('#vendor-login-btn').click();
        });
        // Issue #17: initPasswordToggles is now an alias for setupPasswordToggles
        setupPasswordToggles(app);
    }
}

// ── Issue #20: renderVendorMenuList extracted to module scope ─────────────────
// Previously defined as an inner function of renderProfilePage(), which meant it
// was re-created on every call, leaking closures. Now it's a single top-level
// function that closes over the module-level `vendorShop` variable.
function renderVendorMenuList() {
    const listContainer = document.querySelector('#vendor-menu-list');
    if (!listContainer || !vendorShop) return;

    listContainer.innerHTML = vendorShop.menu.map(item => `
        <div class="menu-item" data-id="${item.id}">
            <div class="menu-item-info">
                <div class="menu-item-name">${escapeHTML(td(item.itemName, item))}</div>
                <div class="menu-item-price">&#x20b9;${item.price}</div>
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
                <button class="availability-toggle ${item.available ? 'available' : 'unavailable'}" data-id="${item.id}">${item.available ? t('on') : t('off')}</button>
                <button class="remove-item-btn" data-id="${item.id}" title="${t('removeItem')}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            </div>
        </div>
    `).join('');

    // Availability toggle
    listContainer.querySelectorAll('.availability-toggle').forEach(toggle => {
        toggle.addEventListener('click', async () => {
            const itemId = parseInt(toggle.dataset.id);
            const item = vendorShop.menu.find(m => m.id === itemId);
            if (!item) return;
            const newAvailable = !item.available;
            const token = localStorage.getItem('vendorToken');
            try {
                const res = await fetch(`/api/stalls/${vendorShop.id}/menu-item`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ item_id: itemId, available: newAvailable })
                });
                const updated = await res.json();
                updateVendorShop(updated);
                renderVendorMenuList();
                showToast(t('itemNowStatus')
                    .replace('{item}', td(item.itemName, item))
                    .replace('{status}', newAvailable ? t('available') : t('unavailable')), 'success');
                loadStalls();
            } catch (e) { showToast(t('updateFailed'), 'error'); }
        });
    });

    // Remove item
    listContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const itemId = parseInt(btn.dataset.id);
            const token = localStorage.getItem('vendorToken');
            try {
                const res = await fetch(`/api/stalls/${vendorShop.id}/menu-item?item_id=${itemId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ item_id: itemId })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || t('failedToRemoveItem'));
                updateVendorShop(data);
                renderVendorMenuList();
                showToast(t('itemRemoved'), 'success');
                loadStalls();
            } catch (e) {
                showToast(e.message || t('failedToRemoveItem'), 'error');
            }
        });
    });
}

// Toast notification
function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Global numeric input enforcer
document.addEventListener('input', (e) => {
    if (e.target.type === 'tel' || e.target.id === 'new-item-price' || e.target.id === 'menu-item-price') {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }
});

// Custom translation-friendly Confirm
function showCustomConfirm(msg, onOk) {
    const overlay = document.createElement('div');
    overlay.className = 'location-overlay active';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:2000; opacity:1; pointer-events:auto;';
    overlay.innerHTML = `
        <div style="background:white; width:90%; max-width:380px; padding:30px; border-radius:28px; box-shadow:0 20px 50px rgba(0,0,0,0.3); transform:translateY(0); animation:modalSlideUp 0.3s ease-out;">
            <h3 class="section-title" style="margin-top:0; color:#dc2626; justify-content:center;">${t('dangerZone')}</h3>
            <p style="margin-bottom:24px; line-height:1.6; color:#444; text-align:center;">${escapeHTML(msg).replace(/\n/g, '<br>')}</p>
            <div style="display:flex; gap:12px;">
                <button class="submit-btn" style="background:#eee; color:#333; margin:0; flex:1;" id="modal-cancel">${t('cancel')}</button>
                <button class="submit-btn" style="background:#dc2626; margin:0; flex:1;" id="modal-ok">${t('ok')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#modal-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#modal-ok').onclick = () => { overlay.remove(); onOk(); };
}

// Custom translation-friendly Prompt
function showCustomPrompt(msg, onOk) {
    const overlay = document.createElement('div');
    overlay.className = 'location-overlay active';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:2000; opacity:1; pointer-events:auto;';
    overlay.innerHTML = `
        <div style="background:white; width:90%; max-width:380px; padding:30px; border-radius:28px; box-shadow:0 20px 50px rgba(0,0,0,0.3); transform:translateY(0); animation:modalSlideUp 0.3s ease-out;">
            <h3 class="section-title" style="margin-top:0; color:#dc2626; justify-content:center;">${t('confirmPassword')}</h3>
            <p style="margin-bottom:16px; line-height:1.6; color:#444; text-align:center;">${msg}</p>
            <div class="password-wrapper" style="margin-bottom:20px;">
                <input type="password" id="modal-pwd" class="search-input" style="text-align:center;" placeholder="${t('passwordPlaceholder')}">
                <button class="eye-toggle-btn" type="button" tabindex="-1">
                    <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                </button>
            </div>
            <div style="display:flex; gap:12px;">
                <button class="submit-btn" style="background:#eee; color:#333; margin:0; flex:1;" id="modal-cancel">${t('cancel')}</button>
                <button class="submit-btn" style="background:#dc2626; margin:0; flex:1;" id="modal-ok">${t('ok')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('#modal-pwd');
    input.focus();
    overlay.querySelector('#modal-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#modal-ok').onclick = () => { if(input.value) { overlay.remove(); onOk(input.value); } };
}

async function performDelete(contact, pwd, btn) {
    btn.disabled = true;
    btn.textContent = t('deleting');
    const token = localStorage.getItem('vendorToken');
    try {
        const res = await fetch(`/api/stalls/${vendorShop.id}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ contact, password: pwd })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            vendorShop = null;
            localStorage.removeItem('vendorShopId');
            localStorage.removeItem('vendorContact');
            localStorage.removeItem('vendorToken');
            localStorage.removeItem('vendorLoginTime');
            await loadStalls();
            renderProfilePage();
            showToast(t('shopDeleted'), 'success');
        } else {
            showToast(data.error || t('deletionFailed'), 'error');
            btn.disabled = false;
            btn.textContent = t('deleteShop');
        }
    } catch (e) {
        showToast(t('networkError'), 'error');
        btn.disabled = false;
        btn.textContent = t('deleteShop');
    }
}

// Custom Delete Authentication Modal
function showDeleteAuthModal(onOk) {
    const overlay = document.createElement('div');
    overlay.className = 'location-overlay active';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:2000; opacity:1; pointer-events:auto;';
    overlay.innerHTML = `
        <div style="background:white; width:95%; max-width:400px; padding:30px; border-radius:28px; box-shadow:0 20px 50px rgba(0,0,0,0.3); transform:translateY(0); animation:modalSlideUp 0.3s ease-out;">
            <h3 class="section-title" style="margin-top:0; color:#dc2626; justify-content:center;">${t('authRequiredTitle')}</h3>
            <p style="margin-bottom:20px; line-height:1.6; color:#666; text-align:center; font-size:0.9rem;">${t('authRequiredDesc')}</p>
            
            <div class="form-group" style="margin-bottom:15px;">
                <label style="font-size:0.85rem; color:#444; font-weight:600;">${t('confirmMobileNumber')}</label>
                <input type="tel" id="modal-contact" class="search-input" placeholder="${t('mobileNumberPlaceholder')}" maxlength="10" inputmode="numeric">
            </div>

            <div class="form-group" style="margin-bottom:25px;">
                <label style="font-size:0.85rem; color:#444; font-weight:600;">${t('confirmPassword')}</label>
                <div class="password-wrapper">
                    <input type="password" id="modal-pwd" class="search-input" placeholder="${t('passwordPlaceholder')}">
                    <button class="eye-toggle-btn" type="button" tabindex="-1">
                        <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    </button>
                </div>
            </div>

            <div style="display:flex; gap:12px;">
                <button class="submit-btn" style="background:#eee; color:#333; margin:0; flex:1;" id="modal-cancel">${t('cancel')}</button>
                <button class="submit-btn" style="background:#dc2626; margin:0; flex:1;" id="modal-ok">${t('deleteShop')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    const contactInput = overlay.querySelector('#modal-contact');
    const pwdInput = overlay.querySelector('#modal-pwd');
    
    // Password eye toggle logic
    const eyeBtn = overlay.querySelector('.eye-toggle-btn');
    eyeBtn.onclick = () => {
        const type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
        pwdInput.setAttribute('type', type);
        eyeBtn.classList.toggle('active');
    };

    overlay.querySelector('#modal-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#modal-ok').onclick = () => {
        if (contactInput.value.length === 10 && pwdInput.value) {
            overlay.remove();
            onOk(contactInput.value, pwdInput.value);
        } else {
            showToast(t('pleaseEnterDetails'), 'error');
        }
    };
}
// Issue #17: initPasswordToggles() was a duplicate of setupPasswordToggles() with
// a broken data-target approach. Removed. setupPasswordToggles(container) is the
// single unified function — it finds inputs by proximity inside .password-wrapper.
// Kept as a no-op alias so any lingering call sites don't throw errors.
function initPasswordToggles(container) {
    // Delegate to the unified function — Issue #17 fix
    setupPasswordToggles(container || document);
}
window.initPasswordToggles = initPasswordToggles;

// Make navigateTo available globally
window.navigateTo = navigateTo;


// ===== Location Picker Functions =====

function updateLocationButtonText() {
    const btnText = document.getElementById('location-trigger-text');
    if (!btnText) return;
    if (selectedArea && selectedArea !== 'All Areas') {
        btnText.textContent = getAreaName(selectedArea);
    } else if (selectedDistrict) {
        btnText.textContent = getDistrictName(selectedDistrict);
    } else {
        btnText.textContent = t('selectLocation');
    }
}

function openLocationPicker() {
    const overlay = document.getElementById('location-overlay');
    const sheet = document.getElementById('location-sheet');
    const searchInput = document.getElementById('sheet-search-input');

    overlay.classList.add('active');
    sheet.classList.add('active');
    document.getElementById('location-trigger').classList.add('active');

    // If a district is already selected, show areas step
    if (selectedDistrict && tamilNaduDistricts[selectedDistrict]) {
        locationStep = 'area';
        renderAreaList(selectedDistrict);
    } else {
        locationStep = 'district';
        renderDistrictList();
    }

    searchInput.value = '';
    // Do NOT auto-focus — prevents unwanted keyboard popup on mobile
}

function closeLocationPicker() {
    const overlay = document.getElementById('location-overlay');
    const sheet = document.getElementById('location-sheet');

    overlay.classList.remove('active');
    sheet.classList.remove('active');
    document.getElementById('location-trigger').classList.remove('active');
}

function renderDistrictList() {
    locationStep = 'district';
    const list = document.getElementById('sheet-list');
    const backBtn = document.getElementById('sheet-back-btn');
    const title = document.getElementById('sheet-title');
    const searchInput = document.getElementById('sheet-search-input');

    backBtn.style.display = 'none';
    title.textContent = t('selectDistrict');
    searchInput.placeholder = t('searchDistrict');
    searchInput.value = '';

    const districts = Object.keys(tamilNaduDistricts);
    list.innerHTML = districts.map(district => `
        <div class="location-item ${selectedDistrict === district ? 'selected' : ''}" onclick="selectDistrictItem('${district}')">
            <div class="location-item-left">
                <div>
                    <div class="location-item-name">${getDistrictName(district)}</div>
                    ${currentLanguage !== 'en' ? `<div class="location-item-sub">${district}</div>` : ''}
                </div>
            </div>
            <span class="location-item-arrow">→</span>
        </div>
    `).join('');
}

function selectDistrictItem(district) {
    selectedDistrict = district;
    localStorage.setItem('streetbite_district', district);
    selectedArea = null;
    localStorage.removeItem('streetbite_area');

    updateHeaderLocationBar();
    locationStep = 'area';
    renderAreaList(district);
}

function renderAreaList(district) {
    locationStep = 'area';
    const list = document.getElementById('sheet-list');
    const backBtn = document.getElementById('sheet-back-btn');
    const title = document.getElementById('sheet-title');
    const searchInput = document.getElementById('sheet-search-input');

    backBtn.style.display = 'flex';
    title.textContent = `${t('selectArea')} ${getDistrictName(district)}`;
    searchInput.placeholder = t('searchArea');
    searchInput.value = '';

    const areas = tamilNaduDistricts[district] || [];

    // Add "All Areas" option first
    let itemsHTML = `
        <div class="location-item ${selectedArea === 'All Areas' || !selectedArea ? 'selected' : ''}" onclick="selectAreaItem('All Areas')">
            <div class="location-item-left">
                <span class="location-item-name">${t('allAreas')}</span>
            </div>
            <span class="location-item-arrow">✓</span>
        </div>
    `;

    itemsHTML += areas.map(area => `
        <div class="location-item ${selectedArea === area ? 'selected' : ''}" onclick="selectAreaItem('${area.replace(/'/g, "\\'")}')">
            <div class="location-item-left">
                <div>
                    <div class="location-item-name">${getAreaName(area)}</div>
                    ${currentLanguage !== 'en' && getAreaName(area) !== area ? `<div class="location-item-sub">${area}</div>` : ''}
                </div>
            </div>
            <span class="location-item-arrow">${selectedArea === area ? '✓' : '→'}</span>
        </div>
    `).join('');

    list.innerHTML = itemsHTML;
}

function selectAreaItem(area) {
    selectedArea = area;
    localStorage.setItem('streetbite_area', area);

    closeLocationPicker();
    updateLocationButtonText();
    updateHeaderLocationBar();

    // Re-render current page with location filter
    if (currentPage === 'home') {
        renderHomePage();
    } else if (currentPage === 'search') {
        renderSearchPage();
    }

    const displayName = area === 'All Areas'
        ? getDistrictName(selectedDistrict)
        : `${getAreaName(area)}, ${getDistrictName(selectedDistrict)}`;
    showToast(`${displayName}`, 'success');
}

function goBackToDistricts() {
    renderDistrictList();
}

function filterLocationList() {
    const searchInput = document.getElementById('sheet-search-input');
    const query = searchInput.value.toLowerCase().trim();
    const list = document.getElementById('sheet-list');

    if (locationStep === 'district') {
        // Search in both English and localized names
        const districts = Object.keys(tamilNaduDistricts).filter(d =>
            d.toLowerCase().includes(query) ||
            getDistrictName(d).toLowerCase().includes(query)
        );
        list.innerHTML = districts.map(district => `
            <div class="location-item ${selectedDistrict === district ? 'selected' : ''}" onclick="selectDistrictItem('${district}')">
                <div class="location-item-left">
                    <div>
                        <div class="location-item-name">${getDistrictName(district)}</div>
                        ${currentLanguage !== 'en' ? `<div class="location-item-sub">${district}</div>` : ''}
                    </div>
                </div>
                <span class="location-item-arrow">→</span>
            </div>
        `).join('');

        if (districts.length === 0) {
            list.innerHTML = `<div class="empty-state"><p>${t('noShopsFound')}</p></div>`;
        }
    } else if (locationStep === 'area' && selectedDistrict) {
        // Search in both English and localized area names
        const areas = (tamilNaduDistricts[selectedDistrict] || []).filter(a =>
            a.toLowerCase().includes(query) ||
            getAreaName(a).toLowerCase().includes(query)
        );

        let itemsHTML = '';
        if (!query || t('allAreas').toLowerCase().includes(query)) {
            itemsHTML += `
                <div class="location-item ${selectedArea === 'All Areas' || !selectedArea ? 'selected' : ''}" onclick="selectAreaItem('All Areas')">
                    <div class="location-item-left">
                        <span class="location-item-name">${t('allAreas')}</span>
                    </div>
                    <span class="location-item-arrow">✓</span>
                </div>
            `;
        }

        itemsHTML += areas.map(area => `
            <div class="location-item ${selectedArea === area ? 'selected' : ''}" onclick="selectAreaItem('${area.replace(/'/g, "\\'")}')">
                <div class="location-item-left">
                    <div>
                        <div class="location-item-name">${getAreaName(area)}</div>
                        ${currentLanguage !== 'en' && getAreaName(area) !== area ? `<div class="location-item-sub">${area}</div>` : ''}
                    </div>
                </div>
                <span class="location-item-arrow">${selectedArea === area ? '✓' : '→'}</span>
            </div>
        `).join('');

        list.innerHTML = itemsHTML;

        if (areas.length === 0 && !(!query || t('allAreas').toLowerCase().includes(query))) {
            list.innerHTML = `<div class="empty-state"><p>${t('noShopsFound')}</p></div>`;
        }
    }
}

// Password Visibility Toggle Logic
function setupPasswordToggles(container) {
    const wrappers = container.querySelectorAll('.password-wrapper');
    wrappers.forEach(wrapper => {
        const input = wrapper.querySelector('input');
        const btn = wrapper.querySelector('.eye-toggle-btn');
        if (!input || !btn) return;
        
        // Prevent double binding
        if (btn.dataset.initialized) return;
        btn.dataset.initialized = 'true';

        // Use the standard 'eye' icon as the toggler
        const eyeIconHTML = `
            <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
        btn.innerHTML = eyeIconHTML;

        // Only show button if input is not empty
        input.addEventListener('input', () => {
            if (input.value.length > 0) {
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
            }
        });

        // Initial check for pre-filled values
        if (input.value.length > 0) {
            btn.style.display = 'block';
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            
            // Note: Keeping the same icon for both states as per previous "one icon" request.
        });
    });
}

// Expose location functions globally
window.openLocationPicker = openLocationPicker;
window.closeLocationPicker = closeLocationPicker;
window.selectDistrictItem = selectDistrictItem;
window.selectAreaItem = selectAreaItem;
window.filterLocationList = filterLocationList;