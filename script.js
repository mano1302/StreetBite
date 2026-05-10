// State
let stalls = [];
let currentPage = 'home';
let selectedCategory = 'All';
let searchQuery = '';
let vendorShop = null;
let currentLanguage = 'en';

// Location state
let selectedDistrict = localStorage.getItem('streetbite_district') || null;
let selectedArea = localStorage.getItem('streetbite_area') || null;
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
    'Erode': ['Erode','Bhavani','Gobichettipalayam','Sathyamangalam','Perundurai','Kangayam','Anthiyur','Nambiyur'],
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
    'Virudhunagar': ['Virudhunagar','Sivakasi','Srivilliputhur','Rajapalayam','Aruppukkottai','Sattur','Tiruchuli','Watrap']
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
    'Viluppuram':'விழுப்புரம்','Virudhunagar':'விருதுநகர்'
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
    'Viluppuram':'विल्लुपुरम','Virudhunagar':'विरुधुनगर'
};

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
        'T Nagar':'டி நகர்','Anna Nagar':'அண்ணா நகர்','Adyar':'அடையாறு',
        'Mylapore':'மயிலாப்பூர்','Velachery':'வேளச்சேரி','Porur':'பொரூர்',
        'Guindy':'கீண்டி','Nungambakkam':'நுங்கம்பாக்கம்','Egmore':'எழும்பூர்',
        'Tambaram':'தாம்பரம்','Chromepet':'குரோம்பேட்டை','Kodambakkam':'கோடம்பாக்கம்',
        'Vadapalani':'வடபழனி','Ashok Nagar':'அசோக் நகர்','Thiruvanmiyur':'திருவான்மியூர்',
        'Besant Nagar':'பெசன்ட் நகர்','Royapettah':'ராயப்பேட்டை','Triplicane':'திருவல்லிக்கேணி',
        'Perambur':'பெரம்பூர்','Tondiarpet':'தொண்டியார்பேட்டை','Sowcarpet':'சாவுக்கார்பேட்டை',
        'Kilpauk':'கிளம்பாக்கம்','Chetpet':'செட்பேட்','Saidapet':'சைதாப்பேட்டை',
        'Medavakkam':'மேடவாக்கம்','Gandhipuram':'காந்திபுரம்','RS Puram':'ஆர்எஸ் புரம்',
        'Saibaba Colony':'சாய்பாபா காலனி','Peelamedu':'பீலமேடு','Singanallur':'சிங்காநல்லூர்',
        'Ukkadam':'உக்கடம்','Town Hall':'டவுன் ஹால்','Sulur':'சூலூர்',
        'Pollachi':'பொள்ளாச்சி','Mettupalayam':'மேட்டுப்பாளையம்','Valparai':'வால்பாறை',
        'Madurai North':'மதுரை வடக்கு','Madurai South':'மதுரை தெற்கு',
        'Trichy Town':'திருச்சி நகர்','Srirangam':'ஸ்ரீரங்கம்',
        'Salem Town':'சேலம் நகர்','Ooty':'உதகமண்டலம்','Coonoor':'கூனூர்',
        'Tirunelveli Town':'திருநெல்வேலி நகர்','Palayamkottai':'பாளையங்கோட்டை',
        'Nagercoil':'நாகர்கோவில்','Kanyakumari':'கன்னியாகுமரி',
        'Vellore Town':'வேலூர் நகர்','Katpadi':'காட்பாடி',
        'Hosur':'ஹோசூர்','Kumbakonam':'கும்பகோணம்','Thanjavur':'தஞ்சாவூர்',
        'Karaikudi':'காரைக்குடி','Sivakasi':'சிவகாசி','Rajapalayam':'இராஜபாளையம்',
        'Avadi':'அவடி','Poonamallee':'பூனமல்லி','Ambattur':'அம்பத்தூர்'
    },
    hi: {
        'T Nagar':'टी नगर','Anna Nagar':'अन्ना नगर','Adyar':'अड्यार',
        'Mylapore':'मायलापुर','Velachery':'वेलाचेरी','Porur':'पोरुर',
        'Guindy':'गिंडी','Nungambakkam':'नुंगम्बाक्कम','Egmore':'एग्मोर',
        'Tambaram':'तांबरम','Chromepet':'क्रोमपेट','Kodambakkam':'कोडंबाक्कम',
        'Vadapalani':'वडपलानी','Ashok Nagar':'अशोक नगर','Thiruvanmiyur':'तिरुवनमियूर',
        'Besant Nagar':'बेसेंट नगर','Royapettah':'रोयापेट्टा','Triplicane':'त्रिप्लीकेन',
        'Perambur':'पेरंबूर','Tondiarpet':'तोंडियारपेट','Sowcarpet':'सावकारपेट',
        'Kilpauk':'किलपौक','Chetpet':'चेतपेट','Saidapet':'सैदापेट',
        'Medavakkam':'मेडावाक्कम','Gandhipuram':'गांधीपुरम','RS Puram':'आरएस पुरम',
        'Sulur':'सुलूर','Pollachi':'पोल्लाची','Mettupalayam':'मेट्टुपालयम',
        'Madurai North':'मदुरई उत्तर','Madurai South':'मदुरई दक्षिण',
        'Trichy Town':'त्रिची टाउन','Srirangam':'श्रीरंगम',
        'Salem Town':'सेलम टाउन','Ooty':'ऊटी','Coonoor':'कूनूर',
        'Tirunelveli Town':'तिरुनेलवेली टाउन','Palayamkottai':'पालयमकोट्टई',
        'Nagercoil':'नागरकोइल','Kanyakumari':'कन्याकुमारी',
        'Vellore Town':'वेल्लोर टाउन','Katpadi':'कटपाडी',
        'Hosur':'होसूर','Kumbakonam':'कुंभकोणम','Thanjavur':'तंजावुर',
        'Karaikudi':'कारईकुडी','Sivakasi':'शिवकासी','Rajapalayam':'राजपालायम',
        'Avadi':'अवाडी','Poonamallee':'पूनमल्ली','Ambattur':'अंबट्टूर'
    }
};

