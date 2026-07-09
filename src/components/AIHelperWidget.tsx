import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../LanguageContext';
import { useClinic } from '../ClinicContext';
import { AIAvatar } from './AIAvatar';
import {
  MessageSquare,
  X,
  Send,
  BookOpen,
  ExternalLink,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  Command,
  Calendar,
  AlertTriangle,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Appointment, Patient } from '../types';

interface FaqItem {
  question: { en: string; ta: string; hi: string };
  answer: { en: string; ta: string; hi: string };
  category: 'booking' | 'queue' | 'payments' | 'hospitals' | 'emergency' | 'pdf';
}

const FAQ_DATA: FaqItem[] = [
  {
    category: 'booking',
    question: {
      en: 'How do I book a doctor appointment online?',
      ta: 'நான் எப்படி ஆன்லைனில் மருத்துவரை அணுக அப்பாயிண்ட்மெண்ட் பதிவு செய்வது?',
      hi: 'मैं ऑनलाइन डॉक्टर का अपॉइंटमेंट कैसे बुक करूँ?',
    },
    answer: {
      en: 'Navigate to the "Appointments" view in Aura OS. Pick a doctor, choose your preferred date, search or create a patient, select an available time slot, and click "Book Appointment" to confirm instantly.',
      ta: 'அப்பாயிண்ட்மெண்ட்ஸ் பகுதிக்குச் செல்லவும். மருத்துவரைத் தேர்ந்தெடுத்து, தேதியைக் குறிப்பிடவும், நோயாளியைத் தேடி அல்லது புதியதாகப் பதிவு செய்து, கிடைக்கும் நேரத்தைத் தேர்ந்தெடுத்து "புக் அப்பாயிண்ட்மெண்ட்" கிளிக் செய்யவும்.',
      hi: 'ऑरा ओएस में "अपॉइंटमेंट" सेक्शन पर जाएं। डॉक्टर चुनें, तिथि चुनें, मरीज की खोज करें या नया मरीज जोड़ें, उपलब्ध समय चुनें, और तुरंत कन्फर्म करने के लिए "अपॉइंटमेंट बुक करें" पर क्लिक करें।',
    },
  },
  {
    category: 'queue',
    question: {
      en: 'How does the Live Clinic Queue system work?',
      ta: 'கிளினிக் நேரடி வரிசை முறை எவ்வாறு இயங்குகிறது?',
      hi: 'लाइव क्लिनिक कतार प्रणाली कैसे काम करती है?',
    },
    answer: {
      en: 'Registered patients are checked into the "Queue" tab. Every patient gets a live token number. Clinicians can click "Call Next" or "Complete" to advance the live queue, updating waiting times on the Dashboard.',
      ta: 'பதிவு செய்யப்பட்ட நோயாளிகள் "வரிசை" தாவலில் சேர்க்கப்படுவர். ஒவ்வொரு நோயாளிக்கும் ஒரு நேரடி டோக்கன் வழங்கப்படும். வரிசையை நகர்த்த "கால் நெக்ஸ்ட்" அல்லது "கம்ப்ளீட்" கிளிக் செய்யலாம்.',
      hi: 'पंजीकृत मरीज "कतार" टैब में दर्ज किए जाते हैं। प्रत्येक मरीज को लाइव टोकन मिलता है। क्लिनिक स्टाफ कतार को आगे बढ़ाने के लिए "कॉल नेक्स्ट" या "कम्प्लीट" पर क्लिक कर सकता है।',
    },
  },
  {
    category: 'payments',
    question: {
      en: 'Can I pay via GPay, PhonePe, or UPI?',
      ta: 'ஜிபே, போன்பே அல்லது யுபிஐ மூலம் பணம் செலுத்த முடியுமா?',
      hi: 'क्या मैं जीपे, फोनपे या यूपीआई के जरिए भुगतान कर सकता हूं?',
    },
    answer: {
      en: 'Yes. Upon completing a booking or consultation, click "Proceed to Payment". A dynamic UPI QR code is automatically generated matching the Clinic UPI ID (configured in Settings). Scan to pay instantly with any UPI app.',
      ta: 'ஆமாம். ஆலோசனை முடிந்தவுடன் "பணம் செலுத்து" என்பதை கிளிக் செய்யவும். ஒரு யுபிஐ கியூஆர் குறியீடு தானாக உருவாக்கப்படும். அமைப்புகளில் உள்ள யுபிஐ ஐடி-க்கு நேரடியாக ஸ்கேன் செய்து பணம் செலுத்தலாம்.',
      hi: 'हाँ। परामर्श पूरा होने पर "भुगतान पर आगे बढ़ें" पर क्लिक करें। क्लिनिक यूपीआई आईडी के अनुसार एक यूपीआई क्यूआर कोड स्वचालित रूप से उत्पन्न हो जाएगा। किसी भी यूपीआई ऐप से स्कैन करके भुगतान करें।',
    },
  },
  {
    category: 'hospitals',
    question: {
      en: 'How does the India Hospital Finder transparency work?',
      ta: 'இந்திய மருத்துவமனை தேடல் வெளிப்படைத்தன்மை எவ்வாறு செயல்படுகிறது?',
      hi: 'भारत अस्पताल खोजक पारदर्शिता कैसे काम करती है?',
    },
    answer: {
      en: 'The "Hospital Finder" allows you to find nearby hospitals, comparing their bed availability, types (Govt/Private), and cost categories (Free/Low/Mid/Premium) before you go, saving time and money.',
      ta: 'மருத்துவமனை தேடல் மூலம் அருகிலுள்ள மருத்துவமனைகளை ஒப்பிட்டுப் பார்க்க முடியும். படுக்கைகளின் எண்ணிக்கை, கட்டணப் பிரிவு (இலவசம்/குறைந்த/பிரீமியம்) போன்ற விவரங்களை நீங்கள் புறப்படுவதற்கு முன்னரே அறியலாம்.',
      hi: 'अस्पताल खोजक आपको पास के अस्पतालों को खोजने, उनके बेड की उपलब्धता, प्रकार (सरकारी/निजी) और शुल्क श्रेणियों (मुफ्त/कम/मध्यम/प्रीमियम) की तुलना जाने से पहले करने की सुविधा देता है।',
    },
  },
  {
    category: 'emergency',
    question: {
      en: 'How do I dispatch an ambulance or trigger Emergency SOS?',
      ta: 'ஆம்புலன்ஸை எவ்வாறு அனுப்புவது அல்லது அவசர SOS-ஐ எவ்வாறு இயக்குவது?',
      hi: 'मैं एम्बुलेंस को कैसे डिस्पैच करूँ या आपातकालीन एसओएस चालू करूँ?',
    },
    answer: {
      en: 'Click the large red "🚨 EMERGENCY SOS" button in the Emergency page. Aura OS automatically dispatches the nearest Available ambulance and reserves a free ICU bed. You can also tap-to-chat with our 24x7 WhatsApp AI Line: 87380 30604.',
      ta: 'அவசரப் பக்கத்தில் உள்ள "🚨 அவசர SOS உதவி" பட்டனை அழுத்தவும். ஆரா சிஸ்டம் தானாகவே மிக அருகிலுள்ள ஆம்புலன்ஸை அனுப்பி, ஐசியூ படுக்கையை முன்பதிவு செய்யும். எங்கள் 24/7 வாட்ஸ்அப் AI வரியுடன் அரட்டையடிக்கலாம்: 87380 30604.',
      hi: 'आपातकालीन पृष्ठ पर "🚨 आपातकालीन एसओएस" बटन पर क्लिक करें। ऑरा सिस्टम निकटतम उपलब्ध एम्बुलेंस को डिस्पैच करेगा और एक आईसीयू बेड आरक्षित करेगा। आप 24/7 व्हाट्सएप एआई लाइन के साथ भी चैट कर सकते हैं: 87380 30604।',
    },
  },
  {
    category: 'pdf',
    question: {
      en: 'How can I download prescriptions and clinical receipts?',
      ta: 'மருந்துச்சீட்டு மற்றும் கட்டண ரசீதுகளை எவ்வாறு பதிவிறக்கம் செய்வது?',
      hi: 'மனுசச்சீட்டு மற்றும் கட்டண ரசீதுகளை எவ்வாறு பதிவிறக்கம் செய்வது?',
    },
    answer: {
      en: 'On patient details, completed consultations, or payments summaries, click the cyan "Download PDF" buttons. Elegant, branded, computer-generated PDFs are generated containing all clinical itemization, ready to print.',
      ta: 'நோயாளியின் விவரங்கள் அல்லது கட்டணச் சுருக்கத்தில் உள்ள "Download PDF" பட்டனை அழுத்தவும். உங்களது கிளினிக் பிராண்ட் விவரங்களுடன் கூடிய பிடிஎஃப் கோப்பு தானாகவே பதிவிறக்கம் செய்ய தயாராகிவிடும்.',
      hi: 'मरीज के विवरण या बिल भुगतान के विवरण में दिए "पीडीएफ डाउनलोड करें" बटन पर क्लिक करें। क्लिनिक के ब्रांड के साथ सुंदर पीडीएफ रसीद प्रिंट करने के लिए तुरंत डाउनलोड हो जाएगी।',
    },
  },
];

