// State
let stalls = [];
let currentPage = 'home';
let selectedCategory = 'All';
let searchQuery = '';
let vendorShop = null;
let currentLanguage = 'en';
let userLocation = null; // User's selected city/area

// For GitHub Pages static deployment - data stored in localStorage
const DATA_KEY = 'streetbite_stalls';

// Tamil Nadu cities and major areas
const tamilNaduLocations = {
    'Chennai': ['T Nagar', 'Anna Nagar', 'Adyar', 'Mylapore', 'Vadapalani', 'Porur', 'Velachery', 'Tambaram', 'Chromepet', 'Guindy', 'Egmore', 'Nungambakkam', 'Ashok Nagar', 'Kodambakkam', 'Royapettah', 'Triplicane', 'Perambur', 'Kilpauk', 'Saidapet', 'Madipakkam'],
    'Coimbatore': ['RS Puram', 'Saibaba Colony', 'Gandhipuram', 'Peelamedu', 'Singanallur', 'Kalapatti', 'Vadavalli', 'Kuniyamuthur', 'Ukkadam', 'Race Course', 'Ram Nagar', 'Sungam'],
    'Madurai': ['Anna Nagar', 'KK Nagar', 'Goripalayam', 'Tallakulam', 'Villapuram', 'Bibipuram', 'Arappalayam', 'Mattuthavani', 'Thiruparankundram'],
    'Tiruchirappalli': ['Cantonment', 'Golden Rock', 'Woraiyur', 'Srirangam', 'Thillai Nagar', 'K K Nagar', 'Ariyamangalam'],
    'Salem': ['New Fairlands', 'Gugai', 'Suramangalam', 'Omalur', 'Hasthampatti', 'Shevapet', 'Meyyanur'],
    'Tiruppur': ['Gandhinagar', 'Kumarapalayam', 'Palladam Road', 'New Colony', 'Sidhapudur'],
    'Erode': ['Perundurai Road', 'Surampatti', 'Kasipalayam', 'Vellakinar', 'Gobichettipalayam'],
    'Vellore': ['Katpadi', 'Anna Nagar', 'Ranipet', 'Gandhi Nagar', 'Chittoor Road'],
    'Thoothukudi': ['Korampallam', 'Vilathikulam', 'Tiruchendur Road', 'Sippikulam'],
    'Thanjavur': ['New Bus Stand', 'Salai Road', 'Woraiyur Road', 'Pattukottai Road'],
    'Dindigul': ['Anna Nagar', 'Gandhi Nagar', 'Reddiyar Colony', 'Athoor'],
    'Kanchipuram': ['Gandhi Nagar', 'Kamakoti Nagar', 'Mambakkam', 'Saidapet'],
    'Hosur': ['Krishnagiri Road', 'Electronic City', 'Shoolagiri', 'Denkanikottai Road'],
    'Karur': ['Kamaraj Road', 'Pugal Road', 'Aravakurichi'],
    'Ramanathapuram': ['R S Mangalam', 'Paramakudi', 'Mudukulathur'],
    'Tirunelveli': ['Palayamkottai', 'Gandhi Nagar', 'Anna Nagar', 'Chidambaranar Nagar'],
    'Cuddalore': ['Chidambaram', 'Panruti', 'Virudhachalam'],
    'Nagercoil': ['Vadasery', 'Kottar', 'Aralvaimozhi'],
    'Kumbakonam': ['Suriyanar Kovil', 'Patteswaram', 'Thirunageswaram'],
    'Ooty': ['Charing Cross', 'Bazaar', 'Coonoor Road', 'Pykara'],
    'Kodaikanal': ['Lake Road', 'Vattakanal', 'Berijam Road'],
    'Pondicherry': ['White Town', 'Lawpet', 'Kuruchikuppam', 'Ariyankuppam']
};

// Initialize with default data if empty
async function initializeData() {
    const stored = localStorage.getItem(DATA_KEY);
    if (stored) {
        stalls = JSON.parse(stored);
    } else {
        // Load default data from stalls.json
        await loadDefaultData();
    }
}