// Helper: get area display name in current language
function getAreaName(area) {
    if (currentLanguage === 'ta' && areaNamesLocalized.ta[area]) return areaNamesLocalized.ta[area];
    if (currentLanguage === 'hi' && areaNamesLocalized.hi[area]) return areaNamesLocalized.hi[area];
    return area;
}


const DATA_KEY = 'streetbite_stalls';

// Initialize — load stalls from the backend API (shared across ALL devices)
async function initializeData() {
    await loadStalls();
    renderHomePage();
}

async function loadStalls() {
    showLoading(true);
    try {
        const res = await fetch('/api/stalls');
        stalls = await res.json();
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
        appName: '🍽️ StreetBite',
        searchPlaceholder: '🔍 Search shops or food...',
        home: 'Home',
        search: 'Search',
        addShop: 'Add Shop',
        profile: 'Profile',
        all: 'All',
        open: 'Open',
        closed: 'Closed',
        openNow: 'Open Now',
        shopStatus: 'Shop Status',
        currentStatus: 'Current',
        menu: 'Menu',
        reviews: 'Reviews',
        writeReview: 'Write a Review',
        submitReview: 'Submit Review',
        reviewPlaceholder: 'Share your experience...',
        noReviews: 'No reviews yet. Be the first!',
        addNewShop: '➕ Add New Shop',
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
        menuItems: '📋 Menu Items',
        itemName: 'Item name',
        price: '₹',
        listMyShop: 'List My Shop',
        noItemsAdded: 'No items added yet',
        vendorLogin: '👤 Vendor Login',
        vendorLoginSub: 'Manage your shop status and menu',
        selectYourShop: 'Select Your Shop',
        chooseYourShop: 'Choose your shop',
        contactNumberLabel: 'Contact Number',
        contactPlaceholder: 'Your registered contact number',
        login: 'Login',
        noShopListed: "Don't have a shop listed?",
        addYourShop: 'Add Your Shop',
        vendorDashboard: '👤 Vendor Dashboard',
        logout: 'Logout',
        menuAvailability: '📋 Menu Availability',
        updateDiscount: 'Update Offer',
        language: 'Language',
        selectLanguage: 'Select Language',
        english: 'English',
        tamil: 'தமிழ்',
        hindi: 'हिंदी',
        available: 'Available',
        unavailable: 'Unavailable',
        rating: 'Rating',
        tapToCall: 'Tap to call',
        noShopsFound: 'No shops found',
        addNewMenuItem: 'Add New Menu Item',
        itemNamePlaceholder: 'e.g., Masala Dosa',
        addItemToMenu: 'Add Item to Menu',
        categoryFastFood: '🍟 Fast Food',
        categoryBiryani: '🍚 Biryani',
        categoryParottaMeals: '🫓 Parotta & Meals',
        categoryGrilledNonVeg: '🍗 Grilled & Non-Veg',
        categoryJuice: '🧃 Juice',
        categorySweetBeverages: '🍧 Sweet & Beverages',
        categorySnacks: '🍿 Snacks',
        categoryOthers: '🍽️ Others',
        welcomeTitle: 'Welcome to StreetBite! 😋',
        welcomeSubtitle: 'Discover the best street food near you',
        shopsAvailable: 'shops available',
        toggleOpen: '✓ Open',
        toggleClosed: '✕ Closed',
        selectLocation: 'Select Location',
        selectDistrict: '📍 Select Your District',
        selectArea: '📍 Select Area in',
        changeLocation: 'Change',
        nearbyShops: 'Nearby shops in',
        searchDistrict: '🔍 Search district...',
        searchArea: '🔍 Search area...',
        allAreas: 'All Areas'
    },
    ta: {
        appName: '🍽️ ஸ்ட்ரீட்பைட்',
        searchPlaceholder: '🔍 கடை அல்லது உணவைத் தேடு...',
        home: 'முகப்பு',
        search: 'தேடல்',
        addShop: 'கடை சேர்',
        profile: 'சுயவிவரம்',
        all: 'அனைத்தும்',
        open: 'திறந்திருக்கிறது',
        closed: 'மூடியிருக்கிறது',
        openNow: 'இப்போது திறந்திருக்கிறது',
        shopStatus: 'கடை நிலை',
        currentStatus: 'தற்போதைய நிலை',
        menu: 'உணவுப் பட்டியல்',
        reviews: 'மதிப்புரைகள்',
        writeReview: 'மதிப்புரை எழுது',
        submitReview: 'சமர்ப்பி',
        reviewPlaceholder: 'உங்கள் அனுபவத்தைப் பகிர்ந்து கொள்ளுங்கள்...',
        noReviews: 'இன்னும் மதிப்புரைகள் இல்லை! முதலில் எழுதுங்கள்!',
        addNewShop: '➕ புதிய கடை சேர்',
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
        menuItems: '📋 உணவுப் பட்டியல்',
        itemName: 'உணவு பெயர்',
        price: '₹',
        listMyShop: 'என் கடையைப் பதிவு செய்',
        noItemsAdded: 'இன்னும் உணவுகள் சேர்க்கப்படவில்லை',
        vendorLogin: '👤 வியாபாரி நுழைவு',
        vendorLoginSub: 'உங்கள் கடை நிலை மற்றும் உணவுப் பட்டியலை நிர்வகிக்க',
        selectYourShop: 'உங்கள் கடையைத் தேர்வு செய்',
        chooseYourShop: 'உங்கள் கடையைத் தேர்ந்தெடுக்கவும்',
        contactNumberLabel: 'தொடர்பு எண்',
        contactPlaceholder: 'உங்கள் பதிவு செய்த எண்',
        login: 'உள்நுழை',
        noShopListed: 'கடை இல்லையா?',
        addYourShop: 'உங்கள் கடையைச் சேர்',
        vendorDashboard: '👤 வியாபாரி கட்டுப்பாட்டறை',
        logout: 'வெளியேறு',
        menuAvailability: '📋 உணவு கிடைக்கும் நிலை',
        updateDiscount: 'சலுகையைப் புதுப்பி',
        language: 'மொழி',
        selectLanguage: 'மொழியைத் தேர்வு செய்',
        english: 'ஆங்கிலம்',
        tamil: 'தமிழ்',
        hindi: 'இந்தி',
        available: 'கிடைக்கிறது',
        unavailable: 'கிடைக்காது',
        rating: 'மதிப்பீடு',
        tapToCall: 'அழைக்க தொடுக',
        noShopsFound: 'கடைகள் ஏதும் கிடைக்கவில்லை',
        addNewMenuItem: 'புதிய உணவைச் சேர்',
        itemNamePlaceholder: 'உதா: மசால் தோசை',
        addItemToMenu: 'உணவுப் பட்டியலில் சேர்',
        categoryFastFood: '🍟 ஃபாஸ்ட் ஃபுட்',
        categoryBiryani: '🍚 பிரியாணி',
        categoryParottaMeals: '🫓 பரோட்டா & மீல்ஸ்',
        categoryGrilledNonVeg: '🍗 க்ரில்ட் & நான்-வெஜ்',
        categoryJuice: '🧃 பழச்சாறு',
        categorySweetBeverages: '🍧 இனிப்பு & பானங்கள்',
        categorySnacks: '🍿 சிற்றுண்டி',
        categoryOthers: '🍽️ மற்றவை',
        welcomeTitle: 'ஸ்ட்ரீட்பைட்-க்கு வரவேற்பு! 😋',
        welcomeSubtitle: 'உங்கள் அருகில் சிறந்த தெரு உணவுகளைக் கண்டறியுங்கள்',
        shopsAvailable: 'கடைகள் கிடைக்கின்றன',
        toggleOpen: '✓ திறந்திருக்கிறது',
        toggleClosed: '✕ மூடியிருக்கிறது',
        selectLocation: 'இடம் தேர்வு',
        selectDistrict: '📍 மாவட்டம் தேர்வு',
        selectArea: '📍 பகுதி தேர்வு -',
        changeLocation: 'மாற்று',
        nearbyShops: 'அருகிலுள்ள கடைகள் -',
        searchDistrict: '🔍 மாவட்டம் தேடு...',
        searchArea: '🔍 பகுதி தேடு...',
        allAreas: 'அனைத்து பகுதிகள்'
    },
    hi: {
        appName: '🍽️ स्ट्रीटबाइट',
        searchPlaceholder: '🔍 दुकान या खाना खोजें...',
        home: 'मुख्य पृष्ठ',
        search: 'खोजें',
        addShop: 'दुकान जोड़ें',
        profile: 'प्रोफ़ाइल',
        all: 'सभी',
        open: 'खुला है',
        closed: 'बंद है',
        openNow: 'अभी खुला है',
        shopStatus: 'दुकान की स्थिति',
        currentStatus: 'वर्तमान स्थिति',
        menu: 'मेनू',
        reviews: 'समीक्षाएँ',
        writeReview: 'समीक्षा लिखें',
        submitReview: 'जमा करें',
        reviewPlaceholder: 'अपना अनुभव साझा करें...',
        noReviews: 'अभी कोई समीक्षा नहीं! पहली समीक्षा दें!',
        addNewShop: '➕ नई दुकान जोड़ें',
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
        menuItems: '📋 मेनू आइटम',
        itemName: 'आइटम का नाम',
        price: '₹',
        listMyShop: 'अपनी दुकान सूचीबद्ध करें',
        noItemsAdded: 'कोई आइटम नहीं जोड़ा गया',
        vendorLogin: '👤 विक्रेता लॉगिन',
        vendorLoginSub: 'अपनी दुकान की स्थिति और मेनू प्रबंधित करें',
        selectYourShop: 'अपनी दुकान चुनें',
        chooseYourShop: 'अपनी दुकान का चयन करें',
        contactNumberLabel: 'संपर्क नंबर',
        contactPlaceholder: 'अपना पंजीकृत नंबर डालें',
        login: 'लॉगिन',
        noShopListed: 'दुकान सूचीबद्ध नहीं है?',
        addYourShop: 'अपनी दुकान जोड़ें',
        vendorDashboard: '👤 विक्रेता डैशबोर्ड',
        logout: 'लॉगआउट',
        menuAvailability: '📋 मेनू उपलब्धता',
        updateDiscount: 'पेशकश अपडेट करें',
        language: 'भाषा',
        selectLanguage: 'भाषा चुनें',
        english: 'अंग्रेज़ी',
        tamil: 'तमिल',
        hindi: 'हिंदी',
        available: 'उपलब्ध',
        unavailable: 'अनुपलब्ध',
        rating: 'रेटिंग',
        tapToCall: 'कॉल करने के लिए टैप करें',
        noShopsFound: 'कोई दुकान नहीं मिली',
        addNewMenuItem: 'नया मेनू आइटम जोड़ें',
        itemNamePlaceholder: 'जैसे: मसाला दोसा',
        addItemToMenu: 'मेनू में जोड़ें',
        categoryFastFood: '🍟 फास्ट फूड',
        categoryBiryani: '🍚 बिरयानी',
        categoryParottaMeals: '🫓 पराठा & मील्स',
        categoryGrilledNonVeg: '🍗 ग्रिल्ड & नॉन-वेज',
        categoryJuice: '🧃 जूस',
        categorySweetBeverages: '🍧 मिठाई & पेय',
        categorySnacks: '🍿 नाश्ता',
        categoryOthers: '🍽️ अन्य',
        welcomeTitle: 'स्ट्रीटबाइट में आपका स्वागत है! 😋',
        welcomeSubtitle: 'आपके आस-पास का बेहतरीन स्ट्रीट फूड खोजें',
        shopsAvailable: 'दुकानें उपलब्ध',
        toggleOpen: '✓ खुला है',
        toggleClosed: '✕ बंद है',
        selectLocation: 'स्थान चुनें',
        selectDistrict: '📍 अपना जिला चुनें',
        selectArea: '📍 क्षेत्र चुनें -',
        changeLocation: 'बदलें',
        nearbyShops: 'आस-पास की दुकानें -',
        searchDistrict: '🔍 जिला खोजें...',
        searchArea: '🔍 क्षेत्र खोजें...',
        allAreas: 'सभी क्षेत्र'
    }
};