export const AIHelperWidget: React.FC = () => {
  const { state, bookAppointment, addPatient, dispatchAmbulance, clearQueue } = useClinic();
  const { language, setLanguage } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'chat'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Custom assistant language: defaults to global clinical language or 'en'
  const [aiLanguage, setAiLanguage] = useState<'en' | 'ta' | 'hi'>(() => {
    return (language as 'en' | 'ta' | 'hi') || 'en';
  });

  // Sync global translation language to AI language
  useEffect(() => {
    if (language && (language === 'en' || language === 'ta' || language === 'hi')) {
      if (language !== aiLanguage) {
        setAiLanguage(language);
      }
    }
  }, [language]);

  // Localized AI Welcomes
  const welcomeText = {
    en: "Namaste! I am Aura, your Siri & Alexa-enabled clinical guide. Speak to me naturally to navigate pages, dispatch ambulances, or book patient appointments hands-free! Try saying: 'Book an appointment with Dr. Priya for tomorrow at 10:00 AM for Arun Kumar'",
    ta: "வணக்கம்! நான் ஆரா, உங்கள் சிரி மற்றும் அலெக்சா போன்ற குரல் வழிகாட்டி. அப்பாயிண்ட்மெண்ட் பதிவு செய்ய, அவசர உதவிக்கு அல்லது பக்கங்களை மாற்ற என்னிடம் தமிழ் அல்லது ஆங்கிலத்தில் பேசுங்கள்! உதாரணமாக: 'நாளை காலை 10 மணிக்கு அருண் குமாருக்கு டாக்டர் பிரியாவிடம் அப்பாயிண்ட்மெண்ட் புக் செய்' என்று கூறுங்கள்.",
    hi: "नमस्ते! मैं ऑरा हूँ, आपकी सिरी और एलेक्सा जैसी क्लिनिकल वॉयस गाइड। मुझसे खुलकर बात करें - अपॉइंटमेंट बुक करने, एम्बुलेंस भेजने या नेविगेट करने के लिए कहें! कोशिश करें: 'कल सुबह 10:00 बजे अरुण कुमार के लिए डॉ. प्रिया के साथ अपॉइंटमेंट बुक करें'"
  };

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; isCommand?: boolean }>>([]);

  // Sync initial welcome message if empty or if assistant language changes
  useEffect(() => {
    setChatMessages([
      {
        sender: 'ai',
        text: welcomeText[aiLanguage]
      }
    ]);
  }, [aiLanguage]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-to-Speech (Siri/Alexa Voice response) supporting English, Tamil, and Hindi
  const speakResponse = (text: string, forceLang?: 'en' | 'ta' | 'hi') => {
    if (!isTtsEnabled) return;
    if ('speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel(); // Stop current speaking
        
        // Clean up text of emojis/symbols for perfect pronunciation
        const cleanText = text
          .replace(/🚨|🏥|💸|🗓️|🏥|📄|🔍|👍|❤️|✨|🧭|🧹/g, '')
          .replace(/EHR/g, 'E.H.R.')
          .replace(/OS/g, 'O.S.');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Auto-detect Tamil and Hindi script inside the spoken text to prevent wrong voice assignment
        const containsTamil = /[\u0B80-\u0BFF]/.test(cleanText);
        const containsHindi = /[\u0900-\u097F]/.test(cleanText);
        
        let activeLang = forceLang || aiLanguage;
        if (containsTamil) {
          activeLang = 'ta';
        } else if (containsHindi) {
          activeLang = 'hi';
        }
        
        // Select appropriate language tag and voice for speech engine
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (activeLang === 'ta') {
          utterance.lang = 'ta-IN';
          selectedVoice = voices.find(v => 
            v.lang.toLowerCase().startsWith('ta') || 
            v.lang.toLowerCase().includes('ta-in') || 
            v.name.toLowerCase().includes('tamil') ||
            v.name.toLowerCase().includes('ta')
          );
        } else if (activeLang === 'hi') {
          utterance.lang = 'hi-IN';
          selectedVoice = voices.find(v => 
            v.lang.toLowerCase().startsWith('hi') || 
            v.lang.toLowerCase().includes('hi-in') || 
            v.name.toLowerCase().includes('hindi') ||
            v.name.toLowerCase().includes('hi')
          );
        } else {
          utterance.lang = 'en-US';
          selectedVoice = voices.find(v => 
            v.lang.toLowerCase().startsWith('en') && 
            (v.name.toLowerCase().includes('google') || 
             v.name.toLowerCase().includes('siri') || 
             v.name.toLowerCase().includes('natural') || 
             v.name.toLowerCase().includes('female'))
          );
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.rate = 0.95; // Slightly slower for better clarity and accessibility
        utterance.pitch = 1.05; // Pleasant assistant tone

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e);
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('TTS execution error:', err);
        setIsSpeaking(false);
      }
    }
  };

  // Web Speech API - Speech to Text (Siri/Alexa voice input)
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech Recognition API is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      
      // Dynamic Speech-to-text model matching Siri/Alexa settings
      recognition.lang = aiLanguage === 'hi' ? 'hi-IN' : aiLanguage === 'ta' ? 'ta-IN' : 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel(); // Cancel any voice if listening
        }
        const langLabel = aiLanguage === 'hi' ? 'Hindi / हिंदी' : aiLanguage === 'ta' ? 'Tamil / தமிழ்' : 'English';
        toast.info(`Aura Siri Mode: Listening in ${langLabel}... Speak now!`);
      };

      recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText.trim()) {
          setChatInput(resultText);
          handleSendChatWithInput(resultText);
        }
      };

      recognition.onerror = (err: any) => {
        console.error(err);
        setIsListening(false);
        toast.error('Voice input timed out or was interrupted.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
      console.error(e);
    }
  };

  // Main chatbot parser that acts like Siri & Alexa, automatically executing patient bookings in English, Tamil, and Hindi
  const handleSendChatWithInput = async (userInput: string) => {
    if (!userInput.trim()) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text: userInput }]);
    setChatInput('');

    const lowerInput = userInput.toLowerCase();
    // Auto language detection based on character sets or Tanglish vocabulary (Siri/Alexa-style)
    const containsTamil = /[\u0B80-\u0BFF]/.test(userInput);
    const containsHindi = /[\u0900-\u097F]/.test(userInput);
    
    // Highly comprehensive vocabulary list to identify Tanglish (Tamil transliterated into English letters)
    const tanglishWords = [
      'epdi', 'enna', 'irukinga', 'irukeenga', 'vanakkam', 'nandri', 'apram', 'sollu', 'vanga', 
      'ponga', 'pannu', 'yaar', 'ethu', 'yenna', 'thambi', 'akka', 'amma', 'appa', 'tanglish', 
      'romba', 'panna', 'seiya', 'nalama', 'saukkyama', 'nanri', 'eluthu', 'theriyuma', 'solli', 
      'kudu', 'padi', 'padikira', 'mudiyuma', 'pannunga', 'yenna', 'unga', 'enaku', 'nalla', 'solla',
      'panreenga', 'panrenga', 'iruken', 'irukean', 'varan', 'vanga', 'ponga', 'solunga', 'sollunga'
    ];
    const isTanglish = tanglishWords.some(w => lowerInput.includes(w));
    let currentLang = aiLanguage;

    if (containsTamil) {
      currentLang = 'ta';
      setAiLanguage('ta');
      setLanguage('ta');
      toast.success("Tamil language detected! / தமிழ் கண்டறியப்பட்டது!");
    } else if (isTanglish) {
      currentLang = 'ta';
      setAiLanguage('ta');
      setLanguage('ta');
      toast.success("Tanglish detected! / டங்கிலீஷ் கண்டறியப்பட்டது!");
    } else if (containsHindi) {
      currentLang = 'hi';
      setAiLanguage('hi');
      setLanguage('hi');
      toast.success("Hindi language detected! / हिंदी भाषा का पता चला!");
    }

    // Wait 800ms to mimic reasoning/Alexa cloud processing
    setTimeout(async () => {
      const lower = userInput.toLowerCase();
      let responseText = '';
      let isCommandExecuted = false;

      // Current Date details for booking calculation
      // local time: 2026-07-02
      const todayStr = '2026-07-02';
      const tomorrowStr = '2026-07-03';

      // 1. APPOINTMENT BOOKING INTENT DETECTION (Supports English, Tamil & Hindi synonyms)
      const bookingKeywords = [
        'book', 'booking', 'appointment', 'schedule', 'reserve', 'appoint', 'slot', 'meet',
        'பதிவு', 'புக்', 'அப்பாயிண்ட்மெண்ட்', 'சந்திப்பு', 'நேரம்',
        'बुक', 'अपॉइंटमेंट', 'आरक्षित', 'शेड्यूल', 'मिलना'
      ];
      const isBookingIntent = bookingKeywords.some((kw) => lower.includes(kw));

      if (isBookingIntent) {
        // Detect doctor
        let matchedDoc = state.doctors[0]; // Default to Dr. Rahul Sharma
        for (const doc of state.doctors) {
          const docLastName = doc.name.split(' ').pop()?.toLowerCase() || '';
          const docFirstName = doc.name.toLowerCase();
          
          // Tamil mapping for specialties/names
          const taDocMap: Record<string, string> = {
            'sharma': 'சர்மா', 'priya': 'பிரியா', 'iyer': 'அனன்யா', 'karthik': 'கார்த்திக்',
            'cardio': 'இதய', 'paediatric': 'குழந்தை', 'ortho': 'எலும்பு', 'neuro': 'நரம்பு'
          };
          
          // Hindi mapping
          const hiDocMap: Record<string, string> = {
            'sharma': 'शर्मा', 'priya': 'प्रिया', 'iyer': 'अय्यर', 'karthik': 'कार्तिक'
          };

          const matchedTa = Object.entries(taDocMap).some(([enKey, taVal]) => lower.includes(taVal) && docFirstName.includes(enKey));
          const matchedHi = Object.entries(hiDocMap).some(([enKey, hiVal]) => lower.includes(hiVal) && docFirstName.includes(enKey));

          if (lower.includes(docLastName) || lower.includes(docFirstName) || lower.includes(doc.specialty.toLowerCase()) || matchedTa || matchedHi) {
            matchedDoc = doc;
            break;
          }
        }

        // Detect date (today / tomorrow / specific dates)
        let matchedDate = tomorrowStr; // default to tomorrow
        const isToday = lower.includes('today') || lower.includes('இன்று') || lower.includes('आज') || lower.includes('இன்னிக்கு');
        const isTomorrow = lower.includes('tomorrow') || lower.includes('நாளை') || lower.includes('कल') || lower.includes('நாளைக்கு');

        if (isToday) {
          matchedDate = todayStr;
        } else if (isTomorrow) {
          matchedDate = tomorrowStr;
        } else {
          // Check for any ISO date matches YYYY-MM-DD
          const dateMatch = lower.match(/\d{4}-\d{2}-\d{2}/);
          if (dateMatch) {
            matchedDate = dateMatch[0];
          }
        }

        // Detect time slot
        let matchedTime = '10:00 AM'; // default
        const slots = matchedDoc.timeSlots;
        
        // look for numerical indicators in string (Siri natural language matching)
        if (lower.includes('9') || lower.includes('ஒன்பது') || lower.includes('नौ')) {
          matchedTime = slots.find(s => s.startsWith('09')) || slots[0];
        } else if (lower.includes('10') || lower.includes('பத்து') || lower.includes('दस')) {
          matchedTime = slots.find(s => s.startsWith('10')) || slots[0];
        } else if (lower.includes('11') || lower.includes('பதினொன்று') || lower.includes('ग्यारह')) {
          matchedTime = slots.find(s => s.startsWith('11')) || slots[0];
        } else if (lower.includes('12') || lower.includes('பன்னிரண்டு') || lower.includes('बारह')) {
          matchedTime = slots.find(s => s.startsWith('12')) || slots[0];
        } else if (lower.includes('1') || lower.includes('ஒன்று') || lower.includes('एक')) {
          matchedTime = slots.find(s => s.startsWith('01') || s.startsWith('1:')) || slots[0];
        } else if (lower.includes('2') || lower.includes('இரண்டு') || lower.includes('दो')) {
          matchedTime = slots.find(s => s.startsWith('02') || s.startsWith('2:')) || slots[0];
        } else if (lower.includes('3') || lower.includes('மூன்று') || lower.includes('तीन')) {
          matchedTime = slots.find(s => s.startsWith('03') || s.startsWith('3:')) || slots[0];
        } else if (lower.includes('4') || lower.includes('நான்கு') || lower.includes('चार')) {
          matchedTime = slots.find(s => s.startsWith('04') || s.startsWith('4:')) || slots[0];
        } else if (lower.includes('5') || lower.includes('ஐந்து') || lower.includes('पाँच')) {
          matchedTime = slots.find(s => s.startsWith('05') || s.startsWith('5:')) || slots[0];
        } else {
          matchedTime = slots[1] || slots[0]; // Cozy morning slot default
        }

        // Detect patient
        let matchedPatient: Patient | null = null;
        for (const p of state.patients) {
          const pNameLower = p.name.toLowerCase();
          const firstWord = p.name.split(' ')[0].toLowerCase();
          if (lower.includes(pNameLower) || lower.includes(firstWord)) {
            matchedPatient = p;
            break;
          }
        }

        // If no patient found, check if a custom patient name is spoken/typed (e.g. "for Rajesh Kumar" / "அருண் குமாருக்கு" / "राजेश के लिए")
        if (!matchedPatient) {
          let extractedName = '';
          const forMatch = lower.match(/(?:for|patient|under|காக|அதி|लिए)\s+([a-zA-Z\u0B80-\u0BFF\u0900-\u097F]+(?:\s+[a-zA-Z\u0B80-\u0BFF\u0900-\u097F]+)?)/);
          
          if (forMatch && forMatch[1]) {
            extractedName = forMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase());
          }

          if (extractedName && extractedName.length > 1) {
            // Auto-create a patient profile like Siri / Alexa instantly to fulfill intent
            const newPatId = `pat-${Date.now()}`;
            const newPat: Patient = {
              id: newPatId,
              name: extractedName,
              age: 32,
              gender: 'Male',
              phone: '9840198765',
              city: 'Chennai',
              condition: 'Registered via Alexa Siri Multilingual Command',
              outcome: 'In Treatment',
              createdAt: new Date().toISOString()
            };
            await addPatient(newPat);
            matchedPatient = newPat;
          } else {
            // Fallback to first existing patient
            matchedPatient = state.patients[0];
          }
        }

        // Book the actual appointment in store!
        const appointmentId = `apt-${Date.now()}`;
        const appointment: Appointment = {
          id: appointmentId,
          patientId: matchedPatient.id,
          patientName: matchedPatient.name,
          doctorId: matchedDoc.id,
          doctorName: matchedDoc.name,
          date: matchedDate,
          timeSlot: matchedTime,
          status: 'scheduled',
          reason: 'Auto-booked via Siri/Alexa Multilingual Voice Co-pilot',
          createdAt: new Date().toISOString()
        };

        try {
          await bookAppointment(appointment);
          isCommandExecuted = true;
          
          // Beautifully localized reply messages
          if (currentLang === 'ta') {
            responseText = `🗓️ சிரி & அலெக்சா குரல் பதிவு: அப்பாயிண்ட்மெண்ட் வெற்றிகரமாக புக் செய்யப்பட்டது! நோயாளி ${matchedPatient.name}-க்காக டாக்டர் ${matchedDoc.name} உடன் ${matchedDate} அன்று ${matchedTime} மணிக்கு அப்பாயிண்ட்மெண்ட் பதிவு செய்துள்ளேன். உங்களை அப்பாயிண்ட்மெண்ட்ஸ் பக்கத்திற்கு மாற்றுகிறேன்.`;
          } else if (currentLang === 'hi') {
            responseText = `🗓️ सिरी और एलेक्सा असिस्टेंट: अपॉइंटमेंट सफलतापूर्वक बुक हो गया है! मैंने मरीज ${matchedPatient.name} के लिए डॉ. ${matchedDoc.name} के साथ ${matchedDate} को ${matchedTime} बजे अपॉइंटमेंट तय कर दिया है। आपको अपॉइंटमेंट पेज पर रीडायरेक्ट कर दिया गया है।`;
          } else {
            responseText = `🗓️ Siri & Alexa Assistant: Appointment booked successfully! I have scheduled an appointment with ${matchedDoc.name} (${matchedDoc.specialty}) for patient ${matchedPatient.name} on ${matchedDate} at ${matchedTime}. Showing you the Appointments board now!`;
          }
          
          // Instantly trigger view swap so they see it happen live!
          window.dispatchEvent(new CustomEvent('aura-navigate', { detail: 'appointments' }));
        } catch (err) {
          responseText = currentLang === 'ta' ? "முன்பதிவு செய்யும்போது பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்." : currentLang === 'hi' ? "अपॉइंटमेंट दर्ज करते समय एक त्रुटि आई। कृपया पुनः प्रयास करें।" : "I encountered an error trying to write the appointment booking. Please verify the parameters.";
        }

      // 2. NAVIGATIONAL COMMANDS (Alexa, take me to... / தமிழ் வழிசெலுத்தல்)
      } else if (
        lower.includes('navigate') || lower.includes('take me') || lower.includes('go to') || lower.includes('show') || lower.includes('open') ||
        lower.includes('செல்') || lower.includes('காட்டு') || lower.includes('திற') || lower.includes('பக்கம்') ||
        lower.includes('जाएं') || lower.includes('दिखाएं') || lower.includes('खोलो') || lower.includes('पेज')
      ) {
        let pageDetailEn = '';
        let pageDetailTa = '';
        let pageDetailHi = '';
        let targetPage = '';

        const isDash = lower.includes('dashboard') || lower.includes('home') || lower.includes('டாஷ்போர்டு') || lower.includes('டேஷ்போர்டு') || lower.includes('मुख्य') || lower.includes('डैशबोर्ड');
        const isApt = lower.includes('appointment') || lower.includes('booking') || lower.includes('schedule') || lower.includes('அப்பாயிண்ட்மெண்ட்') || lower.includes('பதிவு') || lower.includes('बुक') || lower.includes('नियुक्ति');
        const isPat = lower.includes('patient') || lower.includes('ehr') || lower.includes('records') || lower.includes('நோயாளி') || lower.includes('கோப்பு') || lower.includes('மரிஜ்') || lower.includes('मरीज');
        const isQue = lower.includes('queue') || lower.includes('token') || lower.includes('waiting') || lower.includes('வரிசை') || lower.includes('டோக்கன்') || lower.includes('कतार') || lower.includes('प्रतीक्षा');
        const isCon = lower.includes('consult') || lower.includes('prescription') || lower.includes('diagnosis') || lower.includes('ஆலோசனை') || lower.includes('மருந்து') || lower.includes('परामर्श') || lower.includes('पर्ची');
        const isRep = lower.includes('billing') || lower.includes('payment') || lower.includes('invoice') || lower.includes('report') || lower.includes('அறிக்கை') || lower.includes('கட்டணம்') || lower.includes('रसीद') || lower.includes('बिल');
        const isHos = lower.includes('hospital') || lower.includes('bed') || lower.includes('finder') || lower.includes('மருத்துவமனை') || lower.includes('தேடல்') || lower.includes('अस्पताल') || lower.includes('बेड');
        const isEmg = lower.includes('emergency') || lower.includes('sos') || lower.includes('ambulance') || lower.includes('அவசரம்') || lower.includes('ஆம்புலன்ஸ்') || lower.includes('आपातकाल') || lower.includes('एम्बुलेंस');
        const isSet = lower.includes('settings') || lower.includes('config') || lower.includes('அமைப்பு') || lower.includes('அமைப்புகள்') || lower.includes('सेटिंग्स');

        if (isDash) {
          targetPage = 'dashboard';
          pageDetailEn = 'Clinical Intelligence Dashboard';
          pageDetailTa = 'டாஷ்போர்டு நேரலை அறிக்கை பக்கம்';
          pageDetailHi = 'क्लिनिकल इंटेलिजेंस डैशबोर्ड';
        } else if (isApt) {
          targetPage = 'appointments';
          pageDetailEn = 'Doctor Appointments Manager';
          pageDetailTa = 'அப்பாயிண்ட்மெண்ட் மேலாண்மை பக்கம்';
          pageDetailHi = 'डॉक्टर अपॉइंटमेंट मैनेजर';
        } else if (isPat) {
          targetPage = 'patients';
          pageDetailEn = 'EHR Patients Database';
          pageDetailTa = 'நோயாளிகள் மின்னணு கோப்புகள் தளம்';
          pageDetailHi = 'मरीज डेटाबेस और ईएचआर रिकॉर्ड';
        } else if (isQue) {
          targetPage = 'queue';
          pageDetailEn = 'Live Clinic OPD Queue';
          pageDetailTa = 'நேரடி கிளினிக் டோக்கன் வரிசை';
          pageDetailHi = 'लाइव क्लिनिक ओपीडी कतार बोर्ड';
        } else if (isCon) {
          targetPage = 'consultation';
          pageDetailEn = 'Clinical Consultation Workbench';
          pageDetailTa = 'மருத்துவ ஆலோசனை பணிமனை';
          pageDetailHi = 'परामर्श और डिजिटल पर्ची बोर्ड';
        } else if (isRep) {
          targetPage = 'reports';
          pageDetailEn = 'Financial Ledgers & Reports';
          pageDetailTa = 'நிதி அறிக்கைகள் மற்றும் கட்டண கணக்குகள்';
          pageDetailHi = 'वित्तीय रिपोर्ट और रसीद बहीखाता';
        } else if (isHos) {
          targetPage = 'hospital-finder';
          pageDetailEn = 'India Hospital & Beds Finder';
          pageDetailTa = 'இந்திய மருத்துவமனை படுக்கை தேடல் வசதி';
          pageDetailHi = 'अस्पताल बेड और चिकित्सा उपलब्धता खोजक';
        } else if (isEmg) {
          targetPage = 'emergency';
          pageDetailEn = 'Ambulance Dispatch & SOS Hub';
          pageDetailTa = 'அவசர ஆம்புலன்ஸ் சேவை மையம்';
          pageDetailHi = 'एम्बुलेंस प्रेषण और आपातकालीन एसओएस हब';
        } else if (isSet) {
          targetPage = 'settings';
          pageDetailEn = 'Clinic System Configurations';
          pageDetailTa = 'அமைப்புகள் மற்றும் கணினி மேலாண்மை';
          pageDetailHi = 'सिस्टम सेटिंग्स और क्लिनिक कॉन्फ़िगरेशन';
        }

        if (targetPage) {
          window.dispatchEvent(new CustomEvent('aura-navigate', { detail: targetPage }));
          isCommandExecuted = true;
          
          if (currentLang === 'ta') {
            responseText = `🧭 ஆரா ஓஎஸ் வழிசெலுத்தல்: புரிகிறது! உங்களை இப்போது ${pageDetailTa} பக்கத்திற்கு அழைத்துச் செல்கிறேன்.`;
          } else if (currentLang === 'hi') {
            responseText = `🧭 ऑरा ओएस नेविगेशन: जी बिल्कुल! आपको तुरंत ${pageDetailHi} पेज पर ले जाया जा रहा है।`;
          } else {
            responseText = `🧭 Navigating Aura OS: Understood! Switching you to the ${pageDetailEn} tab right away.`;
          }
        } else {
          responseText = currentLang === 'ta' ? "மன்னிக்கவும், நீங்கள் குறிப்பிட்ட பக்கம் கண்டறியப்படவில்லை. 'டாஷ்போர்டு செல்' அல்லது 'அவசரகாலம் திற' என்று கூறலாம்." : currentLang === 'hi' ? "क्षमा करें, यह पेज मुझे नहीं मिला। आप 'डैशबोर्ड खोलें' या 'इमरजेंसी पेज पर जाएं' कह सकते हैं।" : "I'm happy to take you there. You can say 'Go to Emergency', 'Take me to appointments', or 'Open Settings'.";
        }

      // 3. EMERGENCY SOS DISPATCH COMMANDS (Siri, dispatch ambulance!)
      } else if (
        lower.includes('dispatch') || lower.includes('sos') || lower.includes('accident') || lower.includes('critical') || lower.includes('ambulance') ||
        lower.includes('ஆம்புலன்ஸ்') || lower.includes('அபாயம்') || lower.includes('விபத்து') ||
        lower.includes('एम्बुलेंस') || lower.includes('हादसा') || lower.includes('गंभीर')
      ) {
        const availableAmb = state.ambulances.find(a => a.status === 'Available');
        if (availableAmb) {
          window.dispatchEvent(new CustomEvent('aura-navigate', { detail: 'emergency' }));
          await dispatchAmbulance(availableAmb.id);
          isCommandExecuted = true;

          if (currentLang === 'ta') {
            responseText = `🚨 அவசர ஆம்புலன்ஸ் சேவை: அவசர கால உதவி தயார்! ஆம்புலன்ஸ் ${availableAmb.vehicleNumber} (ஓட்டுனர் ${availableAmb.driverName}) உடனடியாக புறப்பட்டுவிட்டது. தீவிர சிகிச்சை பிரிவில் (ICU) இலவச படுக்கை ஒன்று முன்பதிவு செய்யப்பட்டுள்ளது.`;
          } else if (currentLang === 'hi') {
            responseText = `🚨 आपातकालीन एम्बुलेंस सेवा: आपातकालीन सहायता सक्रिय! एम्बुलेंस नंबर ${availableAmb.vehicleNumber} (चालक ${availableAmb.driverName}) को तुरंत रवाना कर दिया गया है। आईसीयू बेड आरक्षित है।`;
          } else {
            responseText = `🚨 Siri Emergency dispatch: EMERGENCY DISPATCH COMPLETE! Sent Ambulance ${availableAmb.vehicleNumber} (driven by ${availableAmb.driverName}). A complimentary ICU bed at the nearest medical center has been reserved.`;
          }
        } else {
          responseText = currentLang === 'ta' ? "🚨 அவசர எச்சரிக்கை: தற்போது ஆம்புலன்ஸ் வாகனங்கள் அனைத்தும் சேவையில் உள்ளன. அவசர உதவிக்கு +91 87380 30604 என்ற எண்ணை தொடர்பு கொள்ளவும்." : currentLang === 'hi' ? "🚨 आपातकालीन चेतावनी: सभी एम्बुलेंस अभी व्यस्त हैं। कृपया आपातकालीन हेल्पलाइन +91 87380 30604 पर तुरंत कॉल करें।" : "🚨 Siri Emergency Alert: I attempted to dispatch an ambulance, but all units are busy. Please call critical care line directly on +91 87380 30604.";
        }

      // 4. CLINIC QUEUE RESET COMMAND
      } else if (lower.includes('clear queue') || lower.includes('empty queue') || lower.includes('reset queue') || lower.includes('வரிசையை நீக்கு') || lower.includes('कतार खाली')) {
        await clearQueue();
        window.dispatchEvent(new CustomEvent('aura-navigate', { detail: 'queue' }));
        isCommandExecuted = true;
        responseText = currentLang === 'ta' ? "🧹 சிரி & அலெக்சா: வரிசை சுத்தப்படுத்தப்பட்டது! கிளினிக் காத்திருப்பு பட்டியலை வெற்றிகரமாக அழித்துவிட்டேன்." : currentLang === 'hi' ? "🧹 सिरी और एलेक्सा सहायक: कतार को पूरी तरह से खाली कर दिया गया है।" : "🧹 Siri & Alexa Co-pilot: Clean-up executed! I have cleared all active patient tokens from the clinic waiting queue dashboard.";

      // 5. STANDARD SYSTEM CONVERSATION / FALLBACK QUESTIONS (Bilingual clinical replies / Gemini API)
      } else {
        // First try fetching from Gemini API
        try {
          const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userInput, language: isTanglish ? 'tanglish' : currentLang })
          });
          const data = await res.json();
          if (data && data.response) {
            responseText = data.response;
          }
        } catch (error) {
          console.error("Gemini fallback error, using local fallback rules:", error);
        }

        // If Gemini is not configured or failed, use our smart local multilingual fallback rules!
        if (!responseText) {
          if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey') || lower.includes('வணக்கம்') || lower.includes('नमस्ते') || lower.includes('ஹலோ')) {
            if (currentLang === 'ta') {
              responseText = "வணக்கம்! நான் உங்கள் சிரி மற்றும் அலெக்சா குரல் உதவியாளர். தமிழ் மற்றும் ஆங்கிலத்தில் என்னிடம் பேசி அப்பாயிண்ட்மெண்ட் பதிவு செய்யலாம், அவசர ஆம்புலன்ஸ் அனுப்பலாம் அல்லது கிளினிக் வரிசையை நிர்வகிக்கலாம்!";
            } else if (currentLang === 'hi') {
              responseText = "नमस्ते! मैं आपकी सिरी और एलेक्सा वॉयस असिस्टेंट हूँ। आप मुझसे बात करके अपॉइंटमेंट बुक कर सकते हैं, एम्बुलेंस भेज सकते हैं या कतार साफ़ कर सकते हैं!";
            } else {
              responseText = "Hello! I am your Alexa & Siri voice-assistant guide. Speak to me naturally to book a consultation, clear the clinic queue, dispatch emergency resources, or navigate tabs hands-free!";
            }
          } else if (lower.includes('who are you') || lower.includes('your name') || lower.includes('யார் நீ') || lower.includes('உன் பெயர்') || lower.includes('कौन हो')) {
            if (currentLang === 'ta') {
              responseText = "நான் ஆரா, ஆரா ஓஎஸ்-இன் சிரி மற்றும் அலெக்சா போன்ற குரல் நுண்ணறிவு உதவியாளர். கைகள் பயன்படுத்தாமல் கிளினிக்கை கட்டுப்படுத்த நான் உதவுகிறேன்.";
            } else if (currentLang === 'hi') {
              responseText = "मैं ऑरा हूँ, ऑरा ओएस की सिरी और एलेक्सा जैसी वॉयस गाइड। क्लिनिक को हाथों से छुए बिना प्रबंधित करने में मैं आपकी मदद करती हूँ।";
            } else {
              responseText = "I am Aura, the voice guiding intelligence of Aura OS. Built to act just like Siri or Alexa, I execute hands-free clinical commands, schedule clinic appointments, and manage emergency SOS dispatches.";
            }
          } else if (lower.includes('help') || lower.includes('what can you do') || lower.includes('உதவி') || lower.includes('என்ன செய்ய முடியும்') || lower.includes('मदद') || lower.includes('क्या कर सकते')) {
            if (currentLang === 'ta') {
              responseText = "நான் உங்களுக்கு முழுமையாக உதவ முடியும்! 'டாஷ்போர்டு போ', 'ஆம்புலன்ஸ் அனுப்பு', அல்லது 'நோயாளி அருண் குமாருக்கு அப்பாயிண்ட்மெண்ட் புக் செய்' என்று தமிழ் அல்லது ஆங்கிலத்தில் கூறலாம்.";
            } else if (currentLang === 'hi') {
              responseText = "मैं आपकी कई तरह से मदद कर सकती हूँ! जैसे 'मरीजों की सूची दिखाएं', 'एम्बुलेंस भेजें', या 'डॉ. शर्मा के साथ अपॉइंटमेंट बुक करें' कहना।";
            } else {
              responseText = "I can guide you seamlessly! Ask me to 'Navigate to patients', 'Show hospital bed counts', 'Dispatch ambulance', or 'Book doctor Priya tomorrow at 3pm for patient Arun Kumar'.";
            }
          } else if (lower.includes('pay') || lower.includes('upi') || lower.includes('gpay') || lower.includes('qr') || lower.includes('பணம்') || lower.includes('கியூஆர்') || lower.includes('भुगतान')) {
            if (currentLang === 'ta') {
              responseText = "💸 கட்டண சேவை: பணம் செலுத்த 'அறிக்கைகள்' பக்கத்திற்குச் செல்லவும். அங்கு உங்கள் கிளினிக் UPI ஐடி-க்கு ஏற்ப கியூஆர் குறியீடு உடனடியாக காட்டப்படும்.";
            } else if (currentLang === 'hi') {
              responseText = "💸 भुगतान सहायता: जीपे या फोनपे से भुगतान के लिए 'रिपोर्ट्स' टैब खोलें। वहां क्लिनिक यूपीआई आईडी का डायनामिक क्यूआर कोड मिल जाएगा।";
            } else {
              responseText = "💸 BILLING ASSISTANT: To pay, open the 'Reports' tab or any completed Consultation, and click 'Proceed to UPI Pay'. A dynamic scan-to-pay QR code is generated matching the clinic's UPI ID.";
            }
          } else if (lower.includes('pdf') || lower.includes('download') || lower.includes('prescription') || lower.includes('பதிவிறக்கம்') || lower.includes('சீட்டு') || lower.includes('डाउनलोड')) {
            if (currentLang === 'ta') {
              responseText = "📄 மருந்துச்சீட்டு: கணினியால் உருவாக்கப்பட்ட பிராண்டட் பிடிஎஃப் கோப்புகளை ஆலோசனை பகுதி அல்லது நோயாளி விவரங்கள் பக்கத்தில் இருந்து பதிவிறக்கலாம்.";
            } else if (currentLang === 'hi') {
              responseText = "📄 प्रिस्क्रिप्शन डाउनलोड: ऑरा ओएस परामर्श खंड या मरीज प्रोफ़ाइल कार्ड में स्वचालित रूप से पीडीएफ पर्ची तैयार करता है।";
            } else {
              responseText = "📄 PRESCRIPTION DOWNLOADS: Aura OS compiles computer-generated PDF prescription files inside the Consultation workbench and patient profile cards.";
            }
          } else if (lower.includes('beds') || lower.includes('icu') || lower.includes('bed count') || lower.includes('படுக்கை') || lower.includes('பெட்') || lower.includes('अस्पताल बेड')) {
            if (currentLang === 'ta') {
              responseText = "🏥 படுக்கைகள் கண்காணிப்பு: மருத்துவமனை தேடல் பகுதிக்குச் சென்றால், இந்தியாவில் உள்ள அரசு மற்றும் தனியார் மருத்துவமனைகளின் படுக்கை இருப்பை நீங்கள் நேரடியாக அறியலாம்.";
            } else if (currentLang === 'hi') {
              responseText = "🏥 लाइव बेड ट्रैकिंग: 'अस्पताल खोजक' टैब पर जाएं। यह स्थानीय भारतीय अस्पतालों में आईसीयू और सामान्य बिस्तरों की संख्या दिखाता है।";
            } else {
              responseText = "🏥 LIVE BED MONITORING: You can check live available beds by saying 'Navigate to Hospital Finder'. It tracks both ICU and general admissions across local Indian facilities.";
            }
          } else {
            if (currentLang === 'ta') {
              responseText = `கேள்விக்கு நன்றி! நான் அப்பாயிண்ட்மெண்ட் புக் செய்ய, ஆம்புலன்ஸ் அனுப்ப, அல்லது பக்கங்களை மாற்ற உதவ முடியும். 'அப்பாயிண்ட்மெண்ட் புக் செய்' என்று கூறவும்.`;
            } else if (currentLang === 'hi') {
              responseText = `आपके प्रश्न के लिए धन्यवाद! मैं आपकी क्लिनिकल जरूरतों जैसे अपॉइंटमेंट बुकिंग या एम्बुलेंस प्रेषण के लिए हाजिर हूँ। कृपया कहें 'अपॉइंटमेंट बुक करें'।`;
            } else {
              responseText = "I understand what you're asking! I can help you guide through Aura OS. You can tell me 'Book an appointment tomorrow morning' or 'Take me to Emergency', and I will carry it out instantly.";
            }
          }
        }
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: responseText, isCommand: isCommandExecuted }]);
      speakResponse(responseText, currentLang);
    }, 850);
  };

  const handleSendChat = () => {
    handleSendChatWithInput(chatInput);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="w-80 sm:w-[410px] h-[540px] bg-slate-950/95 backdrop-blur-md border border-cyan-500/30 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.35)] flex flex-col overflow-hidden mb-4"
            id="aura-copilot-container"
          >
            {/* Header */}
            <div className="bg-slate-900 px-4 py-3.5 border-b border-cyan-500/20 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <AIAvatar size="sm" variant={isSpeaking ? 'speaking' : isListening ? 'listening' : 'thinking'} />
                <div>
                  <h4 className="text-xs font-black tracking-wider text-white">AURA SIRI/ALEXA VOICE</h4>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-red-500 animate-ping' : isSpeaking ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                    <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-black">
                      {aiLanguage === 'ta' ? 'தமிழ் குரல் இயக்கம்' : aiLanguage === 'hi' ? 'हिंदी वॉयस एक्टिव' : 'Voice Co-pilot Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Language toggle + TTS Sound / Speak Toggle and Exit */}
              <div className="flex items-center gap-2">
                {/* Assistant Language Selector Button */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 flex gap-1">
                  <button
                    onClick={() => {
                      setAiLanguage('en');
                      setLanguage('en');
                    }}
                    className={`px-1.5 py-0.5 text-[9px] font-black rounded transition ${aiLanguage === 'en' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}
                    title="Switch Siri to English"
                  >
                    EN
                  </button>
                  <button
                    onClick={() => {
                      setAiLanguage('ta');
                      setLanguage('ta');
                    }}
                    className={`px-1.5 py-0.5 text-[9px] font-black rounded transition ${aiLanguage === 'ta' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}
                    title="சிரியை தமிழில் மாற்றவும்"
                  >
                    தமிழ்
                  </button>
                  <button
                    onClick={() => {
                      setAiLanguage('hi');
                      setLanguage('hi');
                    }}
                    className={`px-1.5 py-0.5 text-[9px] font-black rounded transition ${aiLanguage === 'hi' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}
                    title="सिरी को हिंदी में बदलें"
                  >
                    हिंदी
                  </button>
                </div>

                <button
                  onClick={() => {
                    const nextVal = !isTtsEnabled;
                    setIsTtsEnabled(nextVal);
                    if (!nextVal && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }
                    toast.info(nextVal ? 'Siri Voice Synthesis Enabled' : 'Siri Voice Synthesis Muted');
                  }}
                  className={`p-1.5 rounded transition ${isTtsEnabled ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                  title={isTtsEnabled ? 'Mute AI Voice Speech Output' : 'Enable AI Voice Speech Output'}
                  id="tts-sound-toggle-btn"
                >
                  {isTtsEnabled ? <Volume2 size={13} className="animate-pulse" /> : <VolumeX size={13} />}
                </button>

                <button
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                    setIsListening(false);
                    setIsOpen(false);
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Toggle tabs */}
            <div className="flex bg-slate-900/60 border-b border-slate-900 text-xs font-semibold p-1">
              <button
                onClick={() => {
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setActiveTab('chat');
                }}
                className={`flex-1 py-1.5 rounded-md text-center transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'chat' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Command size={12} className="text-cyan-400" />
                {aiLanguage === 'ta' ? 'அலெக்சா / சிரி' : aiLanguage === 'hi' ? 'सिरी / एलेक्सा' : 'Siri/Alexa Assistant'}
              </button>
              <button
                onClick={() => {
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setActiveTab('faq');
                }}
                className={`flex-1 py-1.5 rounded-md text-center transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'faq' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen size={12} />
                {aiLanguage === 'ta' ? 'உதவிக்குறிப்புகள்' : aiLanguage === 'hi' ? 'सामान्य प्रश्न' : `Quick FAQs (${FAQ_DATA.length})`}
              </button>
            </div>

            {/* Content area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 flex flex-col justify-between">
              {activeTab === 'faq' ? (
                <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400/80 mb-1 flex items-center gap-1">
                    <BookOpen size={12} />
                    SYSTEM DOCUMENTATION
                  </div>
                  {FAQ_DATA.map((faq, index) => (
                    <div key={index} className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 hover:border-cyan-500/20 transition-all">
                      <h5 className="text-xs font-bold text-white mb-1">
                        {faq.question[aiLanguage] || faq.question['en']}
                      </h5>
                      <p className="text-xxs text-slate-400 leading-relaxed">
                        {faq.answer[aiLanguage] || faq.answer['en']}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-grow flex flex-col justify-between h-full space-y-3 overflow-hidden">
                  
                  {/* Siri Wave Audio Pulse when listening or speaking */}
                  {(isListening || isSpeaking) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-2.5 flex items-center justify-between gap-3 shrink-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`}></span>
                        <span className="text-[10px] font-mono font-bold text-slate-300">
                          {isListening 
                            ? (aiLanguage === 'ta' ? 'ஆரா குரலைக் கேட்கிறது...' : aiLanguage === 'hi' ? 'ऑरा सुन रही है...' : 'AURA IS LISTENING...') 
                            : (aiLanguage === 'ta' ? 'ஆரா பேசுகிறது...' : aiLanguage === 'hi' ? 'ऑरा बोल रही है...' : 'ALEXA/SIRI TALKING...')}
                        </span>
                      </div>
                      
                      {/* Bouncing spectrum lines */}
                      <div className="flex items-end gap-0.5 h-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ height: isListening ? [2, 12, 2] : [2, 8, 2] }}
                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                            className={`w-0.5 rounded-full ${isListening ? 'bg-red-400' : 'bg-cyan-400'}`}
                            style={{ height: '2px' }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Messages container */}
                  <div className="flex-grow space-y-2.5 overflow-y-auto pr-1">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col max-w-[85%] rounded-xl p-2.5 text-xxs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-cyan-500/15 border border-cyan-500/30 text-white self-end ml-auto rounded-tr-none shadow-[0_2px_10px_rgba(6,182,212,0.1)]'
                            : msg.isCommand
                            ? 'bg-emerald-950/25 border border-emerald-500/40 text-emerald-200 self-start mr-auto rounded-tl-none shadow-[0_2px_10px_rgba(16,185,129,0.1)]'
                            : 'bg-slate-900/80 border border-slate-800 text-slate-300 self-start mr-auto rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-1">
                          <div className="flex items-center gap-1">
                            {msg.sender === 'user' ? (
                              <>
                                <Users size={10} className="text-cyan-500" />
                                <span>{aiLanguage === 'ta' ? 'நோயாளி / பயனர்' : aiLanguage === 'hi' ? 'उपयोगकर्ता' : 'USER dictation'}</span>
                              </>
                            ) : msg.isCommand ? (
                              <>
                                <Sparkles size={10} className="text-emerald-400" />
                                <span className="text-emerald-400 font-extrabold">{aiLanguage === 'ta' ? 'ஆரா வெற்றிகரமாக புக் செய்தது' : aiLanguage === 'hi' ? 'ऑरा कार्रवाई दर्ज' : 'AURA ACTION COMPLETE'}</span>
                              </>
                            ) : (
                              <>
                                <Command size={10} className="text-cyan-400 animate-pulse" />
                                <span>{aiLanguage === 'ta' ? 'ஆரா அலெக்சா உதவியாளர்' : aiLanguage === 'hi' ? 'ऑரா एलेक्सा असिस्टेंट' : 'Aura Alexa Copilot'}</span>
                              </>
                            )}
                          </div>
                          
                          {/* Speak button in the header of each message bubble */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakResponse(msg.text);
                            }}
                            className="p-1 -mr-1 rounded hover:bg-slate-950 text-cyan-400 hover:text-cyan-300 transition"
                            title="கேட்கவும் / Play Voice"
                          >
                            <Volume2 size={10} />
                          </button>
                        </div>
                        <div className="whitespace-pre-line">{msg.text}</div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input form with Microphone */}
                  <div className="pt-2 border-t border-slate-900/80 flex gap-1.5 items-center shrink-0">
                    {/* Siri Speech-To-Text mic launcher button */}
                    <button
                      onClick={toggleListening}
                      className={`p-2 rounded-lg transition-all ${
                        isListening
                          ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800'
                      }`}
                      title={aiLanguage === 'ta' ? 'தமிழில் பேச மைக் ஆன் செய்யவும்' : aiLanguage === 'hi' ? 'हिंदी में बात करने के लिए माइक दबाएं' : 'Speak with Speech-to-Text (Alexa & Siri Mode)'}
                      id="speech-recognition-btn"
                    >
                      {isListening ? <MicOff size={13} className="animate-pulse" /> : <Mic size={13} />}
                    </button>

                    <input
                      type="text"
                      placeholder={
                        isListening 
                          ? (aiLanguage === 'ta' ? "கேட்கிறது..." : aiLanguage === 'hi' ? "सुन रहा हूँ..." : "Listening...") 
                          : (aiLanguage === 'ta' ? "தமிழில் அப்பாயிண்ட்மெண்ட் புக் செய்ய கேளுங்கள்..." : aiLanguage === 'hi' ? "हिंदी में सवाल पूछें या अपॉइंटमेंट बुक करें..." : "Ask Aura to book appointments, clear queue...")
                      }
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      disabled={isListening}
                      className="flex-grow bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xxs focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
                    />

                    <button
                      onClick={handleSendChat}
                      disabled={isListening}
                      className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 text-black hover:from-cyan-400 hover:to-blue-500 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.3)] transition shrink-0"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher Button (Pulsing Avatar) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 rounded-full bg-slate-900 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] cursor-pointer transition flex items-center justify-center w-12 h-12"
        id="aura-copilot-launcher-btn"
      >
        <AIAvatar size="lg" variant={isOpen ? 'thinking' : 'idle'} />
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
};
