export type Language = 'en' | 'ta' | 'hi';

export const SUPPORTED_LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    'brand.name': 'NextGen Justice',
    'brand.subtitle': 'Legal Aid & Case Intelligence',
    'nav.home': 'Overview',
    'nav.cases': 'Case Files',
    'nav.documents': 'Document Center',
    'nav.advocates': 'Advocate Directory',
    'nav.assistant': 'Legal AI Assistant',
    'nav.settings': 'My Profile',
    'nav.admin': 'Administration',
    'nav.login': 'Sign In',
    'nav.register': 'Register as Citizen',
    'nav.logout': 'Sign Out',

    // Landing Page
    'hero.badge': 'Institutional Legal Access Platform',
    'hero.title': 'Transparent Legal Aid, Intelligent Case Management & Grounded AI',
    'hero.description': 'An enterprise-grade platform connecting citizens with verified advocates across Tamil Nadu, powering multi-format document extraction, and providing grounded legal intelligence without hallucination.',
    'hero.cta.start': 'Register / Get Started',
    'hero.cta.explore': 'Explore Advocate Directory',
    'hero.stat.advocates': 'Seeded Verified Advocates',
    'hero.stat.districts': 'Districts in Tamil Nadu',
    'hero.stat.grounding': 'Document-Grounded RAG',

    // Workflow Section
    'workflow.title': 'End-to-End Case Lifecycle',
    'workflow.step1.title': '1. Citizen Matter Intake',
    'workflow.step1.desc': 'Register your case, define jurisdiction in Madurai, Chennai, or across Tamil Nadu, and state key facts in plain language.',
    'workflow.step2.title': '2. Document AI Processing',
    'workflow.step2.desc': 'Upload PDF, DOCX, or TXT agreements, notices, or court summons. Automated extraction identifies parties, deadlines, and claims.',
    'workflow.step3.title': '3. Fact Review & Approval',
    'workflow.step3.desc': 'Inspect extracted legal facts before applying them to your authoritative case record. Nothing is hallucinated.',
    'workflow.step4.title': '4. Advocate Discovery & Matching',
    'workflow.step4.desc': 'Discover legal advocates ranked by transparent practice area, district proximity, language, and consultation mode scoring.',
    'workflow.step5.title': '5. Grounded AI Assistance',
    'workflow.step5.desc': 'Ask questions about your uploaded documents or general Indian statutes with exact chunk citations and page references.',

    // Limitations Notice
    'disclaimer.title': 'Institutional Limitations & Academic Prototype Notice',
    'disclaimer.text': 'NextGen Justice is an academic engineering demonstration platform for Indian legal aid and case intelligence. It does not provide certified attorney-client privilege, guarantee court outcomes, or replace professional legal representation.',

    // Common Buttons & Labels
    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.upload': 'Upload Document',
    'common.search': 'Search by keyword, advocate, or case...',
    'common.loading': 'Processing request...',
    'common.viewDetails': 'View Details',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.actions': 'Actions',
    'common.download': 'Download File',
    'common.delete': 'Delete',

    // Dashboards
    'dashboard.welcome': 'Welcome back',
    'dashboard.cases.title': 'Your Active Case Files',
    'dashboard.documents.title': 'Recent Document Analysis',
    'dashboard.recommended.title': 'Recommended Advocates in Your District',
    'dashboard.quickActions': 'Quick Actions',

    // Legal Assistant
    'assistant.mode.general': 'Mode A: General Indian Legal Knowledge',
    'assistant.mode.case': 'Mode B: Private Case & Document Assistant',
    'assistant.disclaimer': 'Answers are strictly grounded in verified Indian statutes or your uploaded documents. Citations are displayed below each response.',
    'assistant.placeholder': 'Ask a question regarding your uploaded document or Indian legal procedure...',
    'assistant.send': 'Submit Inquiry',

    // Profile Settings
    'profile.title': 'Citizen Profile & Location Preferences',
    'profile.subtitle': 'Manage your residential location, contact details, and preferred consultation modes for accurate advocate matching.',
    'profile.state': 'State of Residence',
    'profile.district': 'District',
    'profile.city': 'City / Town',
    'profile.pincode': 'Postal PIN Code',
    'profile.language': 'Preferred Language',
    'profile.mode': 'Preferred Consultation Mode',
  },
  ta: {
    // Brand & Header
    'brand.name': 'நெக்ஸ்ட்ஜென் ஜஸ்டிஸ்',
    'brand.subtitle': 'சட்ட உதவி மற்றும் வழக்கு நுண்ணறிவு',
    'nav.home': 'முகப்பு',
    'nav.cases': 'வழக்கு கோப்புகள்',
    'nav.documents': 'ஆவண மையம்',
    'nav.advocates': 'வழக்கறிஞர் பட்டியல்',
    'nav.assistant': 'சட்ட AI உதவியாளர்',
    'nav.settings': 'என் சுயவிவரம்',
    'nav.admin': 'நிர்வாகம்',
    'nav.login': 'உள்நுழைவு',
    'nav.register': 'குடிமக்கள் பதிவு',
    'nav.logout': 'வெளியேறு',

    // Landing Page
    'hero.badge': 'நிறுவன சட்ட உதவி தளம்',
    'hero.title': 'வெளிப்படையான சட்ட உதவி, நவீன வழக்கு மேலாண்மை மற்றும் நம்பகமான AI',
    'hero.description': 'தமிழ்நாடு முழுவதும் உள்ள பதிவுசெய்த வழக்கறிஞர்களை அணுகவும், ஆவணங்களிலிருந்து தகவல்களை பிழையின்றி பிரித்தெடுக்கவும், மற்றும் நம்பகமான சட்ட நுண்ணறிவை வழங்கவும் உருவான தளம்.',
    'hero.cta.start': 'பதிவு செய்க / தொடங்குக',
    'hero.cta.explore': 'வழக்கறிஞர் பட்டியலைக் காண்க',
    'hero.stat.advocates': 'சரிபார்க்கப்பட்ட மாதிரி வழக்கறிஞர்கள்',
    'hero.stat.districts': 'தமிழ்நாடு மாவட்டங்கள்',
    'hero.stat.grounding': 'ஆவண ஆதார அடிப்படையிலான RAG',

    // Workflow Section
    'workflow.title': 'முழுமையான வழக்கு முறைமை',
    'workflow.step1.title': '1. வழக்கு பதிவு',
    'workflow.step1.desc': 'மதுரை, சென்னை அல்லது தமிழ்நாடு மாவட்டங்களில் உங்கள் வழக்கை எளிய மொழியில் பதிவு செய்யுங்கள்.',
    'workflow.step2.title': '2. ஆவண AI செயலாக்கம்',
    'workflow.step2.desc': 'PDF, DOCX அல்லது TXT ஒப்பந்தங்கள், நோட்டீஸ்கள் மற்றும் நீதிமன்ற அழைப்பாணைகளை பதிவேற்றி தகவல்களைப் பெறுங்கள்.',
    'workflow.step3.title': '3. தகவல் மதிப்பாய்வு மற்றும் ஒப்புதல்',
    'workflow.step3.desc': 'பிரித்தெடுக்கப்பட்ட சட்ட உண்மைகளை சரிபார்த்து உங்கள் வழக்கின் அதிகாரப்பூர்வ பதிவில் இணைக்கவும்.',
    'workflow.step4.title': '4. வழக்கறிஞர் தேர்வு & பொருத்தம்',
    'workflow.step4.desc': 'சட்டப் பிரிவு, மாவட்ட தூரம், மொழி மற்றும் ஆலோசனை முறை ஆகியவற்றின் அடிப்படையில் வழக்கறிஞர்களைக் கண்டறியுங்கள்.',
    'workflow.step5.title': '5. ஆதார அடிப்படையிலான AI உதவி',
    'workflow.step5.desc': 'உங்கள் ஆவணங்கள் மற்றும் இந்திய சட்டங்கள் பற்றி துல்லியமான மேற்கோள்களுடன் கேள்வி கேளுங்கள்.',

    // Limitations Notice
    'disclaimer.title': 'நிறுவன வரம்புகள் மற்றும் கல்வி முன்மாதிரி அறிவிப்பு',
    'disclaimer.text': 'நெக்ஸ்ட்ஜென் ஜஸ்டிஸ் என்பது கல்வி மற்றும் பொறியியல் பயன்பாட்டிற்கான சட்ட உதவி முன்மாதிரி தளமாகும். இது தகுதிவாய்ந்த வழக்கறிஞரின் நேரடி சட்ட ஆலோசனைக்கு மாற்றாகாது.',

    // Common Buttons & Labels
    'common.save': 'மாற்றங்களைச் சேமிக்க',
    'common.cancel': 'ரத்து செய்க',
    'common.upload': 'ஆவணம் பதிவேற்று',
    'common.search': 'வழக்கறிஞர் அல்லது வழக்கை தேடுக...',
    'common.loading': 'செயலாக்கப்படுகிறது...',
    'common.viewDetails': 'விவரங்களைக் காண்க',
    'common.status': 'நிலை',
    'common.date': 'தேதி',
    'common.actions': 'செயல்கள்',
    'common.download': 'பதிவிறக்குக',
    'common.delete': 'நீக்குக',

    // Dashboards
    'dashboard.welcome': 'மீண்டும் வருக',
    'dashboard.cases.title': 'உங்கள் செயலில் உள்ள வழக்குகள்',
    'dashboard.documents.title': 'சமீபத்திய ஆவண பகுப்பாய்வு',
    'dashboard.recommended.title': 'உங்கள் மாவட்டத்தில் பரிந்துரைக்கப்படும் வழக்கறிஞர்கள்',
    'dashboard.quickActions': 'விரைவு செயல்கள்',

    // Legal Assistant
    'assistant.mode.general': 'முறை A: பொதுவான இந்திய சட்ட அறிவு',
    'assistant.mode.case': 'முறை B: தனிப்பட்ட வழக்கு & ஆவண உதவியாளர்',
    'assistant.disclaimer': 'பதில்கள் இந்திய சட்டங்கள் அல்லது நீங்கள் பதிவேற்றிய ஆவணங்களின் அடிப்படையில் மட்டுமே வழங்கப்படுகின்றன.',
    'assistant.placeholder': 'உங்கள் ஆவணம் அல்லது இந்திய சட்ட நடைமுறைகள் பற்றி கேளுங்கள்...',
    'assistant.send': 'கேள்வியை அனுப்புக',

    // Profile Settings
    'profile.title': 'குடிமகன் சுயவிவரம் மற்றும் இருப்பிட விருப்பங்கள்',
    'profile.subtitle': 'சரியான வழக்கறிஞர் பரிந்துரைக்காக உங்கள் மாவட்டம், ஊர் மற்றும் தொடர்பு விவரங்களை நிர்வகிக்கவும்.',
    'profile.state': 'மாநிலம்',
    'profile.district': 'மாவட்டம்',
    'profile.city': 'நகரம் / ஊர்',
    'profile.pincode': 'அஞ்சல் குறியீட்டு எண்',
    'profile.language': 'விருப்பமான மொழி',
    'profile.mode': 'விருப்பமான ஆலோசனை முறை',
  },
  hi: {
    // Brand & Header
    'brand.name': 'नेक्स्टजेन जस्टिस',
    'brand.subtitle': 'कानूनी सहायता एवं केस इंटेलिजेंस',
    'nav.home': 'मुख्य पृष्ठ',
    'nav.cases': 'केस फाइलें',
    'nav.documents': 'दस्तावेज़ केंद्र',
    'nav.advocates': 'अधिवक्ता निर्देशिका',
    'nav.assistant': 'कानूनी एआई सहायक',
    'nav.settings': 'मेरी प्रोफ़ाइल',
    'nav.admin': 'प्रशासन',
    'nav.login': 'लॉग इन करें',
    'nav.register': 'नागरिक पंजीकरण',
    'nav.logout': 'लॉग आउट',

    // Landing Page
    'hero.badge': 'संस्थागत कानूनी पहुंच मंच',
    'hero.title': 'पारदर्शी कानूनी सहायता, आधुनिक केस प्रबंधन और प्रामाणिक AI',
    'hero.description': 'तमिलनाडु भर के सत्यापित अधिवक्ताओं से जुड़ें, दस्तावेज़ों से स्वचालित रूप से जानकारी निकालें और सटीक कानूनी मार्गदर्शन प्राप्त करें।',
    'hero.cta.start': 'शुरू करें / पंजीकरण',
    'hero.cta.explore': 'अधिवक्ता सूची देखें',
    'hero.stat.advocates': 'सत्यापित नमूना अधिवक्ता',
    'hero.stat.districts': 'तमिलनाडु के जिले',
    'hero.stat.grounding': 'दस्तावेज़-आधारित RAG',

    // Workflow Section
    'workflow.title': 'सम्पूर्ण केस प्रबंधन प्रक्रिया',
    'workflow.step1.title': '1. केस पंजीकरण',
    'workflow.step1.desc': 'मदुरै, चेन्नई या तमिलनाडु के अन्य जिलों में अपना मामला सरल भाषा में दर्ज करें।',
    'workflow.step2.title': '2. दस्तावेज़ AI विश्लेषण',
    'workflow.step2.desc': 'PDF, DOCX या TXT दस्तावेज़ अपलोड करें। प्रणाली मुख्य पक्षों, तिथियों और दावों की पहचान करती है।',
    'workflow.step3.title': '3. तथ्यों की समीक्षा एवं पुष्टि',
    'workflow.step3.desc': 'केस रिकॉर्ड में सहेजने से पहले निकाले गए कानूनी तथ्यों की समीक्षा करें।',
    'workflow.step4.title': '4. अधिवक्ता खोज और मिलान',
    'workflow.step4.desc': 'कार्यक्षेत्र, जिला निकटता, भाषा और परामर्श माध्यम के अनुसार उपयुक्त अधिवक्ताओं को खोजें।',
    'workflow.step5.title': '5. सटीक एआई सहायता',
    'workflow.step5.desc': 'अपने दस्तावेज़ों और भारतीय कानूनों के बारे में सटीक उद्धरणों के साथ प्रश्न पूछें।',

    // Limitations Notice
    'disclaimer.title': 'संस्थागत सीमाएं एवं शैक्षणिक प्रोटोटाइप सूचना',
    'disclaimer.text': 'नेक्स्टजेन जस्टिस एक शैक्षणिक कानूनी सहायता प्रोटोटाइप है। यह पेशेवर वकील की प्रत्यक्ष सलाह का विकल्प नहीं है।',

    // Common Buttons & Labels
    'common.save': 'परिवर्तन सहेजें',
    'common.cancel': 'रद्द करें',
    'common.upload': 'दस्तावेज़ अपलोड करें',
    'common.search': 'अधिवक्ता या केस खोजें...',
    'common.loading': 'प्रक्रिया जारी है...',
    'common.viewDetails': 'विवरण देखें',
    'common.status': 'स्थिति',
    'common.date': 'तारीख',
    'common.actions': 'कार्रवाई',
    'common.download': 'डाउनलोड करें',
    'common.delete': 'हटाएं',

    // Dashboards
    'dashboard.welcome': 'पुनः स्वागत है',
    'dashboard.cases.title': 'आपकी सक्रिय केस फाइलें',
    'dashboard.documents.title': 'हालिया दस्तावेज़ विश्लेषण',
    'dashboard.recommended.title': 'आपके जिले में अनुशंसित अधिवक्ता',
    'dashboard.quickActions': 'त्वरित कार्रवाई',

    // Legal Assistant
    'assistant.mode.general': 'मोड A: सामान्य भारतीय कानूनी जानकारी',
    'assistant.mode.case': 'मोड B: निजी केस एवं दस्तावेज़ सहायक',
    'assistant.disclaimer': 'उत्तर केवल भारतीय कानूनों या आपके अपलोड किए गए दस्तावेज़ों पर आधारित हैं।',
    'assistant.placeholder': 'अपने दस्तावेज़ या भारतीय कानूनी प्रक्रिया के बारे में प्रश्न पूछें...',
    'assistant.send': 'प्रश्न भेजें',

    // Profile Settings
    'profile.title': 'नागरिक प्रोफ़ाइल एवं स्थान प्राथमिकताएँ',
    'profile.subtitle': 'सटीक अधिवक्ता मिलान के लिए अपना आवासीय जिला, शहर और संपर्क विवरण प्रबंधित करें।',
    'profile.state': 'राज्य',
    'profile.district': 'ज़िला',
    'profile.city': 'शहर / कस्बा',
    'profile.pincode': 'पिन कोड',
    'profile.language': 'पसंदीदा भाषा',
    'profile.mode': 'पसंदीदा परामर्श माध्यम',
  },
};