async function loadDefaultData() {
    try {
        const response = await fetch('data/stalls.json');
        const data = await response.json();
        // Extract the stalls array from the loaded data
        stalls = data.stalls || [];
        saveData();
    } catch (error) {
        console.error('Error loading default data:', error);
        stalls = [];
    }
}

function saveData() {
    localStorage.setItem(DATA_KEY, JSON.stringify(stalls));
}

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
        categoryDosa: '🥞 Dosa',
        categoryBiryani: '🍚 Biryani',
        categoryRolls: '🌯 Rolls',
        categoryBajji: '🫓 Bajji',
        categoryJuice: '🧃 Juice',
        categoryChinese: '🍜 Chinese',
        categorySnacks: '🍿 Snacks',
        toggleOpen: '✓ Open',
        toggleClosed: '✕ Closed',
        // Location selector modal
        selectYourLocation: '📍 Select Your Location',
        chooseCitySubtitle: 'Choose your city to find local street food shops nearby',
        searchCityPlaceholder: '🔍 Search city name...',
        selectAreaIn: 'Select Area in',
        skipAreaShowAll: 'Skip - Show All Shops',
        changeLocation: 'Change',
        shopsNearby: 'Shops near you will appear here',
        selectLocationToFind: 'Select your location to find nearby shops',
        noShopsInLocation: 'No shops found in',
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
        categoryDosa: '🥞 தோசை',
        categoryBiryani: '🍚 பிரியாணி',
        categoryRolls: '🌯 ரோல்ஸ்',
        categoryBajji: '🫓 பஜ்ஜி',
        categoryJuice: '🧃 பழச்சாறு',
        categoryChinese: '🍜 சைனீஸ்',
        categorySnacks: '🍿 சிற்றுண்டி',
        toggleOpen: '✓ திறந்திருக்கிறது',
        toggleClosed: '✕ மூடியிருக்கிறது',
        // Location selector modal
        selectYourLocation: '📍 உங்கள் இடத்தைத் தேர்ந்தெடுக்கவும்',
        chooseCitySubtitle: 'உங்கள் பகுதியில் உள்ள சாலை ஓர உணவுக் கடைகளைக் கண்டறிய உங்கள் நகரத்தைத் தேர்ந்தெடுக்கவும்',
        searchCityPlaceholder: '🔍 நகரப் பெயரைத் தேடுக...',
        selectAreaIn: 'பகுதியைத் தேர்ந்தெடுக்கவும்',
        skipAreaShowAll: 'தவிர் - அனைத்துக் கடைகளையும் காட்டு',
        changeLocation: 'மாற்று',
        shopsNearby: 'உங்கள் அருகிலுள்ள கடைகள் இங்கே தோன்றும்',
        selectLocationToFind: 'அருகிலுள்ள கடைகளைக் கண்டறிய உங்கள் இடத்தைத் தேர்ந்தெடுக்கவும்',
        noShopsInLocation: 'இல்லை எந்தக் கடைகளும் கிடைக்கவில்லை',
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
        categoryDosa: '🥞 दोसा',
        categoryBiryani: '🍚 बिरयानी',
        categoryRolls: '🌯 रोल',
        categoryBajji: '🫓 पकौड़ी',
        categoryJuice: '🧃 जूस',
        categoryChinese: '🍜 चाइनीज',
        categorySnacks: '🍿 नाश्ता',
        toggleOpen: '✓ खुला है',
        toggleClosed: '✕ बंद है',
        // Location selector modal
        selectYourLocation: '📍 अपना स्थान चुनें',
        chooseCitySubtitle: 'अपने क्षेत्र में स्थानीय स्ट्रीट फूड दुकानें खोजने के लिए अपने शहर का चयन करें',
        searchCityPlaceholder: '🔍 शहर का नाम खोजें...',
        selectAreaIn: 'क्षेत्र चुनें',
        skipAreaShowAll: 'छोड़ें - सभी दुकानें दिखाएं',
        changeLocation: 'बदलें',
        shopsNearby: 'आपके पास की दुकानें यहां दिखाई देंगी',
        selectLocationToFind: 'पास की दुकानें खोजने के लिए अपना स्थान चुनें',
        noShopsInLocation: 'कोई दुकान नहीं मिली',
    }
};

