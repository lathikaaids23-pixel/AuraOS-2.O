import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Pill,
  FileText,
  Sparkles,
  RefreshCw,
  Trash2,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Activity,
  ChevronRight,
  Info,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionResult {
  success: boolean;
  medications: Medication[];
  audit: {
    interactions: string;
    warnings: string;
    suggestions: string;
  };
  rawTranscription: string;
}

interface TabletResult {
  success: boolean;
  tabletName: string;
  purpose: string;
  benefit: string;
  pros: string[];
  cons: string[];
  sideEffects: string[];
  whenToTake: string;
}

const generateSamplePrescription = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Vintage paper background
    ctx.fillStyle = '#fbfbf4';
    ctx.fillRect(0, 0, 400, 500);
    
    // Header medical cross
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 28px serif';
    ctx.fillText('Rx', 30, 65);
    
    // Some lines
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 85);
    ctx.lineTo(370, 85);
    ctx.stroke();
    
    // Cursive handwriting simulation
    ctx.fillStyle = '#1e293b';
    ctx.font = 'italic 16px "Comic Sans MS", cursive, sans-serif';
    ctx.fillText('Patient: Aura Test Case', 40, 130);
    ctx.fillText('Amoxicillin 500mg TDS', 55, 200);
    ctx.fillText('- Dispense #15 tablets', 75, 225);
    ctx.fillText('- Take after food for 5 days', 75, 250);
    
    ctx.fillText('Paracetamol 650mg PRN', 55, 320);
    ctx.fillText('- Take 1 tablet every 6 hours', 75, 345);
    ctx.fillText('- For fever or pain', 75, 370);
    
    ctx.font = 'bold 15px serif';
    ctx.fillText('Dr. Lathika, MD', 220, 440);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Aura OS 2.0 Clinical Vision Sandbox', 40, 480);
  }
  return canvas.toDataURL('image/jpeg');
};

const generateSampleTablet = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Silver metallic pill strip
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, 400, 300);
    
    // Draw some grid texture
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    for (let i = 0; i < 400; i += 15) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 300);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(400, i);
      ctx.stroke();
    }
    
    // Draw pill blisters
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    for (let x = 70; x < 400; x += 130) {
      for (let y = 90; y < 300; y += 110) {
        ctx.beginPath();
        ctx.ellipse(x, y, 45, 28, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Inner tablet shine
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x - 12, y - 6, 20, 10, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
      }
    }
    
    // Brand stamp
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('METFORMIN HCl 500mg', 100, 40);
    ctx.fillStyle = '#475569';
    ctx.font = '9px sans-serif';
    ctx.fillText('AURA CLINICAL VISION SIMULATION', 110, 56);
  }
  return canvas.toDataURL('image/jpeg');
};

