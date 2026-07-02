import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import { AIAvatar } from './AIAvatar';
import { MessageSquare, X, Send, BookOpen, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
      hi: 'मैं दवा पर्ची और बिल रसीद कैसे डाउनलोड करूँ?',
    },
    answer: {
      en: 'On patient details, completed consultations, or payments summaries, click the cyan "Download PDF" buttons. Elegant, branded, computer-generated PDFs are generated containing all clinical itemization, ready to print.',
      ta: 'நோயாளியின் விவரங்கள் அல்லது கட்டணச் சுருக்கத்தில் உள்ள "Download PDF" பட்டனை அழுத்தவும். உங்களது கிளினிக் பிராண்ட் விவரங்களுடன் கூடிய பிடிஎஃப் கோப்பு தானாகவே பதிவிறக்கம் செய்ய தயாராகிவிடும்.',
      hi: 'मरीज के विवरण या बिल भुगतान के विवरण में दिए "पीडीएफ डाउनलोड करें" बटन पर क्लिक करें। क्लिनिक के ब्रांड के साथ सुंदर पीडीएफ रसीद प्रिंट करने के लिए तुरंत डाउनलोड हो जाएगी।',
    },
  },
];

export const AIHelperWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'chat'>('faq');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Namaste! I am your Aura Clinical Assistant. How can I help you navigate the system today?' },
  ]);
  const { language } = useTranslation();

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    // Simulate smart support answering
    setTimeout(() => {
      let responseText = "I'm analyzing your request. Aura OS supports electronic health records, live Indian hospital databases, and real-time ambulance tracking. Try exploring the sections on the sidebar navigation!";
      
      const lower = userText.toLowerCase();
      if (lower.includes('sos') || lower.includes('emergency') || lower.includes('ambulance') || lower.includes('accident')) {
        responseText = "🚨 EMERGENCY NOTICE: Please click the EMERGENCY tab in the navigation rail immediately to dispatch an ambulance or call our WhatsApp support line directly at 87380 30604.";
      } else if (lower.includes('pay') || lower.includes('upi') || lower.includes('gpay') || lower.includes('barcode') || lower.includes('qr')) {
        responseText = "💸 BILLING ASSISTANT: When booking an appointment, you can click 'Proceed to UPI Pay'. It displays a GPay-PhonePe QR code connected to the clinic's UPI ID. Once paid, click 'Download PDF' for a formal branded receipt.";
      } else if (lower.includes('pdf') || lower.includes('prescription') || lower.includes('download')) {
        responseText = "📄 PDF DOWNLOADER: You can download computer-generated branded prescription and receipt PDFs inside the 'Consultation' view and 'Patients' detail cards.";
      } else if (lower.includes('hospital') || lower.includes('cheap') || lower.includes('cost')) {
        responseText = "🏥 HOSPITAL FINDER: Use the 'Hospital Finder' tab. You can compare Government and Private hospitals side-by-side, check ratings, cost indices, insurance, and consult the AI matching helper.";
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: responseText }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="w-80 sm:w-96 h-[500px] bg-slate-950/95 backdrop-blur-md border border-cyan-500/30 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-slate-900 px-4 py-3.5 border-b border-cyan-500/20 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <AIAvatar size="sm" variant="thinking" />
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">AURA OS COPILOT</h4>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-mono">Multilingual Agent · Online</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Toggle tabs */}
            <div className="flex bg-slate-900/60 border-b border-slate-900 text-xs font-semibold p-1">
              <button
                onClick={() => setActiveTab('faq')}
                className={`flex-1 py-1.5 rounded-md text-center transition ${
                  activeTab === 'faq' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Quick FAQs
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-1.5 rounded-md text-center transition ${
                  activeTab === 'chat' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live Support AI
              </button>
            </div>

            {/* Content area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
              {activeTab === 'faq' ? (
                <div className="space-y-3">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400/80 mb-1 flex items-center gap-1">
                    <BookOpen size={12} />
                    SYSTEM DOCUMENTATION
                  </div>
                  {FAQ_DATA.map((faq, index) => (
                    <div key={index} className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 hover:border-cyan-500/20 transition-all">
                      <h5 className="text-xs font-bold text-white mb-1">
                        {faq.question[language] || faq.question['en']}
                      </h5>
                      <p className="text-xxs text-slate-400 leading-relaxed">
                        {faq.answer[language] || faq.answer['en']}
                      </p>
                      {faq.category === 'emergency' && (
                        <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-between items-center">
                          <span className="text-[9px] font-mono text-emerald-400">WhatsApp AI Chatbot Available</span>
                          <a
                            href="https://wa.me/918738030604"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] font-bold text-cyan-400 hover:underline flex items-center gap-0.5"
                          >
                            Open Chat <ExternalLink size={8} />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 flex flex-col justify-between h-full">
                  {/* Messages container */}
                  <div className="flex-grow space-y-2.5 overflow-y-auto pr-1">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col max-w-[85%] rounded-xl p-2.5 text-xxs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-cyan-500/10 border border-cyan-500/30 text-white self-end ml-auto rounded-tr-none'
                            : 'bg-slate-900/80 border border-slate-800 text-slate-300 self-start mr-auto rounded-tl-none'
                        }`}
                      >
                        <span className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-1">
                          {msg.sender === 'user' ? 'YOU' : 'AURA COPILOT'}
                        </span>
                        {msg.text}
                      </div>
                    ))}
                  </div>

                  {/* Input form */}
                  <div className="pt-2 border-t border-slate-900 flex gap-1.5 items-center">
                    <input
                      type="text"
                      placeholder="Ask copilot helper..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      className="flex-grow bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xxs focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      onClick={handleSendChat}
                      className="p-2 bg-cyan-500 text-black hover:bg-cyan-400 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.3)] transition"
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

      {/* Launcher Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 rounded-full bg-slate-900 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] cursor-pointer transition flex items-center justify-center"
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