// Category emojis
const categoryEmojis = {
    'Fast Food': '🍟',
    'Biryani': '🍚',
    'Parotta & Meals': '🫓',
    'Grilled & Non-Veg': '🍗',
    'Juice': '🧃',
    'Sweet & Beverages': '🍧',
    'Snacks': '🍿',
    'Others': '🍽️'
};

// Convert 24-hour time to 12-hour format
function formatTime12Hour(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // 0 becomes 12
    return `${h}:${minutes} ${ampm}`;
}

// Get translation
function t(key) {
    return translations[currentLanguage][key] || translations['en'][key] || key;
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadLanguagePreference();
    setupNavigation();
    updateLocationButtonText();
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
            navigateTo(page);
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
    const selector = document.getElementById('header-language-select');
    if (selector) {
        selector.value = currentLanguage;
    }
}

// Navigation
function navigateTo(page) {
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
            renderAddShopPage();
            break;
        case 'profile':
            renderProfilePage();
            break;
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

    const openCount = stalls.filter(s => s.status === 'open').length;

    // Build location chip HTML
    let locationChipHTML = '';
    if (selectedDistrict && selectedArea && selectedArea !== 'All Areas') {
        locationChipHTML = `
            <div class="selected-location-chip">
                <span class="location-chip-icon">📍</span>
                <span class="location-chip-text">${t('nearbyShops')} <strong>${getAreaName(selectedArea)}, ${getDistrictName(selectedDistrict)}</strong></span>
                <button class="location-chip-change" onclick="openLocationPicker()">${t('changeLocation')}</button>
            </div>
        `;
    } else if (selectedDistrict) {
        locationChipHTML = `
            <div class="selected-location-chip">
                <span class="location-chip-icon">📍</span>
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
                <div class="welcome-stats">
                    <div class="stat-item">
                        <span class="stat-number">${stalls.length}</span>
                        <span class="stat-label">${t('shopsAvailable')}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${openCount}</span>
                        <span class="stat-label">${t('openNow')}</span>
                    </div>
                </div>
            </div>
            ${locationChipHTML}
            <div class="category-tabs">
                <button class="category-tab ${selectedCategory === 'All' ? 'active' : ''}" data-category="All">${t('all')}</button>
                <button class="category-tab ${selectedCategory === 'Fast Food' ? 'active' : ''}" data-category="Fast Food">${t('categoryFastFood')}</button>
                <button class="category-tab ${selectedCategory === 'Biryani' ? 'active' : ''}" data-category="Biryani">${t('categoryBiryani')}</button>
                <button class="category-tab ${selectedCategory === 'Parotta & Meals' ? 'active' : ''}" data-category="Parotta & Meals">${t('categoryParottaMeals')}</button>
                <button class="category-tab ${selectedCategory === 'Grilled & Non-Veg' ? 'active' : ''}" data-category="Grilled & Non-Veg">${t('categoryGrilledNonVeg')}</button>
                <button class="category-tab ${selectedCategory === 'Juice' ? 'active' : ''}" data-category="Juice">${t('categoryJuice')}</button>
                <button class="category-tab ${selectedCategory === 'Sweet & Beverages' ? 'active' : ''}" data-category="Sweet & Beverages">${t('categorySweetBeverages')}</button>
                <button class="category-tab ${selectedCategory === 'Snacks' ? 'active' : ''}" data-category="Snacks">${t('categorySnacks')}</button>
                <button class="category-tab ${selectedCategory === 'Others' ? 'active' : ''}" data-category="Others">${t('categoryOthers')}</button>
            </div>
            <div class="shop-grid" id="shop-grid"></div>
        </div>
    `;

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

// Render shop grid
function renderShopGrid() {
    const grid = document.getElementById('shop-grid');
    let filtered = stalls;

    // Filter by selected location
    if (selectedArea && selectedArea !== 'All Areas') {
        filtered = filtered.filter(s =>
            s.area.toLowerCase().includes(selectedArea.toLowerCase())
        );
    } else if (selectedDistrict) {
        const districtAreas = tamilNaduDistricts[selectedDistrict] || [];
        if (districtAreas.length > 0) {
            filtered = filtered.filter(s =>
                districtAreas.some(area => s.area.toLowerCase().includes(area.toLowerCase()))
            );
        }
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
                <div class="icon">🔍</div>
                <p>${t('noShopsFound')}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(stall => `
        <div class="shop-card" data-id="${stall.id}">
            <div class="shop-card-header">
                <span class="shop-name">${stall.name}</span>
                <span class="shop-emoji">${stall.emoji || categoryEmojis[stall.category] || '🍽️'}</span>
            </div>
            <span class="shop-category">${stall.category}</span>
            <div class="shop-area">📍 ${stall.area}</div>
            <div>
                <span class="shop-status ${stall.status}">${stall.status === 'open' ? '✓ ' + t('open') : '✕ ' + t('closed')}</span>
                <span class="shop-rating">⭐ ${stall.rating.toFixed(1)} (${stall.totalReviews})</span>
            </div>
            ${stall.todayDiscount ? `<div class="shop-discount">🎉 ${stall.todayDiscount}</div>` : ''}
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
                <button class="category-tab ${selectedCategory === 'All' ? 'active' : ''}" data-category="All">${t('all')}</button>
                <button class="category-tab ${selectedCategory === 'Fast Food' ? 'active' : ''}" data-category="Fast Food">${t('categoryFastFood')}</button>
                <button class="category-tab ${selectedCategory === 'Biryani' ? 'active' : ''}" data-category="Biryani">${t('categoryBiryani')}</button>
                <button class="category-tab ${selectedCategory === 'Parotta & Meals' ? 'active' : ''}" data-category="Parotta & Meals">${t('categoryParottaMeals')}</button>
                <button class="category-tab ${selectedCategory === 'Grilled & Non-Veg' ? 'active' : ''}" data-category="Grilled & Non-Veg">${t('categoryGrilledNonVeg')}</button>
                <button class="category-tab ${selectedCategory === 'Juice' ? 'active' : ''}" data-category="Juice">${t('categoryJuice')}</button>
                <button class="category-tab ${selectedCategory === 'Sweet & Beverages' ? 'active' : ''}" data-category="Sweet & Beverages">${t('categorySweetBeverages')}</button>
                <button class="category-tab ${selectedCategory === 'Snacks' ? 'active' : ''}" data-category="Snacks">${t('categorySnacks')}</button>
                <button class="category-tab ${selectedCategory === 'Others' ? 'active' : ''}" data-category="Others">${t('categoryOthers')}</button>
            </div>
            <div class="shop-grid" id="shop-grid"></div>
        </div>
    `;

    // Setup search
    const searchInput = app.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderShopGrid();
    });

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

// Show Shop Detail (static version for GitHub Pages)
function showShopDetail(id) {
    showLoading(true);
    const stall = stalls.find(s => s.id === id);
    if (stall) {
        renderShopDetailPage(stall);
    } else {
        showToast('Shop not found', 'error');
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
                <button class="back-btn" onclick="navigateTo('home')">←</button>
                <h2>${stall.name}</h2>
            </div>

            <div class="detail-header">
                <div class="detail-name">${stall.emoji || categoryEmojis[stall.category] || '🍽️'} ${stall.name}</div>
                <div class="detail-category">${stall.category}</div>

                <div class="status-banner ${stall.status}">
                    <span class="status-dot"></span>
                    <span>${isOpen ? t('openNow') : t('closed')}</span>
                    <span>• ${openTime12} - ${closeTime12}</span>
                </div>

                <div class="detail-info">
                    <div class="info-row">
                        <span class="icon">📍</span>
                        <span>${stall.address || stall.area}</span>
                    </div>
                    ${stall.contact ? `
                    <div class="info-row">
                        <span class="icon">📞</span>
                        <a href="tel:${stall.contact}">${stall.contact}</a>
                    </div>` : ''}
                    <div class="info-row">
                        <span class="icon">⭐</span>
                        <span>${(stall.rating || 0).toFixed(1)} ${t('rating')} (${stall.totalReviews || 0})</span>
                    </div>
                </div>
            </div>

            ${stall.todayDiscount ? `
                <div class="discount-banner">
                    🎉 ${stall.todayDiscount}
                </div>
            ` : ''}

            <h3 class="section-title">${t('menu')}</h3>
            <div class="menu-list">
                ${stall.menu.map(item => {
                    const itemAvailable = isOpen ? item.available : false;
                    return `
                    <div class="menu-item ${!itemAvailable ? 'menu-item-unavailable' : ''}">
                        <div class="menu-item-info">
                            <div class="menu-item-name">${item.itemName}</div>
                            <div class="menu-item-price">₹${item.price}</div>
                        </div>
                        <span class="availability-toggle ${itemAvailable ? 'available' : 'unavailable'}" style="cursor: default; transform: none;">${itemAvailable ? 'ON' : 'OFF'}</span>
                    </div>
                `}).join('')}
            </div>

            <h3 class="section-title">${t('reviews')} (${stall.reviews.length})</h3>
            <div class="reviews-list">
                ${stall.reviews.length > 0 ? stall.reviews.map(review => `
                    <div class="review-card">
                        <div class="review-header">
                            <div class="review-stars">${'⭐'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                            <span class="review-date">${review.date}</span>
                        </div>
                        <div class="review-comment">${review.comment}</div>
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
            showToast('Please select a rating and write a review', 'error');
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
            showToast('Review submitted! ⭐', 'success');
            renderShopDetailPage(updated);
        } catch (e) {
            showToast('Could not submit review', 'error');
        }
    });
}

// Render Add Shop as a persistent full-screen modal
function renderAddShopPage() {
    // If modal already exists, just show it (preserves form data)
    if (document.getElementById('add-shop-modal')) {
        document.getElementById('add-shop-modal').classList.add('active');
        return;
    }

    let menuItems = [];

    // Create modal element and append to body
    const modal = document.createElement('div');
    modal.id = 'add-shop-modal';
    modal.className = 'add-shop-modal active';
    modal.innerHTML = `
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

                <div class="form-group">
                    <label>${t('areaLocation')} *</label>
                    <input type="text" id="shop-area" placeholder="${t('areaPlaceholder')}">
                </div>

                <div class="form-group">
                    <label>${t('fullAddress')}</label>
                    <textarea id="shop-address" placeholder="${t('addressPlaceholder')}" rows="2"></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>${t('contactNumber')} *</label>
                        <input type="tel" id="shop-contact" placeholder="9876543210" pattern="[0-9]{10}">
                    </div>
                    <div class="form-group">
                        <label>${t('todaysDiscount')}</label>
                        <input type="text" id="shop-discount" placeholder="${t('discountPlaceholder')}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>\uD83D\uDD12 Password *</label>
                        <div class="password-wrapper">
                            <input type="password" id="shop-password" placeholder="Min 4 characters" autocomplete="new-password">
                            <button type="button" class="eye-toggle-btn" data-target="shop-password" title="Show/hide password">\uD83D\uDC41\uFE0F</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>\uD83D\uDD12 Confirm Password *</label>
                        <div class="password-wrapper">
                            <input type="password" id="shop-password-confirm" placeholder="Repeat password" autocomplete="new-password">
                            <button type="button" class="eye-toggle-btn" data-target="shop-password-confirm" title="Show/hide password">\uD83D\uDC41\uFE0F</button>
                        </div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>${t('openingTime')}</label>
                        <input type="time" id="open-time" value="09:00">
                    </div>
                    <div class="form-group">
                        <label>${t('closingTime')}</label>
                        <input type="time" id="close-time" value="22:00">
                    </div>
                </div>

                <div class="menu-items-section">
                    <h3 class="section-title">${t('menuItems')}</h3>
                    <div class="menu-input-row">
                        <input type="text" id="menu-item-name" placeholder="${t('itemName')}">
                        <input type="number" id="menu-item-price" placeholder="${t('price')}">
                        <button class="add-menu-btn" id="add-menu-item">+</button>
                    </div>
                    <div class="added-menu-list" id="added-menu-list"></div>
                </div>

                <button class="submit-btn" id="submit-shop" style="margin-top: 20px;">${t('listMyShop')}</button>
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
                <span>${item.itemName} - ₹${item.price}</span>
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

    // Init eye toggles
    initPasswordToggles(modal);

    // ✕ Close — go back to Profile
    modal.querySelector('#add-shop-close-btn').addEventListener('click', () => {
        modal.classList.remove('active');
        // Navigate back to profile
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const profileNav = document.querySelector('.nav-item[data-page="profile"]');
        if (profileNav) profileNav.classList.add('active');
        navigateTo('profile');
    });

    // Add menu item
    modal.querySelector('#add-menu-item').addEventListener('click', () => {
        const name = modal.querySelector('#menu-item-name').value.trim();
        const price = parseInt(modal.querySelector('#menu-item-price').value);
        if (!name || !price) {
            showToast('Please enter item name and price', 'error');
            return;
        }
        menuItems.push({ itemName: name, price, available: true });
        modal.querySelector('#menu-item-name').value = '';
        modal.querySelector('#menu-item-price').value = '';
        renderMenuList();
    });

    // Submit shop — POST to /api/stalls/signup
    modal.querySelector('#submit-shop').addEventListener('click', async () => {
        const name = modal.querySelector('#shop-name').value.trim();
        const category = modal.querySelector('#shop-category').value;
        const area = modal.querySelector('#shop-area').value.trim();
        const address = modal.querySelector('#shop-address').value.trim();
        const contact = modal.querySelector('#shop-contact').value.trim();
        const discount = modal.querySelector('#shop-discount').value.trim();
        const openTime = modal.querySelector('#open-time').value;
        const closeTime = modal.querySelector('#close-time').value;
        const password = modal.querySelector('#shop-password').value;
        const confirmPassword = modal.querySelector('#shop-password-confirm').value;

        if (!name || !category || !area || !contact) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        if (!password || password.length < 4) {
            showToast('Password must be at least 4 characters', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (menuItems.length === 0) {
            showToast('Please add at least one menu item', 'error');
            return;
        }

        const submitBtn = modal.querySelector('#submit-shop');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        try {
            const res = await fetch('/api/stalls/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name, category, area,
                    address: address || `${area}, Tamil Nadu`,
                    contact, password,
                    open_time: openTime,
                    close_time: closeTime,
                    today_discount: discount || null,
                    menu: menuItems
                })
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Registration failed', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = t('listMyShop');
                return;
            }
            modal.remove();
            showToast('🎉 Shop registered! Visible to all users now.', 'success');
            await reloadStalls();
            navigateTo('home');
        } catch (e) {
            showToast('Network error. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = t('listMyShop');
        }
    });
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
                    <h3>${vendorShop.emoji || categoryEmojis[vendorShop.category]} ${vendorShop.name}</h3>
                    <p style="color: #666; margin-bottom: 20px;">${vendorShop.area}</p>
                    <p style="font-size: 0.85rem; color: #888; margin-bottom: 15px;">⏰ ${openTime12} - ${closeTime12}</p>

                    <div class="toggle-section-large">
                        <button class="toggle-switch-large ${vendorShop.status}" id="status-toggle">
                            ${isOpen ? t('toggleOpen') : t('toggleClosed')}
                        </button>
                        <div class="toggle-info">
                            <p class="toggle-status-text ${vendorShop.status}">${isOpen ? t('openNow') : t('closed')}</p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>${t('todaysDiscount')}</label>
                        <input type="text" id="vendor-discount" value="${vendorShop.todayDiscount || ''}" placeholder="${t('discountPlaceholder')}">
                        <button class="submit-btn" id="update-discount" style="margin-top: 10px;">${t('updateDiscount')}</button>
                    </div>

                    <h3 class="section-title" style="margin-top: 20px;">${t('menuAvailability')}</h3>
                    <div class="menu-list">
                        ${vendorShop.menu.map((item, index) => `
                            <div class="menu-item">
                                <div class="menu-item-info">
                                    <div class="menu-item-name">${item.itemName}</div>
                                    <div class="menu-item-price">₹${item.price}</div>
                                </div>
                                <button class="availability-toggle ${item.available ? 'available' : 'unavailable'}" data-index="${index}">${item.available ? 'ON' : 'OFF'}</button>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Add New Menu Item Section -->
                    <div class="form-section" style="margin-top: 20px;">
                        <h3 class="section-title">➕ ${t('addNewMenuItem')}</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${t('itemName')}</label>
                                <input type="text" id="new-item-name" placeholder="${t('itemNamePlaceholder')}">
                            </div>
                            <div class="form-group">
                                <label>${t('price')}</label>
                                <input type="number" id="new-item-price" placeholder="₹ 50">
                            </div>
                        </div>
                        <button class="submit-btn" id="add-new-item-btn" style="background: #28a745; margin-top: 10px;">${t('addItemToMenu')}</button>
                    </div>
                </div>
            </div>
        `;

        // Status toggle — API call
        app.querySelector('#status-toggle').addEventListener('click', async () => {
            const newStatus = vendorShop.status === 'open' ? 'closed' : 'open';
            try {
                const res = await fetch(`/api/stalls/${vendorShop.id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
                const data = await res.json();
                vendorShop.status = newStatus;
                await reloadStalls();
                renderProfilePage();
                showToast(`Shop is now ${newStatus === 'open' ? '🟢 Open' : '🔴 Closed'}`, 'success');
            } catch (e) { showToast('Update failed', 'error'); }
        });

        // Discount update — API call
        const discountInput = app.querySelector('#vendor-discount');
        const updateDiscountBtn = app.querySelector('#update-discount');

        const updateDiscount = async () => {
            const discount = app.querySelector('#vendor-discount').value.trim();
            try {
                await fetch(`/api/stalls/${vendorShop.id}/discount`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ discount: discount || null })
                });
                vendorShop.todayDiscount = discount || null;
                showToast('Offer updated! 🎉', 'success');
            } catch (e) { showToast('Update failed', 'error'); }
        };

        updateDiscountBtn.addEventListener('click', updateDiscount);
        discountInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') updateDiscount(); });

        // Menu availability toggles — API call
        app.querySelectorAll('.availability-toggle').forEach(toggle => {
            toggle.addEventListener('click', async () => {
                const index = parseInt(toggle.dataset.index);
                const newAvailable = !vendorShop.menu[index].available;
                try {
                    await fetch(`/api/stalls/${vendorShop.id}/menu-item`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ item_index: index, available: newAvailable })
                    });
                    vendorShop.menu[index].available = newAvailable;
                    renderProfilePage();
                    showToast(`${vendorShop.menu[index].itemName} is now ${newAvailable ? 'available' : 'unavailable'}`, 'success');
                } catch (e) { showToast('Update failed', 'error'); }
            });
        });

        // Logout
        app.querySelector('#logout-btn').addEventListener('click', () => {
            vendorShop = null;
            localStorage.removeItem('vendorShopId');
            renderProfilePage();
            showToast('Logged out', 'success');
        });

        // Add new menu item — API call
        app.querySelector('#add-new-item-btn').addEventListener('click', async () => {
            const itemName = app.querySelector('#new-item-name').value.trim();
            const price = parseInt(app.querySelector('#new-item-price').value);

            if (!itemName || !price) {
                showToast('Please enter item name and price', 'error');
                return;
            }
            try {
                const res = await fetch(`/api/stalls/${vendorShop.id}/menu`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemName, price, available: true })
                });
                const updated = await res.json();
                vendorShop.menu = updated.menu || vendorShop.menu;
                vendorShop.menu.push({ itemName, price, available: true });
                app.querySelector('#new-item-name').value = '';
                app.querySelector('#new-item-price').value = '';
                renderProfilePage();
                showToast('New item added! 🍽️', 'success');
            } catch (e) { showToast('Failed to add item', 'error'); }
        });

    } else {
        // Login form — check for persistent login via API
        const savedShopId = localStorage.getItem('vendorShopId');
        const savedContact = localStorage.getItem('vendorContact');

        if (savedShopId) {
            // Re-fetch from API to get fresh data
            fetch(`/api/stalls/${savedShopId}`)
                .then(r => r.json())
                .then(shop => {
                    if (shop && shop.id) {
                        vendorShop = shop;
                        renderProfilePage();
                    }
                })
                .catch(() => {});
            return;
        }

        app.innerHTML = `
            <div class="page vendor-login-page">
                <h2 class="section-title">${t('vendorLogin')}</h2>
                <p style="color: #666; margin-bottom: 20px;">${t('vendorLoginSub')}</p>

                <div class="form-section">
                    <div class="form-group">
                        <label>${t('language')}</label>
                        <select id="language-select" onchange="changeLanguage(this.value)">
                            <option value="en" ${currentLanguage === 'en' ? 'selected' : ''}>🇬🇧 ${t('english')}</option>
                            <option value="ta" ${currentLanguage === 'ta' ? 'selected' : ''}>🇮🇳 ${t('tamil')}</option>
                            <option value="hi" ${currentLanguage === 'hi' ? 'selected' : ''}>🇮🇳 ${t('hindi')}</option>
                        </select>
                    </div>

                    <div class="vendor-login-form">
                        <div class="form-group" style="position: relative;">
                            <label>${t('selectYourShop')}</label>
                            <input type="text" id="shop-search-input" class="search-input" placeholder="${currentLanguage === 'ta' ? 'கடையைத் தேடுக...' : currentLanguage === 'hi' ? 'दुकान खोजें...' : 'Type shop name or area...'}" autocomplete="off">
                            <div id="shop-search-results" style="position: absolute; top: 100%; left: 0; right: 0; max-height: 250px; overflow-y: auto; background: white; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 1000; display: none;"></div>
                        </div>

                        <div class="form-group">
                            <label>${t('contactNumberLabel')}</label>
                            <input type="tel" id="vendor-contact" placeholder="${t('contactPlaceholder')}">
                        </div>

                        <div class="form-group">
                            <label>\uD83D\uDD12 Password</label>
                            <div class="password-wrapper">
                                <input type="password" id="vendor-password" placeholder="Your shop password" autocomplete="current-password">
                                <button type="button" class="eye-toggle-btn" data-target="vendor-password" title="Show/hide password">\uD83D\uDC41\uFE0F</button>
                            </div>
                        </div>

                        <button class="submit-btn" id="vendor-login-btn">${t('login')}</button>
                    </div>

                    <div style="text-align: center; margin-top: 30px; color: #666;">
                        <p>${t('noShopListed')}</p>
                        <button class="add-shop-from-profile-btn" id="add-shop-from-profile">
                            ➕ ${t('addYourShop')}
                        </button>
                    </div>
                </div>
            </div>
        `;

        let selectedShopId = null;
        const searchInput = app.querySelector('#shop-search-input');
        const resultsDropdown = app.querySelector('#shop-search-results');

        // Init password eye toggles
        initPasswordToggles(app);

        // "Add Your Shop" button — navigate to the full add shop page
        app.querySelector('#add-shop-from-profile').addEventListener('click', () => {
            // Keep Profile nav active visually (user came from profile)
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            const profileNav = document.querySelector('.nav-item[data-page="profile"]');
            if (profileNav) profileNav.classList.add('active');
            // Render the full add shop page
            navigateTo('add');
        });

        // Search functionality - show results as user types
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();

            if (query.length === 0) {
                resultsDropdown.style.display = 'none';
                selectedShopId = null;
                return;
            }

            const filtered = stalls.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.area.toLowerCase().includes(query)
            );

            if (filtered.length === 0) {
                resultsDropdown.innerHTML = `<div style="padding: 15px; text-align: center; color: #999;">${currentLanguage === 'ta' ? 'கடைகள் ஏதும் கிடைக்கவில்லை' : currentLanguage === 'hi' ? 'कोई दुकान नहीं मिली' : 'No shops found'}</div>`;
            } else {
                resultsDropdown.innerHTML = filtered.map(s => `
                    <div class="shop-suggestion-item" data-id="${s.id}" style="padding: 12px 15px; cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: background 0.2s;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600; color: #333;">${s.emoji || '🍽️'} ${s.name}</div>
                                <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">📍 ${s.area}</div>
                            </div>
                            <span style="color: #FF6B35; font-size: 1.2rem;">→</span>
                        </div>
                    </div>
                `).join('');
            }

            resultsDropdown.style.display = 'block';

            // Add click handlers to suggestions
            resultsDropdown.querySelectorAll('.shop-suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    selectedShopId = parseInt(item.dataset.id);
                    const shop = stalls.find(s => s.id === selectedShopId);
                    searchInput.value = shop.name;
                    resultsDropdown.style.display = 'none';
                });
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !resultsDropdown.contains(e.target)) {
                resultsDropdown.style.display = 'none';
            }
        });

        // Login — verify via API (contact + password)
        app.querySelector('#vendor-login-btn').addEventListener('click', async () => {
            if (!selectedShopId) {
                showToast(currentLanguage === 'ta' ? 'தயவுசெய்து உங்கள் கடையைத் தேர்வுசெய்க' : currentLanguage === 'hi' ? 'कृपया अपनी दुकान चुनें' : 'Please select your shop from the list', 'error');
                searchInput.focus();
                return;
            }

            const contact = app.querySelector('#vendor-contact').value.trim();
            const password = app.querySelector('#vendor-password').value;

            if (!contact) {
                showToast(currentLanguage === 'ta' ? 'தொடர்பு எண்ணை உள்ளிடுக' : currentLanguage === 'hi' ? 'संपर्क नंबर डालें' : 'Please enter contact number', 'error');
                return;
            }
            if (!password) {
                showToast('Please enter your password', 'error');
                return;
            }

            const loginBtn = app.querySelector('#vendor-login-btn');
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';

            try {
                const res = await fetch(`/api/stalls/${selectedShopId}/vendor-login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contact, password })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    vendorShop = data.stall;
                    localStorage.setItem('vendorShopId', selectedShopId);
                    localStorage.setItem('vendorContact', contact);
                    renderProfilePage();
                    showToast(currentLanguage === 'ta' ? `வரவேற்கிறோம், ${vendorShop.name}!` : currentLanguage === 'hi' ? `स्वागत है, ${vendorShop.name}!` : `Welcome, ${vendorShop.name}! 👋`, 'success');
                } else {
                    showToast(data.error || 'Invalid credentials', 'error');
                    loginBtn.disabled = false;
                    loginBtn.textContent = t('login');
                }
            } catch (e) {
                showToast('Network error. Please try again.', 'error');
                loginBtn.disabled = false;
                loginBtn.textContent = t('login');
            }
        });
    }
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
// Password show/hide toggle — works on mobile (iOS + Android)
function initPasswordToggles(container) {
    (container || document).querySelectorAll('.eye-toggle-btn').forEach(btn => {
        const targetId = btn.dataset.target;
        const input = (container || document).getElementById(targetId);
        if (!input) return;

        function toggle(e) {
            e.preventDefault();
            e.stopPropagation();
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            btn.textContent = isHidden ? '🙈' : '👁️';
            // Keep focus on input so keyboard stays open on mobile
            input.focus();
        }

        btn.addEventListener('click', toggle);
        btn.addEventListener('touchend', toggle, { passive: false });
    });
}
window.initPasswordToggles = initPasswordToggles;

// Change language
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    updateHeaderLanguageSelector();
    updateNavigationLabels();
    // Re-render current page
    navigateTo(currentPage);
}

// Make navigateTo and changeLanguage available globally
window.navigateTo = navigateTo;
window.changeLanguage = changeLanguage;

// Load saved language preference
function loadLanguagePreference() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
    }
}

// ===== Location Picker Functions =====

function updateLocationButtonText() {
    const btnText = document.getElementById('location-btn-text');
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
    document.getElementById('location-btn').classList.add('active');

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
    document.getElementById('location-btn').classList.remove('active');
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
                <span class="location-item-emoji">🏛️</span>
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
                <span class="location-item-emoji">🌐</span>
                <span class="location-item-name">${t('allAreas')}</span>
            </div>
            <span class="location-item-arrow">✓</span>
        </div>
    `;

    itemsHTML += areas.map(area => `
        <div class="location-item ${selectedArea === area ? 'selected' : ''}" onclick="selectAreaItem('${area.replace(/'/g, "\\'")}')">
            <div class="location-item-left">
                <span class="location-item-emoji">📍</span>
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

    // Re-render current page with location filter
    if (currentPage === 'home') {
        renderHomePage();
    } else if (currentPage === 'search') {
        renderSearchPage();
    }

    const displayName = area === 'All Areas'
        ? getDistrictName(selectedDistrict)
        : `${getAreaName(area)}, ${getDistrictName(selectedDistrict)}`;
    showToast(`📍 ${displayName}`, 'success');
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
                    <span class="location-item-emoji">🏛️</span>
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
                        <span class="location-item-emoji">🌐</span>
                        <span class="location-item-name">${t('allAreas')}</span>
                    </div>
                    <span class="location-item-arrow">✓</span>
                </div>
            `;
        }

        itemsHTML += areas.map(area => `
            <div class="location-item ${selectedArea === area ? 'selected' : ''}" onclick="selectAreaItem('${area.replace(/'/g, "\\'")}')">
                <div class="location-item-left">
                    <span class="location-item-emoji">📍</span>
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

// Expose location functions globally
window.openLocationPicker = openLocationPicker;
window.closeLocationPicker = closeLocationPicker;
window.selectDistrictItem = selectDistrictItem;
window.selectAreaItem = selectAreaItem;
window.goBackToDistricts = goBackToDistricts;
window.filterLocationList = filterLocationList;