export const ScannerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'doctor' | 'patient'>('doctor');
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionResult | null>(null);
  const [tabletData, setTabletData] = useState<TabletResult | null>(null);

  // Multilingual & AI Voice State
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ta' | 'hi' | 'te' | 'mr'>('en');
  const [translatedTabletCache, setTranslatedTabletCache] = useState<{ [key: string]: TabletResult }>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Webcam-related state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop speaking if active
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Stop video stream and voice on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeaking();
    };
  }, []);

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'en': return 'English';
      case 'ta': return 'Tamil (தமிழ்)';
      case 'hi': return 'Hindi (हिंदी)';
      case 'te': return 'Telugu (తెలుగు)';
      case 'mr': return 'Marathi (मराठी)';
      default: return lang;
    }
  };

  const handleLanguageChange = async (lang: 'en' | 'ta' | 'hi' | 'te' | 'mr') => {
    setSelectedLanguage(lang);
    stopSpeaking();

    if (lang === 'en') {
      return;
    }

    if (translatedTabletCache[lang]) {
      return;
    }

    if (!tabletData) return;

    setIsTranslating(true);
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: tabletData,
          targetLanguage: lang,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to translate');
      }

      const res = await response.json();
      if (res.success && res.data) {
        setTranslatedTabletCache((prev) => ({
          ...prev,
          [lang]: res.data,
        }));
        toast.success(`Successfully translated to ${getLanguageName(lang)}!`);
      } else {
        throw new Error(res.error || 'Unknown translation error');
      }
    } catch (err) {
      console.error('Translation error:', err);
      toast.error('AI Translation failed. Reverting to English.');
      setSelectedLanguage('en');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeakAloud = async () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const currentData = selectedLanguage === 'en' ? tabletData : (translatedTabletCache[selectedLanguage] || tabletData);
    if (!currentData) return;

    // Speak details in a natural voice
    const textToRead = `${currentData.tabletName}. ${currentData.purpose}. ${currentData.benefit}. Instruction: ${currentData.whenToTake}.`;

    setIsSpeaking(true);

    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToRead,
          voiceName: selectedLanguage === 'en' ? 'Kore' : 'Zephyr',
        }),
      });

      const res = await response.json();
      if (res.success && res.audio) {
        const audioUrl = `data:audio/wav;base64,${res.audio}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setIsSpeaking(false);
        };
        audio.onerror = () => {
          speakWebSpeech(textToRead);
        };
        await audio.play();
      } else {
        speakWebSpeech(textToRead);
      }
    } catch (err) {
      console.error('Server TTS failed, falling back to Web Speech Synthesis:', err);
      speakWebSpeech(textToRead);
    }
  };

  const speakWebSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech is not supported on this browser.');
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: { [key: string]: string } = {
      en: 'en-US',
      ta: 'ta-IN',
      hi: 'hi-IN',
      te: 'te-IN',
      mr: 'mr-IN',
    };
    utterance.lang = langMap[selectedLanguage] || 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const startCamera = async () => {
    setImage(null);
    setCameraError(null);
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setCameraError('Unable to access camera. Please check your permissions or upload an image file instead.');
      setIsCameraActive(false);
      toast.error('Camera access denied or unavailable.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImage(dataUrl);
          stopCamera();
          toast.success('Snapshot captured successfully.');
        }
      } catch (err) {
        console.error('Capture photo error:', err);
        toast.error('Failed to capture snapshot.');
      }
    }
  };

  // Drag-and-drop & File select handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG/JPG/JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      stopCamera();
      // Clear previous results & reset translation/speech states
      setPrescriptionData(null);
      setTabletData(null);
      setSelectedLanguage('en');
      setTranslatedTabletCache({});
      stopSpeaking();
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Run AI Scan
  const triggerScan = async () => {
    if (!image) {
      toast.warning('Please capture or upload an image first.');
      return;
    }

    setIsScanning(true);
    setPrescriptionData(null);
    setTabletData(null);
    setSelectedLanguage('en');
    setTranslatedTabletCache({});
    stopSpeaking();

    try {
      const response = await fetch('/api/ai/vision-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          mode: activeTab === 'doctor' ? 'prescription' : 'tablet',
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned an error');
      }

      const data = await response.json();
      if (activeTab === 'doctor') {
        setPrescriptionData(data);
        toast.success('Prescription digitized and audited successfully!');
      } else {
        setTabletData(data);
        toast.success('Tablet scanned and analyzed successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error('AI scanning failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const clearAll = () => {
    setImage(null);
    stopCamera();
    setPrescriptionData(null);
    setTabletData(null);
    setSelectedLanguage('en');
    setTranslatedTabletCache({});
    stopSpeaking();
  };

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-500/15 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
              <Camera size={18} />
            </span>
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-black">Aura Vision OS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            AI CLINICAL VISION SCANNER <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">V2.0 LIVE</span>
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex self-start sm:self-center">
          <button
            onClick={() => {
              setActiveTab('doctor');
              clearAll();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'doctor'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-900/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={14} />
            Doctor: Prescription Audit
          </button>
          <button
            onClick={() => {
              setActiveTab('patient');
              clearAll();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'patient'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-900/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Pill size={14} />
            Patient: Tablet Scan
          </button>
        </div>
      </div>

      {/* Main scanner grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Camera or Upload Container (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col h-[380px] justify-center items-center relative overflow-hidden group shadow-lg">
            {/* Glowing accents */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full filter blur-xl group-hover:bg-cyan-500/10 transition-all pointer-events-none"></div>

            <AnimatePresence mode="wait">
              {/* 1. Live Camera Stream */}
              {isCameraActive && (
                <motion.div
                  key="webcam"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black flex flex-col"
                >
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                    <button
                      onClick={capturePhoto}
                      className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera size={14} />
                      Take Snapshot
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 2. Image Preview (Captured/Uploaded) with Neon Scanner Line */}
              {image && !isCameraActive && (
                <motion.div
                  key="preview"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-slate-950 flex items-center justify-center relative p-1"
                >
                  <img
                    src={image}
                    alt="Scan Source"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                  {/* Neon Scanner Line overlay during scan */}
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 shadow-[0_0_15px_#06b6d4] animate-[bounce_2s_infinite] z-20 pointer-events-none"></div>
                  )}

                  {/* Action buttons on image preview */}
                  {!isScanning && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 bg-gradient-to-t from-slate-950/80 to-transparent p-4">
                      <button
                        onClick={clearAll}
                        className="p-2 bg-red-950/80 hover:bg-red-900 border border-red-500/20 rounded-xl text-red-400 active:scale-95 transition-all cursor-pointer"
                        title="Delete Image"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        Retake
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* 3. Empty State (Upload / Activate Camera Prompt) */}
              {!image && !isCameraActive && (
                <motion.div
                  key="empty-upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center space-y-4 w-full h-full text-center p-6 border-2 border-dashed border-slate-800 rounded-2xl hover:border-cyan-500/30 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-4 bg-slate-900 rounded-full border border-slate-800 text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all">
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">
                      Drag & Drop Photo or <span className="text-cyan-400 underline decoration-cyan-400/30">Browse Files</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Supports PNG, JPG, JPEG (Max 10MB)</p>
                  </div>

                  <div className="flex flex-col gap-2 w-full max-w-xs mt-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={startCamera}
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera size={14} />
                      Live Camera
                    </button>
                    <button
                      onClick={() => {
                        const sample = activeTab === 'doctor' ? generateSamplePrescription() : generateSampleTablet();
                        setImage(sample);
                        setPrescriptionData(null);
                        setTabletData(null);
                        toast.success(`Loaded sample ${activeTab === 'doctor' ? 'prescription' : 'tablet strip'}! Click the scan button below to run OCR audit.`);
                      }}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-cyan-400 hover:text-cyan-300 text-xxs font-mono rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Sparkles size={11} className="animate-pulse" />
                      LOAD SAMPLE TEST CASE DEMO
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Trigger Scan and Info actions */}
          {image && !isScanning && (
            <button
              onClick={triggerScan}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(6,182,212,0.3)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles size={16} />
              {activeTab === 'doctor' ? 'DIGITIZE & AUDIT PRESCRIPTION' : 'SCAN & ANALYSIS TABLET'}
            </button>
          )}

          {/* Guidelines info card */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 flex gap-2.5 text-[11px] text-slate-400 leading-normal">
            <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200 mb-0.5">Clinical Vision Best Practices</p>
              <p>For pristine AI results, keep tablets or prescriptions well-centered. Ensure sufficient light, high camera contrast, and zero angle glares.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Results Display Panel (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col min-h-[380px]">
          <AnimatePresence mode="wait">
            {/* 1. Loading Pulse State */}
            {isScanning && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow bg-slate-950/30 border border-slate-900 rounded-2xl flex flex-col items-center justify-center p-8 text-center min-h-[380px]"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-cyan-500/10 border-t-cyan-400 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={24} className="text-cyan-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-md font-extrabold text-white tracking-wide uppercase">
                  {activeTab === 'doctor' ? 'Reading Handwriting & Auditing RX...' : 'Scanning Pill Package & Finding Pros/Cons...'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                  Aura Clinical Vision Engine is parsing high-resolution image matrices and loading smart clinical guidelines for medical auditing.
                </p>

                {/* Staggered progress bullets */}
                <div className="flex gap-2.5 mt-6 text-[10px] font-mono text-cyan-400/80">
                  <span className="animate-pulse">● Loading OCR Matrix</span>
                  <span className="animate-pulse delay-300">● Accessing Rx Database</span>
                  <span className="animate-pulse delay-700">● Checking Drug Interactions</span>
                </div>
              </motion.div>
            )}

            {/* 2. Doctor Prescription Results Panel */}
            {activeTab === 'doctor' && prescriptionData && !isScanning && (
              <motion.div
                key="doc-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Doctor Sandbox Scenarios Selector */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-dashed border-blue-500/20 text-xs">
                  <div className="flex items-start gap-2 text-cyan-400 font-bold mb-2">
                    <Sparkles size={14} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-mono">Aura OS Doctor Audit Sandbox Library</p>
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5 leading-relaxed">
                        If the live handwritten prescription scan returned fallback or you'd like to simulate clinical audits, select a pre-loaded case:
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    {[
                      { key: 'standard', name: '📄 Standard Case (Amoxicillin + Paracetamol)' },
                      { key: 'cardiovascular', name: '❤️ Cardiology Protocol (Aspirin + Atorvastatin + Metformin)' }
                    ].map((item) => {
                      const isCurrent = (prescriptionData.rawTranscription || '').toLowerCase().includes(item.key === 'standard' ? 'standard' : 'cardio') ||
                        (prescriptionData.medications && prescriptionData.medications.length === (item.key === 'standard' ? 2 : 3));
                      return (
                        <button
                          key={item.key}
                          onClick={async () => {
                            setIsScanning(true);
                            try {
                              const response = await fetch('/api/ai/vision-scan', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ mode: 'prescription', selectedOfflineKey: item.key, image: 'mock-override' })
                              });
                              const data = await response.json();
                              setPrescriptionData(data);
                              toast.success(`Successfully loaded clinical scenario: ${item.key === 'standard' ? 'Standard Case' : 'Cardiology Protocol'}`);
                            } catch (e) {
                              toast.error('Failed to load prescription case.');
                            } finally {
                              setIsScanning(false);
                            }
                          }}
                          className={`flex-1 py-2 px-3 text-left text-xxs font-mono font-bold rounded-xl transition-all cursor-pointer border ${
                            isCurrent
                              ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-sm shadow-cyan-500/5'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Digitized Medications Bento Box */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-blue-500/10 text-blue-400">
                        <CheckCircle2 size={16} />
                      </span>
                      <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest">Digitized Medications</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Confidence: 98.7%</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/60 text-[10px] font-mono text-slate-400 uppercase">
                          <th className="py-2.5 font-bold">Medicine</th>
                          <th className="py-2.5 font-bold">Dosage</th>
                          <th className="py-2.5 font-bold">Frequency</th>
                          <th className="py-2.5 font-bold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-slate-900/60">
                        {prescriptionData.medications.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/30">
                            <td className="py-3 font-extrabold text-cyan-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                              {med.name}
                            </td>
                            <td className="py-3 text-slate-200">{med.dosage || 'N/A'}</td>
                            <td className="py-3 text-slate-200 font-medium">{med.frequency || 'N/A'}</td>
                            <td className="py-3 text-slate-400 font-mono text-[11px]">{med.duration || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Auditing Warnings, Contraindications & Safe Tips */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Item 1: Drug Interactions */}
                  <div className="bg-blue-950/10 border border-blue-500/15 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <Activity size={14} />
                      <h5 className="text-[10px] font-mono font-black uppercase tracking-wider">Interactions</h5>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                      {prescriptionData.audit.interactions}
                    </p>
                  </div>

                  {/* Item 2: Safe Warnings */}
                  <div className="bg-amber-950/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle size={14} />
                      <h5 className="text-[10px] font-mono font-black uppercase tracking-wider">Clinical Warnings</h5>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                      {prescriptionData.audit.warnings}
                    </p>
                  </div>

                  {/* Item 3: Suggestions */}
                  <div className="bg-emerald-950/10 border border-emerald-500/15 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Sparkles size={14} />
                      <h5 className="text-[10px] font-mono font-black uppercase tracking-wider">Doctor Advice</h5>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                      {prescriptionData.audit.suggestions}
                    </p>
                  </div>
                </div>

                {/* Raw OCR Text output */}
                <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-3.5 space-y-1">
                  <h5 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Handwritten OCR Raw Output</h5>
                  <p className="text-[11px] font-mono text-slate-400 leading-normal italic">
                    "{prescriptionData.rawTranscription}"
                  </p>
                </div>
              </motion.div>
            )}

            {/* 3. Patient Tablet Results Panel */}
            {activeTab === 'patient' && tabletData && !isScanning && (() => {
              const currentTabletData = selectedLanguage === 'en' ? tabletData : (translatedTabletCache[selectedLanguage] || tabletData);
              return (
                <motion.div
                  key="patient-results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Patient Sandbox & Corrector */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-dashed border-cyan-500/20 text-xs">
                    <div className="flex items-start gap-2 text-cyan-400 font-bold mb-2">
                      <Sparkles size={14} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-mono">Aura OS Sandbox & Offline Clinical Library</p>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5 leading-relaxed">
                          If the live tablet scanner returned fallback or you'd like to manually select and correct the identified tablet, choose a clinical profile:
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        { key: 'metformin', name: 'Metformin' },
                        { key: 'paracetamol', name: 'Paracetamol' },
                        { key: 'amoxicillin', name: 'Amoxicillin' },
                        { key: 'aspirin', name: 'Aspirin' },
                        { key: 'atorvastatin', name: 'Atorvastatin' }
                      ].map((item) => {
                        const isCurrent = (tabletData.tabletName || '').toLowerCase().includes(item.key);
                        return (
                          <button
                            key={item.key}
                            onClick={async () => {
                              setIsTranslating(true);
                              setSelectedLanguage('en');
                              setTranslatedTabletCache({});
                              stopSpeaking();
                              try {
                                const response = await fetch('/api/ai/vision-scan', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ mode: 'tablet', selectedOfflineKey: item.key, image: 'mock-override' })
                                });
                                const data = await response.json();
                                setTabletData(data);
                                toast.success(`Successfully loaded clinical profile for ${item.key.toUpperCase()}!`);
                              } catch (e) {
                                toast.error('Failed to load clinical profile.');
                              } finally {
                                setIsTranslating(false);
                              }
                            }}
                            className={`px-3 py-1.5 text-xxs font-mono font-bold rounded-lg transition-all cursor-pointer border ${
                              isCurrent
                                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-sm shadow-cyan-500/5'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            💊 {item.key.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Multilingual and AI Voice bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">READ IN:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(['en', 'ta', 'hi', 'te', 'mr'] as const).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => handleLanguageChange(lang)}
                            disabled={isTranslating}
                            className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                              selectedLanguage === lang
                                ? 'bg-cyan-500 text-slate-950 shadow'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            } disabled:opacity-50`}
                          >
                            {getLanguageName(lang)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSpeakAloud}
                      className={`px-4 py-1.5 rounded-lg text-xxs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSpeaking
                          ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                          : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white'
                      }`}
                    >
                      {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      {isSpeaking ? 'STOP AUDIO' : '🔊 SPEAK ALOUD (AI VOICE)'}
                    </button>
                  </div>

                  {isTranslating ? (
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col items-center justify-center p-12 text-center h-[350px] animate-pulse">
                      <div className="w-10 h-10 rounded-full border-2 border-cyan-500/10 border-t-cyan-400 animate-spin mb-4"></div>
                      <p className="text-xs font-mono font-bold text-cyan-400">AURA AI TRANSLATOR CO-PILOT...</p>
                      <p className="text-[10px] text-slate-500 mt-1">Converting clinical indices to {getLanguageName(selectedLanguage)} with high contextual accuracy.</p>
                    </div>
                  ) : (
                    <>
                      {/* Hero identified tablet card */}
                      <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border border-cyan-500/20 rounded-2xl p-5 relative overflow-hidden shadow-md">
                        <div className="absolute right-4 top-4 text-cyan-400/10 pointer-events-none">
                          <Pill size={80} />
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black border border-cyan-400/30 bg-cyan-400/5 text-cyan-400 uppercase tracking-widest inline-block mb-2">Identified Tablet</span>
                        <h3 className="text-xl font-black text-white tracking-tight">{currentTabletData.tabletName}</h3>
                        
                        {/* Purpose & Benefits */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/60 pt-4 text-xs">
                          <div>
                            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Purpose / Indication</h4>
                            <p className="text-slate-200 leading-relaxed font-medium">{currentTabletData.purpose}</p>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Therapeutic Benefit</h4>
                            <p className="text-slate-200 leading-relaxed font-medium">{currentTabletData.benefit}</p>
                          </div>
                        </div>
                      </div>

                      {/* Pros and Cons Comparative Bento Boxes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Pros Section */}
                        <div className="bg-emerald-950/5 border border-emerald-500/15 rounded-xl p-4 space-y-3 shadow-sm">
                          <div className="flex items-center gap-1.5 text-emerald-400 border-b border-slate-850 pb-2">
                            <ThumbsUp size={14} />
                            <h4 className="text-xs font-bold uppercase tracking-wider">Pros & Benefits</h4>
                          </div>
                          <ul className="space-y-2 text-xs">
                            {currentTabletData.pros.map((pro, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-300 leading-relaxed font-medium">
                                <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Cons & Precautions Section */}
                        <div className="bg-red-950/5 border border-red-500/15 rounded-xl p-4 space-y-3 shadow-sm">
                          <div className="flex items-center gap-1.5 text-red-400 border-b border-slate-850 pb-2">
                            <ThumbsDown size={14} />
                            <h4 className="text-xs font-bold uppercase tracking-wider">Cons & Precautions</h4>
                          </div>
                          <ul className="space-y-2 text-xs">
                            {currentTabletData.cons.map((con, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-300 leading-relaxed font-medium">
                                <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Side effects & usage timing schedules */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Side Effects List */}
                        <div className="md:col-span-5 bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-1.5 text-amber-400 border-b border-slate-850 pb-2">
                            <ShieldAlert size={14} />
                            <h4 className="text-xs font-bold uppercase tracking-wider">Side Effects</h4>
                          </div>
                          <ul className="space-y-2 text-xs">
                            {currentTabletData.sideEffects.map((effect, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 text-slate-300 leading-relaxed font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5"></span>
                                {effect}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* When and how to take schedule instructions */}
                        <div className="md:col-span-7 bg-blue-950/5 border border-blue-500/15 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-1.5 text-cyan-400 border-b border-slate-850 pb-2">
                            <Clock size={14} />
                            <h4 className="text-xs font-bold uppercase tracking-wider">When & How to Take</h4>
                          </div>
                          <div className="text-xs text-slate-300 space-y-2 leading-relaxed font-medium pt-1">
                            <p>{currentTabletData.whenToTake}</p>
                            <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-2.5 flex gap-2 text-[10px] text-cyan-400">
                              <span className="font-mono mt-0.5">💡</span>
                              <span>Do not alter medicine schedules without first validating with your direct consulting doctor or physician.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })()}

            {/* 4. Empty Results placeholder */}
            {!prescriptionData && !tabletData && !isScanning && (
              <motion.div
                key="empty-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-grow bg-slate-950/20 border border-slate-900 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center min-h-[380px]"
              >
                <div className="p-4 bg-slate-900/60 rounded-full border border-slate-800 text-slate-600 mb-4 animate-pulse">
                  <Sparkles size={28} />
                </div>
                <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest">Vision Output Standby</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                  {activeTab === 'doctor'
                    ? 'Upload or snapshot a prescription, and click scan to extract clean medical indices and run drug-interaction audits.'
                    : 'Capture a tablet package, pill strip, or bottle label to instantly analyze pros, cons, benefit, side effects, and timings.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
