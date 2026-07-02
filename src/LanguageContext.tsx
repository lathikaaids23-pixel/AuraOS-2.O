import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'ta' | 'hi';

export interface TranslationDict {
  [key: string]: {
    en: string;
    ta: string;
    hi: string;
  };
}

export const TRANSLATIONS: TranslationDict = {
  // Navigation / Shell
  appTitle: {
    en: 'Aura OS 2.0',
    ta: 'ஆரா ஓஎஸ் 2.0',
    hi: 'ऑरा ओएस 2.0',
  },
  tagline: {
    en: 'Next-Gen Clinic Operating System',
    ta: 'அடுத்த தலைமுறை கிளினிக் இயக்க முறைமை',
    hi: 'नेक्स्ट-जेन क्लिनिक ऑपरेटिंग सिस्टम',
  },
  dashboard: {
    en: 'Dashboard',
    ta: 'டாஷ்போர்டு',
    hi: 'डैशबोर्ड',
  },
  patients: {
    en: 'Patients',
    ta: 'நோயாளிகள்',
    hi: 'मरीज',
  },
  appointments: {
    en: 'Appointments',
    ta: 'அப்பாயிண்ட்மெண்ட்ஸ்',
    hi: 'अपॉइंटमेंट',
  },
  consultation: {
    en: 'Consultation',
    ta: 'ஆலோசனை',
    hi: 'परामर्श',
  },
  hospitalFinder: {
    en: 'Hospital Finder',
    ta: 'மருத்துவமனை தேடல்',
    hi: 'अस्पताल खोजक',
  },
  emergency: {
    en: 'EMERGENCY',
    ta: 'அவசரகாலம்',
    hi: 'आपातकाल',
  },
  queue: {
    en: 'Queue',
    ta: 'வரிசை',
    hi: 'कतार',
  },
  reports: {
    en: 'Reports',
    ta: 'அறிக்கைகள்',
    hi: 'रिपोर्ट्स',
  },
  settings: {
    en: 'Settings',
    ta: 'அமைப்புகள்',
    hi: 'सेटिंग्स',
  },
  logout: {
    en: 'Logout',
    ta: 'வெளியேறு',
    hi: 'लॉगआउट',
  },

  // Dashboard View
  welcomeBack: {
    en: 'Welcome Back,',
    ta: 'மீண்டும் வருக,',
    hi: 'स्वागत है,',
  },
  liveBadge: {
    en: 'Live',
    ta: 'நேரலை',
    hi: 'लाइव',
  },
  lastUpdated: {
    en: 'Last updated {sec}s ago',
    ta: 'கடைசியாக {sec} நொடிகளுக்கு முன் புதுப்பிக்கப்பட்டது',
    hi: 'आखिरी बार {sec} सेकंड पहले अपडेट किया गया',
  },
  statPatientsToday: {
    en: 'Patients Today',
    ta: 'இன்றைய நோயாளிகள்',
    hi: 'आज के मरीज',
  },
  statWaitingQueue: {
    en: 'Waiting Queue',
    ta: 'காத்திருப்பு வரிசை',
    hi: 'प्रतीक्षा सूची',
  },
  statAppointments: {
    en: 'Appointments',
    ta: 'நியமனங்கள்',
    hi: 'अपॉइंटमेंट',
  },
  statRevenue: {
    en: 'Today\'s Revenue',
    ta: 'இன்றைய வருவாய்',
    hi: 'आज का राजस्व',
  },
  statDocLoad: {
    en: 'Doctor Load',
    ta: 'மருத்துவர் பணிச்சுமை',
    hi: 'डॉक्टर का कार्यभार',
  },
  chartPatientTrend: {
    en: 'Patient Registrations Trend',
    ta: 'நோயாளி பதிவுகள் போக்கு',
    hi: 'मरीज पंजीकरण का चलन',
  },
  chartRevenueTrend: {
    en: 'Daily Revenue (INR)',
    ta: 'தினசரி வருவாய் (INR)',
    hi: 'दैनिक राजस्व (INR)',
  },
  chartAppointmentStatus: {
    en: 'Appointment Status Breakdown',
    ta: 'அப்பாயிண்ட்மெண்ட் நிலை விவரம்',
    hi: 'अपॉइंटमेंट स्थिति का विश्लेषण',
  },

  // Patients View
  addPatient: {
    en: 'Add Patient',
    ta: 'நோயாளி சேர்க்க',
    hi: 'मरीज जोड़ें',
  },
  importCSV: {
    en: 'Import CSV',
    ta: 'CSV இறக்குமதி',
    hi: 'CSV इम्पोर्ट करें',
  },
  searchPatients: {
    en: 'Search patients...',
    ta: 'நோயாளிகளைத் தேடுங்கள்...',
    hi: 'मरीजों को खोजें...',
  },
  patientName: {
    en: 'Patient Name',
    ta: 'நோயாளி பெயர்',
    hi: 'मरीज का नाम',
  },
  age: {
    en: 'Age',
    ta: 'வயது',
    hi: 'उम्र',
  },
  gender: {
    en: 'Gender',
    ta: 'பாலினம்',
    hi: 'लिंग',
  },
  phone: {
    en: 'Phone Number',
    ta: 'தொலைபேசி எண்',
    hi: 'फ़ोन नंबर',
  },
  city: {
    en: 'City',
    ta: 'நகரம்',
    hi: 'शहर',
  },
  condition: {
    en: 'Condition / Symptoms',
    ta: 'நிலை / அறிகுறிகள்',
    hi: 'बीमारी / लक्षण',
  },
  outcome: {
    en: 'Outcome',
    ta: 'முடிவு',
    hi: 'परिणाम',
  },
  actions: {
    en: 'Actions',
    ta: 'செயல்கள்',
    hi: 'कार्रवाई',
  },
  save: {
    en: 'Save',
    ta: 'சேமி',
    hi: 'सुरक्षित करें',
  },
  cancel: {
    en: 'Cancel',
    ta: 'ரத்து செய்',
    hi: 'रद्द करें',
  },

  // Appointments View
  bookAppointment: {
    en: 'Book Appointment',
    ta: 'அப்பாயிண்ட்மெண்ட் புக் செய்',
    hi: 'अपॉइंटमेंट बुक करें',
  },
  selectDoctor: {
    en: 'Select Doctor',
    ta: 'மருத்துவரைத் தேர்ந்தெடு',
    hi: 'डॉक्टर चुनें',
  },
  selectDate: {
    en: 'Select Date',
    ta: 'தேதியைத் தேர்ந்தெடு',
    hi: 'तिथि चुनें',
  },
  selectTimeSlot: {
    en: 'Select Time Slot',
    ta: 'நேரத்தைத் தேர்ந்தெடு',
    hi: 'समय चुनें',
  },
  selectPatient: {
    en: 'Select Patient',
    ta: 'நோயாளியைத் தேர்ந்தெடு',
    hi: 'मरीज चुनें',
  },
  reasonForVisit: {
    en: 'Reason for Visit',
    ta: 'வருகைக்கான காரணம்',
    hi: 'आने का कारण',
  },

  // Consultation View
  consultationCopilot: {
    en: 'AI Consultation Copilot',
    ta: 'AI ஆலோசனை இணை-பைலட்',
    hi: 'एआई परामर्श सह-पायलट',
  },
  getAiSuggestions: {
    en: 'Generate AI Diagnosis & Rx',
    ta: 'AI நோய் கண்டறிதல் மற்றும் மருந்துச்சீட்டு உருவாக்கு',
    hi: 'एआई निदान और दवा पर्ची उत्पन्न करें',
  },
  drugInteractionCheck: {
    en: 'AI Drug Interaction Check',
    ta: 'AI மருந்து தொடர்பு சோதனை',
    hi: 'एआई ड्रग इंटरेक्शन चेक',
  },

  // Hospital Finder
  hospitalTransparencyHeader: {
    en: 'Hospital transparency — know which hospitals are cheap before you go.',
    ta: 'மருத்துவமனை வெளிப்படைத்தன்மை — நீங்கள் செல்வதற்கு முன் எந்த மருத்துவமனைகள் மலிவானவை என்பதை அறிந்து கொள்ளுங்கள்.',
    hi: 'अस्पताल पारदर्शिता — जाने से पहले जान लें कि कौन से अस्पताल किफायती हैं।',
  },
  searchIndiaHospitals: {
    en: 'Search city or area in India...',
    ta: 'இந்தியாவில் உள்ள நகரம் அல்லது பகுதியைப் தேடுங்கள்...',
    hi: 'भारत में शहर या क्षेत्र खोजें...',
  },
  compareHospitals: {
    en: 'Compare Selected Hospitals',
    ta: 'தேர்ந்தெடுக்கப்பட்ட மருத்துவமனைகளை ஒப்பிடுக',
    hi: 'चयनित अस्पतालों की तुलना करें',
  },

  // Emergency View
  ambulanceTrackerHeader: {
    en: 'Real-time ambulance tracking — saving lives in emergencies.',
    ta: 'நிகழ்நேர ஆம்புலன்ஸ் கண்காணிப்பு — அவசர காலங்களில் உயிர்களைக் காக்கும்.',
    hi: 'रियल-टाइम एम्बुलेंस ट्रैकिंग — आपातकाल में जीवन बचाना।',
  },
  whatsappConsultationLine: {
    en: 'WhatsApp AI Consultation Line — 87380 30604',
    ta: 'வாட்ஸ்அப் AI ஆலோசனை சேவை — 87380 30604',
    hi: 'व्हाट्सएप एआई परामर्श लाइन — 87380 30604',
  },
  emergencySos: {
    en: '🚨 EMERGENCY SOS',
    ta: '🚨 அவசர SOS உதவி',
    hi: '🚨 आपातकालीन एसओएस',
  },
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('aura_lang');
    return (saved as Language) || 'en';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('aura_lang', lang);
  };

  const t = (key: string, replacements?: { [key: string]: string | number }): string => {
    const item = TRANSLATIONS[key];
    if (!item) return key;
    let translated = item[language] || item['en'] || key;
    
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        translated = translated.replace(`{${k}}`, String(v));
      });
    }
    return translated;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