// Category emojis
const categoryEmojis = {
    'Dosa': '🥞',
    'Biryani': '🍚',
    'Rolls': '🌯',
    'Bajji': '🫓',
    'Juice': '🧃',
    'Chinese': '🍜',
    'Snacks': '🍿'
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
document.addEventListener('DOMContentLoaded', async () => {
    loadLanguagePreference();
    loadLocationPreference();
    setupNavigation();
    await initializeData();
    // Set default location if none exists - use Chennai with T Nagar as default
    if (!userLocation || !userLocation.city) {
        userLocation = { city: 'Chennai', area: 'T Nagar' };
        saveLocationPreference();
    }
    updateHeaderLocationBadge();
    renderHomePage();
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
        'add': t('addShop'),
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

// Update header location badge
function updateHeaderLocationBadge() {
    const locationText = document.getElementById('header-location-text');
    if (locationText) {
        if (userLocation && userLocation.city) {
            locationText.textContent = userLocation.area ? `${userLocation.area}, ${userLocation.city}` : userLocation.city;
        } else {
            locationText.textContent = 'Select Location';
        }
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

// Load stalls from localStorage (for GitHub Pages static deployment)
function loadStalls() {
    showLoading(true);
    const stored = localStorage.getItem(DATA_KEY);
    if (stored) {
        const data = JSON.parse(stored);
        stalls = data.stalls || data;
    }
    showLoading(false);
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
    updateHeaderLocationBadge();
    updateNavigationLabels();

    const locationBar = userLocation && userLocation.city ? `
        <div class="home-location-bar">
            <div class="home-location-text">
                <span class="location-icon">📍</span>
                <span>${userLocation.area ? userLocation.area + ', ' + userLocation.city : userLocation.city}</span>
            </div>
            <button class="change-location-btn" id="change-location-btn">Change</button>
        </div>
    ` : '';

    app.innerHTML = `
        <div class="page home-page">
            ${locationBar}
            <div class="category-tabs">
                <button class="category-tab ${selectedCategory === 'All' ? 'active' : ''}" data-category="All">${t('all')}</button>
                <button class="category-tab ${selectedCategory === 'Dosa' ? 'active' : ''}" data-category="Dosa">${t('categoryDosa')}</button>
                <button class="category-tab ${selectedCategory === 'Biryani' ? 'active' : ''}" data-category="Biryani">${t('categoryBiryani')}</button>
                <button class="category-tab ${selectedCategory === 'Rolls' ? 'active' : ''}" data-category="Rolls">${t('categoryRolls')}</button>
                <button class="category-tab ${selectedCategory === 'Bajji' ? 'active' : ''}" data-category="Bajji">${t('categoryBajji')}</button>
                <button class="category-tab ${selectedCategory === 'Juice' ? 'active' : ''}" data-category="Juice">${t('categoryJuice')}</button>
                <button class="category-tab ${selectedCategory === 'Chinese' ? 'active' : ''}" data-category="Chinese">${t('categoryChinese')}</button>
                <button class="category-tab ${selectedCategory === 'Snacks' ? 'active' : ''}" data-category="Snacks">${t('categorySnacks')}</button>
            </div>
            <div class="shop-grid" id="shop-grid"></div>
        </div>
    `;

    // Setup change location button
    const changeLocationBtn = document.getElementById('change-location-btn');
    if (changeLocationBtn) {
        changeLocationBtn.addEventListener('click', openLocationSelector);
    }

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

    // Filter by user location (city/area)
    if (userLocation && userLocation.city) {
        if (userLocation.area) {
            // Filter by specific area
            filtered = filtered.filter(s => s.area.toLowerCase() === userLocation.area.toLowerCase());
        } else {
            // Filter by city (check if shop's area is in the selected city's areas)
            const cityAreas = tamilNaduLocations[userLocation.city] || [];
            filtered = filtered.filter(s =>
                cityAreas.some(a => s.area.toLowerCase().includes(a.toLowerCase())) ||
                s.area.toLowerCase() === userLocation.city.toLowerCase()
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

    // Home page: show empty state with one sample shop for understanding
    if (currentPage === 'home' && !searchQuery && selectedCategory === 'All') {
        // Check if user has dismissed the sample shop
        const sampleShopDismissed = localStorage.getItem('sampleShopDismissed') === 'true';
        const sampleShop = filtered[0] || stalls[0]; // Use filtered shop first, then fallback

        if (sampleShop && !sampleShopDismissed) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🍽️</div>
                    <p style="font-size: 1.1rem; color: #666; margin-bottom: 20px;">Welcome to StreetBite!</p>
                    <p style="font-size: 0.9rem; color: #999; margin-bottom: 25px;">Discover the best street food near you</p>
                    <div class="sample-shop-card" style="max-width: 320px; margin: 0 auto; text-align: left; position: relative;">
                        <button class="dismiss-sample-shop" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.1); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 1rem; color: #666; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Dismiss">✕</button>
                        <div class="shop-card" data-id="${sampleShop.id}" style="cursor: pointer;">
                            <div class="shop-card-header">
                                <span class="shop-name">${sampleShop.name}</span>
                                <span class="shop-emoji">${sampleShop.emoji || categoryEmojis[sampleShop.category] || '🍽️'}</span>
                            </div>
                            <span class="shop-category">${sampleShop.category}</span>
                            <div class="shop-area">📍 ${sampleShop.area}</div>
                            <div>
                                <span class="shop-status ${sampleShop.status}">${sampleShop.status === 'open' ? '✓ ' + t('open') : '✕ ' + t('closed')}</span>
                                <span class="shop-rating">⭐ ${sampleShop.rating.toFixed(1)} (${sampleShop.totalReviews})</span>
                            </div>
                            ${sampleShop.todayDiscount ? `<div class="shop-discount">🎉 ${sampleShop.todayDiscount}</div>` : ''}
                        </div>
                    </div>
                    <p style="font-size: 0.85rem; color: #bbb; margin-top: 20px;">${userLocation && userLocation.city ? 'Shops near you will appear here' : 'Tap to explore more shops'}</p>
                </div>
            `;

            // Add click handler for sample shop
            grid.querySelector('.shop-card').addEventListener('click', () => {
                showShopDetail(sampleShop.id);
            });

            // Add dismiss button handler
            grid.querySelector('.dismiss-sample-shop').addEventListener('click', (e) => {
                e.stopPropagation();
                localStorage.setItem('sampleShopDismissed', 'true');
                renderHomePage();
            });
        } else {
            const noLocationMessage = userLocation && userLocation.city
                ? `No shops found in ${userLocation.city}${userLocation.area ? ' - ' + userLocation.area : ''}. Try selecting a different location or category.`
                : 'Select your location to find nearby shops';

            grid.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🍽️</div>
                    <p style="font-size: 1.1rem; color: #666; margin-bottom: 20px;">Welcome to StreetBite!</p>
                    <p style="font-size: 0.9rem; color: #999;">${noLocationMessage}</p>
                </div>
            `;
        }
        return;
    }

    if (filtered.length === 0) {
        const locationFilterMsg = userLocation && userLocation.city
            ? `No shops found in ${userLocation.city}${userLocation.area ? ' - ' + userLocation.area : ''}`
            : t('noShopsFound');
        grid.innerHTML = `
            <div class="empty-state">
                <div class="icon">🔍</div>
                <p>${locationFilterMsg}</p>
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
                <button class="category-tab ${selectedCategory === 'Dosa' ? 'active' : ''}" data-category="Dosa">${t('categoryDosa')}</button>
                <button class="category-tab ${selectedCategory === 'Biryani' ? 'active' : ''}" data-category="Biryani">${t('categoryBiryani')}</button>
                <button class="category-tab ${selectedCategory === 'Rolls' ? 'active' : ''}" data-category="Rolls">${t('categoryRolls')}</button>
                <button class="category-tab ${selectedCategory === 'Bajji' ? 'active' : ''}" data-category="Bajji">${t('categoryBajji')}</button>
                <button class="category-tab ${selectedCategory === 'Juice' ? 'active' : ''}" data-category="Juice">${t('categoryJuice')}</button>
                <button class="category-tab ${selectedCategory === 'Chinese' ? 'active' : ''}" data-category="Chinese">${t('categoryChinese')}</button>
                <button class="category-tab ${selectedCategory === 'Snacks' ? 'active' : ''}" data-category="Snacks">${t('categorySnacks')}</button>
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
                        <span>${stall.address}</span>
                    </div>
                    <div class="info-row">
                        <span class="icon">📞</span>
                        <a href="tel:${stall.contact}">${stall.contact}</a>
                    </div>
                    <div class="info-row">
                        <span class="icon">⭐</span>
                        <span>${stall.rating.toFixed(1)} ${t('rating')} (${stall.totalReviews})</span>
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
                ${stall.menu.map(item => `
                    <div class="menu-item ${!item.available ? 'menu-item-unavailable' : ''}">
                        <div class="menu-item-info">
                            <div class="menu-item-name">${item.itemName}</div>
                            <div class="menu-item-price">₹${item.price}</div>
                        </div>
                        <span class="availability-toggle ${item.available ? 'available' : 'unavailable'}" style="cursor: default; transform: none;">${item.available ? 'ON' : 'OFF'}</span>
                    </div>
                `).join('')}
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

    // Setup submit review (localStorage version)
    app.querySelector('#submit-review').addEventListener('click', () => {
        const comment = app.querySelector('#review-text').value.trim();
        if (!comment || selectedRating === 0) {
            showToast('Please select a rating and write a review', 'error');
            return;
        }

        // Find and update the stall in localStorage
        const stallIndex = stalls.findIndex(s => s.id === stall.id);
        if (stallIndex !== -1) {
            const newReview = {
                rating: selectedRating,
                comment: comment,
                date: new Date().toISOString().split('T')[0]
            };
            stalls[stallIndex].reviews.push(newReview);

            // Update rating
            const reviews = stalls[stallIndex].reviews;
            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            stalls[stallIndex].rating = Math.round(avgRating * 10) / 10;
            stalls[stallIndex].totalReviews = reviews.length;

            saveData();
            showToast('Review submitted!', 'success');
            renderShopDetailPage(stalls[stallIndex]);
        }
    });
}

// Render Add Shop Page
function renderAddShopPage() {
    const app = document.getElementById('app');
    let menuItems = [];

    app.innerHTML = `
        <div class="page add-shop-page">
            <h2 class="section-title">${t('addNewShop')}</h2>

            <div class="form-section">
                <div class="form-group">
                    <label>${t('shopName')} *</label>
                    <input type="text" id="shop-name" placeholder="${t('shopNamePlaceholder')}" required>
                </div>

                <div class="form-group">
                    <label>${t('foodCategory')} *</label>
                    <select id="shop-category">
                        <option value="">${t('selectCategory')}</option>
                        <option value="Dosa">${t('categoryDosa')}</option>
                        <option value="Biryani">${t('categoryBiryani')}</option>
                        <option value="Rolls">${t('categoryRolls')}</option>
                        <option value="Bajji">${t('categoryBajji')}</option>
                        <option value="Juice">${t('categoryJuice')}</option>
                        <option value="Chinese">${t('categoryChinese')}</option>
                        <option value="Snacks">${t('categorySnacks')}</option>
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

    // Add menu item
    app.querySelector('#add-menu-item').addEventListener('click', () => {
        const name = app.querySelector('#menu-item-name').value.trim();
        const price = parseInt(app.querySelector('#menu-item-price').value);

        if (!name || !price) {
            showToast('Please enter item name and price', 'error');
            return;
        }

        menuItems.push({ itemName: name, price, available: true });
        app.querySelector('#menu-item-name').value = '';
        app.querySelector('#menu-item-price').value = '';
        renderMenuList();
    });

    function renderMenuList() {
        const list = app.querySelector('#added-menu-list');
        if (menuItems.length === 0) {
            list.innerHTML = `<p style="color: #999; text-align: center;">${t('noItemsAdded')}</p>`;
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

    // Submit shop (static version for GitHub Pages)
    app.querySelector('#submit-shop').addEventListener('click', () => {
        const name = app.querySelector('#shop-name').value.trim();
        const category = app.querySelector('#shop-category').value;
        const area = app.querySelector('#shop-area').value.trim();
        const address = app.querySelector('#shop-address').value.trim();
        const contact = app.querySelector('#shop-contact').value.trim();
        const discount = app.querySelector('#shop-discount').value.trim();
        const openTime = app.querySelector('#open-time').value;
        const closeTime = app.querySelector('#close-time').value;

        if (!name || !category || !area || !contact) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (menuItems.length === 0) {
            showToast('Please add at least one menu item', 'error');
            return;
        }

        // Generate new ID
        const maxId = stalls.length > 0 ? Math.max(...stalls.map(s => s.id)) : 0;

        const newStall = {
            id: maxId + 1,
            name,
            category,
            area,
            address: address || `${area}, Chennai`,
            contact,
            openTime,
            closeTime,
            todayDiscount: discount || null,
            menu: menuItems,
            status: 'closed',
            rating: 0,
            totalReviews: 0,
            reviews: [],
            emoji: categoryEmojis[category] || '🍽️'
        };

        stalls.push(newStall);
        saveData();

        showToast('Shop added successfully!', 'success');
        loadStalls();
        navigateTo('home');
    });
}

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

        // Setup status toggle (static version)
        app.querySelector('#status-toggle').addEventListener('click', () => {
            const newStatus = vendorShop.status === 'open' ? 'closed' : 'open';
            const stallIndex = stalls.findIndex(s => s.id === vendorShop.id);
            if (stallIndex !== -1) {
                stalls[stallIndex].status = newStatus;
                vendorShop.status = newStatus;
                saveData();
                renderProfilePage();
                showToast(`Shop is now ${newStatus}`, 'success');
            }
        });

        // Update discount - support both click and Enter key (static version)
        const discountInput = app.querySelector('#vendor-discount');
        const updateDiscountBtn = app.querySelector('#update-discount');

        const updateDiscount = () => {
            const discount = app.querySelector('#vendor-discount').value.trim();
            const stallIndex = stalls.findIndex(s => s.id === vendorShop.id);
            if (stallIndex !== -1) {
                stalls[stallIndex].todayDiscount = discount || null;
                vendorShop.todayDiscount = discount || null;
                saveData();
                showToast('Discount updated!', 'success');
            }
        };

        updateDiscountBtn.addEventListener('click', updateDiscount);
        discountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                updateDiscount();
            }
        });

        // Menu availability toggles (localStorage version)
        app.querySelectorAll('.availability-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const index = parseInt(toggle.dataset.index);
                const stallIndex = stalls.findIndex(s => s.id === vendorShop.id);

                if (stallIndex !== -1) {
                    // Toggle availability
                    stalls[stallIndex].menu[index].available = !stalls[stallIndex].menu[index].available;
                    vendorShop.menu[index].available = stalls[stallIndex].menu[index].available;

                    // Save to localStorage
                    saveData();
                    renderProfilePage();
                    showToast('Menu updated!', 'success');
                }
            });
        });

        // Logout
        app.querySelector('#logout-btn').addEventListener('click', () => {
            vendorShop = null;
            localStorage.removeItem('vendorShopId');
            renderProfilePage();
            showToast('Logged out', 'success');
        });

        // Add new item handler (localStorage version)
        app.querySelector('#add-new-item-btn').addEventListener('click', () => {
            const itemName = app.querySelector('#new-item-name').value.trim();
            const price = parseInt(app.querySelector('#new-item-price').value);

            if (!itemName || !price) {
                showToast('Please enter item name and price', 'error');
                return;
            }

            const stallIndex = stalls.findIndex(s => s.id === vendorShop.id);
            if (stallIndex !== -1) {
                // Add new item to localStorage
                stalls[stallIndex].menu.push({ itemName, price, available: true });
                vendorShop.menu.push({ itemName, price, available: true });

                // Save to localStorage
                saveData();
                app.querySelector('#new-item-name').value = '';
                app.querySelector('#new-item-price').value = '';
                renderProfilePage();
                showToast('New item added to menu!', 'success');
            }
        });

    } else {
        // Login form - check for persistent login
        let savedShopId = localStorage.getItem('vendorShopId');

        // Auto-login if saved shop ID exists
        if (savedShopId) {
            const shop = stalls.find(s => s.id === parseInt(savedShopId));
            if (shop) {
                vendorShop = shop;
                renderProfilePage();
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

                        <button class="submit-btn" id="vendor-login-btn">${t('login')}</button>
                    </div>

                    <div style="text-align: center; margin-top: 30px; color: #666;">
                        <p>${t('noShopListed')}</p>
                        <button class="submit-btn" onclick="navigateTo('add')" style="margin-top: 10px; background: #28a745;">${t('addYourShop')}</button>
                    </div>
                </div>
            </div>
        `;

        let selectedShopId = null;
        const searchInput = app.querySelector('#shop-search-input');
        const resultsDropdown = app.querySelector('#shop-search-results');

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

        // Login (localStorage version)
        app.querySelector('#vendor-login-btn').addEventListener('click', () => {
            if (!selectedShopId) {
                showToast(currentLanguage === 'ta' ? 'தயவுசெய்து உங்கள் கடையைத் தேர்வுசெய்க' : currentLanguage === 'hi' ? 'कृपया अपनी दुकान चुनें' : 'Please select your shop from the list', 'error');
                searchInput.focus();
                return;
            }

            const contact = app.querySelector('#vendor-contact').value.trim();

            if (!contact) {
                showToast(currentLanguage === 'ta' ? 'தொடர்பு எண்ணை உள்ளிடுக' : currentLanguage === 'hi' ? 'संपर्क नंबर डालें' : 'Please enter contact number', 'error');
                return;
            }

            // Find shop and verify contact number (localStorage version)
            const shop = stalls.find(s => s.id === selectedShopId);

            if (shop) {
                if (shop.contact === contact) {
                    vendorShop = shop;
                    localStorage.setItem('vendorShopId', selectedShopId);
                    renderProfilePage();
                    showToast(currentLanguage === 'ta' ? `வரவேற்கிறோம், ${vendorShop.name}!` : currentLanguage === 'hi' ? `स्वागत है, ${vendorShop.name}!` : `Welcome, ${vendorShop.name}!`, 'success');
                } else {
                    showToast(currentLanguage === 'ta' ? 'தொடர்பு எண் பொருந்தவில்லை' : currentLanguage === 'hi' ? 'संपर्क नंबर मेल नहीं खाता' : 'Contact number does not match', 'error');
                }
            } else {
                showToast(currentLanguage === 'ta' ? 'கடை கிடைக்கவில்லை' : currentLanguage === 'hi' ? 'दुकान नहीं मिली' : 'Shop not found', 'error');
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
window.openLocationSelector = openLocationSelector;

// Load saved language preference
function loadLanguagePreference() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
    }
}

// Load saved location preference
function loadLocationPreference() {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
        userLocation = JSON.parse(savedLocation);
    }
}

// Save location preference
function saveLocationPreference() {
    if (userLocation) {
        localStorage.setItem('userLocation', JSON.stringify(userLocation));
    }
    updateHeaderLocationBadge();
}


// Show location selector modal
function showLocationModal() {
    const modal = document.getElementById('location-modal');
    if (modal) {
        // Apply translations to modal elements
        const modalTitle = document.getElementById('location-modal-title');
        const modalSubtitle = document.getElementById('location-modal-subtitle');
        const areaTitlePrefix = document.getElementById('area-title-prefix');
        const citySearch = document.getElementById('city-search');
        const skipBtn = document.getElementById('skip-area-btn');

        if (modalTitle) modalTitle.textContent = t('selectYourLocation');
        if (modalSubtitle) modalSubtitle.textContent = t('chooseCitySubtitle');
        if (areaTitlePrefix) areaTitlePrefix.textContent = t('selectAreaIn');
        if (citySearch) citySearch.placeholder = t('searchCityPlaceholder');
        if (skipBtn) skipBtn.textContent = t('skipAreaShowAll');

        modal.classList.add('active');
        renderCityList();
        setupModalHandlers();
    }
}

// Close location modal
function closeLocationModal() {
    const modal = document.getElementById('location-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Render city list
function renderCityList(filter = '') {
    const cityList = document.getElementById('city-list');
    if (!cityList) return;

    const cities = Object.keys(tamilNaduLocations);
    const filteredCities = filter
        ? cities.filter(c => c.toLowerCase().includes(filter.toLowerCase()))
        : cities;

    cityList.innerHTML = filteredCities.map(city => `
        <div class="city-item ${userLocation && userLocation.city === city ? 'active' : ''}" data-city="${city}">
            <span class="city-icon">🏙️</span>
            <span>${city}</span>
        </div>
    `).join('');

    // Add click handlers
    cityList.querySelectorAll('.city-item').forEach(item => {
        item.addEventListener('click', () => {
            const selectedCity = item.dataset.city;
            selectCity(selectedCity);
        });
    });
}

// Select city and show areas
function selectCity(city) {
    userLocation = { city: city, area: null };
    document.getElementById('selected-city-name').textContent = city;
    document.getElementById('area-title-prefix').textContent = t('selectAreaIn');
    document.getElementById('area-section').style.display = 'block';

    // Render area list
    const areas = tamilNaduLocations[city] || [];
    const areaList = document.getElementById('area-list');
    areaList.innerHTML = areas.map(area => `
        <div class="area-item" data-area="${area}">${area}</div>
    `).join('');

    // Add click handlers for areas
    areaList.querySelectorAll('.area-item').forEach(item => {
        item.addEventListener('click', () => {
            const selectedArea = item.dataset.area;
            userLocation.area = selectedArea;
            saveLocationPreference();
            closeLocationModal();
            renderHomePage();
            showToast(`Location set to ${city} - ${selectedArea}`, 'success');
        });
    });

    // Highlight selected city
    document.querySelectorAll('.city-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`.city-item[data-city="${city}"]`).classList.add('active');
}

// Setup modal event handlers
function setupModalHandlers() {
    // Close button
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            if (userLocation && userLocation.city) {
                closeLocationModal();
            } else {
                // If no city selected, show all shops
                userLocation = { city: null, area: null };
                saveLocationPreference();
                closeLocationModal();
                renderHomePage();
            }
        };
    }

    // Skip area button
    const skipBtn = document.getElementById('skip-area-btn');
    if (skipBtn) {
        skipBtn.onclick = () => {
            saveLocationPreference();
            closeLocationModal();
            renderHomePage();
            showToast(`Showing all shops in ${userLocation.city}`, 'success');
        };
    }

    // City search
    const searchInput = document.getElementById('city-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderCityList(e.target.value);
        });
    }

    // Close on overlay click
    const modal = document.getElementById('location-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (userLocation && userLocation.city) {
                closeLocationModal();
            }
        }
    });
}

// Open location modal for changing location
function openLocationSelector() {
    showLocationModal();
    // Reset area section display
    if (userLocation && userLocation.city) {
        document.getElementById('selected-city-name').textContent = userLocation.city;
        document.getElementById('area-section').style.display = 'block';
        const areas = tamilNaduLocations[userLocation.city] || [];
        const areaList = document.getElementById('area-list');
        areaList.innerHTML = areas.map(area => `
            <div class="area-item ${userLocation.area === area ? 'active' : ''}" data-area="${area}">${area}</div>
        `).join('');

        // Add click handlers for areas
        areaList.querySelectorAll('.area-item').forEach(item => {
            item.addEventListener('click', () => {
                const selectedArea = item.dataset.area;
                userLocation.area = selectedArea;
                saveLocationPreference();
                closeLocationModal();
                renderHomePage();
                showToast(`Location updated to ${userLocation.city} - ${selectedArea}`, 'success');
            });
        });
    }
}
