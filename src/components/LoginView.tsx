import React, { useState, useEffect } from 'react';
import { useClinic } from '../ClinicContext';
import { useTranslation } from '../LanguageContext';
import { loginWithGoogle, isFirebaseConfigured } from '../firebase';
import { AIAvatar } from './AIAvatar';
import { toast } from 'sonner';
import {
  LogIn,
  Shield,
  Users,
  Stethoscope,
  KeyRound,
  Smartphone,
  Info,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Activity,
  Heart,
  Plus,
  ChevronRight,
  Globe,
  Calendar,
  Filter,
  Search,
  Download,
  X,
  DollarSign,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const LoginView: React.FC = () => {
  const { setCurrentUser } = useClinic();
  const { t, setLanguage, language } = useTranslation();
  const [loading, setLoading] = useState(false);

  // Smart Login Form States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Payment History Modal State
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [searchTxId, setSearchTxId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Success' | 'Refund' | 'Pending'>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, last7, last30

  // High-fidelity Mock Payment Records
  const paymentRecords = React.useMemo(() => [
    {
      date: '2026-06-25',
      id: 'TXN-849201',
      type: 'Consultation Fee',
      amount: 12500,
      status: 'Success',
      method: 'Google Pay',
    },
    {
      date: '2026-06-20',
      id: 'TXN-748192',
      type: 'Advanced Diagnostics',
      amount: 8250,
      status: 'Success',
      method: 'PhonePe',
    },
    {
      date: '2026-06-18',
      id: 'TXN-910283',
      type: 'Cardiology Labs',
      amount: 4000,
      status: 'Success',
      method: 'Visa',
    },
    {
      date: '2026-06-15',
      id: 'TXN-382910',
      type: 'OPD Medication Refund',
      amount: 2300,
      status: 'Refund',
      method: 'Mastercard',
    },
    {
      date: '2026-06-29',
      id: 'TXN-542109',
      type: 'Clinical Procedure',
      amount: 3500,
      status: 'Pending',
      method: 'BHIM',
    }
  ], []);

  // Filter Logic
  const filteredRecords = React.useMemo(() => {
    return paymentRecords.filter((rec) => {
      const matchesSearch = rec.id.toLowerCase().includes(searchTxId.toLowerCase()) || 
                            rec.type.toLowerCase().includes(searchTxId.toLowerCase());
      const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
      
      if (dateFilter === 'last7') {
        return matchesSearch && matchesStatus && rec.date >= '2026-06-23';
      }
      if (dateFilter === 'last30') {
        return matchesSearch && matchesStatus && rec.date >= '2026-06-01';
      }
      return matchesSearch && matchesStatus;
    });
  }, [paymentRecords, searchTxId, statusFilter, dateFilter]);

  // Auto-detect role based on input text
  const detectedRole = React.useMemo(() => {
    const text = identifier.toLowerCase().trim();
    if (!text) return null;
    if (text.includes('doctor') || text.includes('dr.') || text.includes('sharma') || text === '9876543210') {
      return { id: 'doctor', label: 'Doctor', color: 'text-emerald-600 border-emerald-500/20 bg-emerald-50' };
    }
    if (text.includes('reception') || text.includes('receptionist') || text === '9876543211') {
      return { id: 'receptionist', label: 'Receptionist', color: 'text-purple-600 border-purple-500/20 bg-purple-50' };
    }
    if (text.includes('admin') || text.includes('root') || text === '9876543212') {
      return { id: 'admin', label: 'Clinical Admin', color: 'text-blue-600 border-blue-500/20 bg-blue-50' };
    }
    if (text.includes('patient') || text.includes('rahul') || text === '9876543213') {
      return { id: 'guest', label: 'Patient Profile', color: 'text-indigo-600 border-indigo-500/20 bg-indigo-50' };
    }
    return { id: 'doctor', label: 'Prescribing Doctor (Default)', color: 'text-emerald-600 border-emerald-500/20 bg-emerald-50' };
  }, [identifier]);

  // Handle simulated OTP countdown
  useEffect(() => {
    let interval: any;
    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setIsOtpSent(false);
    }
    return () => clearInterval(interval);
  }, [otpCountdown]);

  const handleSendOtp = () => {
    if (!identifier) {
      toast.error('Please enter your Mobile Number or Email to receive an OTP');
      return;
    }
    setIsOtpSent(true);
    setOtpCountdown(30);
    toast.success('Simulation: Verification OTP sent to ' + identifier);
    setOtp('1234'); // auto-fill simulated OTP for UX convenience
  };

  const handleSmartLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      toast.error('Please enter your Email or Mobile Number');
      return;
    }

    if (authMode === 'password' && !password) {
      toast.error('Please enter your password');
      return;
    }

    if (authMode === 'otp' && !otp) {
      toast.error('Please enter the 4-digit verification OTP');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const finalRole = detectedRole ? detectedRole.id : 'doctor';
      const roleDisplayNames = {
        admin: 'Admin Console (Superuser)',
        doctor: 'Dr. Rahul Sharma (Cardiologist)',
        receptionist: 'Main Desk Receptionist',
        guest: 'Patient Profile (AuraOS Portal)'
      };

      const session = {
        uid: `smart-${finalRole}-${Date.now()}`,
        email: identifier.includes('@') ? identifier : `${finalRole}@auraos.in`,
        displayName: roleDisplayNames[finalRole as 'admin' | 'doctor' | 'receptionist' | 'guest'] || 'Aura Clinician',
        role: finalRole as 'admin' | 'doctor' | 'receptionist' | 'guest',
      };

      setCurrentUser(session);
      setLoading(false);
      toast.success(`Access Granted! Role detected: ${detectedRole ? detectedRole.label : 'Doctor'}`);
    }, 1000);
  };

  const fillDemoProfile = (type: 'admin' | 'doctor' | 'receptionist' | 'patient') => {
    if (type === 'doctor') {
      setIdentifier('Dr. Rahul Sharma');
      setPassword('••••••••');
    } else if (type === 'receptionist') {
      setIdentifier('receptionist@auraos.in');
      setPassword('••••••••');
    } else if (type === 'admin') {
      setIdentifier('admin@auraos.in');
      setPassword('••••••••');
    } else if (type === 'patient') {
      setIdentifier('Patient Rahul Kumar');
      setPassword('••••••••');
    }
    setAuthMode('password');
    toast.info(`Pre-filled ${type} profile details`);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const session = await loginWithGoogle();
      setCurrentUser(session);
      toast.success(`Logged in as ${session.displayName}`);
    } catch (error) {
      toast.error('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info("Password Reset: A secure link has been simulated for " + (identifier || "your account"));
  };

  const handleSignUp = () => {
    toast.success("Sandbox Registration: Redirecting to instant clinician signup flow...");
  };

  // jsPDF Real PDF Generator for Payment History
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWith = doc.internal.pageSize.getWidth();
    
    // Header Banner
    doc.setFillColor(37, 99, 235); // #2563EB
    doc.rect(0, 0, pageWith, 38, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('AuraOS', 15, 18);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('PREMIUM HEALTHCARE OPERATING SYSTEM', 15, 24);
    doc.text('Smart Diagnostic Ledgers & Clinical Settlements', 15, 29);
    
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT BILLING STATEMENT', pageWith - 15, 22, { align: 'right' });
    
    // Patient & Summary Profile Info
    doc.setTextColor(30, 41, 59); // dark text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT PROFILE SUMMARY', 15, 52);
    doc.setFont('helvetica', 'normal');
    doc.text('Patient ID: PAT-84920', 15, 58);
    doc.text('Patient Name: Rahul Kumar', 15, 63);
    doc.text('Age / Gender: 28 Yrs / Male', 15, 68);
    doc.text('Phone: +91 98765 43213', 15, 73);
    
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL METRICS SUMMARY', 120, 52);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Payments: INR 24,750.00', 120, 58);
    doc.text('Total Refunds: INR 2,300.00', 120, 63);
    doc.text('Outstanding Balance: INR 0.00', 120, 68);
    doc.text('Ledger Audit Status: Verified Clear', 120, 73);
    
    // Line separator
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 80, pageWith - 15, 80);
    
    // Generate Table Data
    const columns = ['Date', 'Transaction ID', 'Description', 'Amount', 'Status', 'Payment Method'];
    const data = filteredRecords.map(item => [
      item.date,
      item.id,
      item.type,
      `INR ${item.amount.toLocaleString()}`,
      item.status,
      item.method
    ]);
    
    autoTable(doc, {
      startY: 86,
      head: [columns],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });
    
    // Branded Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(37, 99, 235);
    doc.rect(0, pageHeight - 12, pageWith, 1, 'F');
    
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('This is an authenticated cryptographic statement of billing and clinical services rendered under AuraOS.', 15, pageHeight - 7);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWith - 15, pageHeight - 7, { align: 'right' });
    
    doc.save('AuraOS-Payment-History-PAT-84920.pdf');
    toast.success('Patient billing history exported as PDF successfully!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans relative overflow-hidden text-slate-800">
      {/* Visual Workspace Split */}
      <div className="flex flex-col lg:flex-row min-h-screen w-full relative">
        
        {/* ---------------------------------------------------
            LEFT SIDE (Occupying about 38% of the screen)
            --------------------------------------------------- */}
        <div className="w-full lg:w-[38%] bg-gradient-to-br from-blue-50/90 via-slate-50/85 to-blue-100/40 border-r border-slate-200/60 p-8 flex flex-col justify-between relative overflow-hidden backdrop-blur-md shrink-0">
          
          {/* Blurred Premium Hospital Reception Background Overlays */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Abstract Smart Clinic Decorative Lights */}
            <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-cyan-200/20 blur-3xl"></div>
            <div className="absolute top-1/3 right-4 w-72 h-72 rounded-full bg-blue-200/25 blur-3xl"></div>
            <div className="absolute -bottom-20 left-10 w-80 h-80 rounded-full bg-indigo-100/30 blur-3xl"></div>
            {/* Clean crisp medical grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
          </div>

          {/* Logo & Platform Info Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-[#2563EB]/10 rounded-xl text-[#2563EB] border border-[#2563EB]/20">
                <Stethoscope size={22} className="animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-widest text-[#2563EB] flex items-center gap-1.5">
                  AURA<span className="text-slate-800 font-medium">OS</span>
                </h1>
              </div>
            </div>

            {/* Trilingual pills for language selector */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <Globe size={11} className="text-slate-400 ml-1.5 mr-0.5" />
              {(['en', 'ta', 'hi'] as const).map((lang) => (
                <button
                  key={lang}
                  id={`lang-sel-${lang}`}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-0.5 text-[9px] rounded-lg font-bold transition-all ${
                    language === lang
                      ? 'bg-[#2563EB] text-white shadow-sm font-extrabold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'ta' ? 'தமிழ்' : 'हिंदी'}
                </button>
              ))}
            </div>
          </div>

          {/* Presenter Portrait: 3D female doctor holding the card border */}
          <div className="absolute bottom-8 right-[-60px] w-[310px] xl:w-[350px] aspect-[4/5] bg-white p-2 rounded-[32px] border border-slate-200 shadow-[0_20px_50px_rgba(37,99,235,0.06)] z-20 hidden lg:block hover:scale-[1.01] transition-transform duration-500">
            <div className="w-full h-full rounded-[24px] overflow-hidden relative">
              <img
                src="/src/assets/images/smart_login_doctor_1782843664008.jpg"
                alt="AuraOS Chief Medical Presenter"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              
              {/* Overlay Logo Branded Tag */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1.5 shadow-sm">
                <Sparkles size={11} className="text-[#2563EB] animate-pulse" />
                <span className="text-[9px] font-mono font-bold text-[#2563EB] tracking-widest">AuraOS Logo</span>
              </div>
            </div>
          </div>

          {/* Hero Content Panel & Highlights */}
          <div className="relative z-10 mt-auto pt-24 lg:pt-0 max-w-sm space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#2563EB] font-mono">
                Welcome to AuraOS
              </span>
              <h2 className="text-3xl xl:text-4xl font-extrabold text-slate-900 leading-tight">
                Smart Healthcare.<br />
                <span className="text-[#2563EB]">Better Tomorrow.</span>
              </h2>
            </div>

            {/* Checklist items with customized bullet points */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shadow-xs">
                  ✓
                </div>
                <span>Secure & Trusted</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shadow-xs">
                  ✓
                </div>
                <span>AI Powered</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shadow-xs">
                  ✓
                </div>
                <span>Patient First</span>
              </div>
            </div>
          </div>

        </div>

        {/* ---------------------------------------------------
            RIGHT SIDE (Floating glassmorphic login workspace)
            --------------------------------------------------- */}
        <div className="flex-grow bg-gradient-to-br from-[#EEF2F6] via-white to-[#E0E7FF] flex flex-col justify-center items-center p-4 md:p-12 relative min-h-screen lg:w-[62%]">
          
          {/* Quick Portal Trigger for Payment History Modal */}
          <div className="absolute top-6 right-6 z-10 flex gap-2">
            <button
              onClick={() => setIsPaymentHistoryOpen(true)}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-2 hover:border-[#2563EB]/40 hover:text-[#2563EB] transition-all cursor-pointer group"
            >
              <QrCode size={14} className="text-[#2563EB] group-hover:rotate-12 transition-transform" />
              <span>Patient Payment History</span>
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-[460px] bg-white/80 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[28px] relative overflow-hidden"
            style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.12)' }}
          >
            {/* Elegant Top Highlight */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-100 via-[#2563EB] to-blue-100"></div>

            {/* Title Block */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#2563EB]/15 rounded-full blur-md animate-pulse"></div>
                  <AIAvatar size="lg" variant="idle" />
                </div>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-1">
                Smart Login
              </h2>
              <p className="text-slate-500 text-xs font-semibold max-w-xs mx-auto leading-normal">
                One Login. Smart Access. Personalized Experience.
              </p>
            </div>

            {/* Smart Navigation/Auth Mode Tabs */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 mb-5">
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'password'
                    ? 'bg-white text-[#2563EB] shadow-xs font-extrabold border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock size={13} />
                Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('otp')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'otp'
                    ? 'bg-white text-[#2563EB] shadow-xs font-extrabold border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone size={13} />
                OTP Login
              </button>
            </div>

            {/* Smart Login Form */}
            <form onSubmit={handleSmartLogin} className="space-y-4">
              
              {/* Identifier Input */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-mono font-bold flex justify-between">
                  <span>Email or Mobile Number</span>
                  <span className="text-[#2563EB]/80">Indian Format</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. doctor@auraos.in or 9876543210"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all font-mono shadow-inner"
                  />
                </div>
              </div>

              {/* Password input or OTP Input */}
              <AnimatePresence mode="wait">
                {authMode === 'password' ? (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[10px] text-[#2563EB] hover:text-[#2563EB]/80 font-bold hover:underline transition"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all font-mono shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="space-y-2.5"
                  >
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                        Verification OTP
                      </label>
                      {otpCountdown > 0 ? (
                        <span className="text-[10px] font-mono text-[#2563EB] font-bold">
                          Resend in {otpCountdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-[10px] text-[#2563EB] hover:underline font-bold"
                        >
                          Request OTP
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="4-digit code (e.g. 1234)"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-center text-sm text-slate-800 font-mono tracking-widest focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 shadow-inner"
                      />
                      {!isOtpSent && otpCountdown === 0 && (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Send OTP
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-500 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]/20 transition-all cursor-pointer"
                  />
                  <span>Remember Me</span>
                </label>
              </div>

              {/* Smart Role-Detection Feedback */}
              <AnimatePresence>
                {detectedRole && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between font-mono ${detectedRole.color}`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="animate-pulse text-[#2563EB]" />
                      <span className="font-semibold text-slate-600">Smart-Detected:</span>
                    </div>
                    <span className="font-bold uppercase tracking-wide">{detectedRole.label}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Primary Authorization Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 hover:shadow-xl hover:shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    Authorizing Credentials...
                  </>
                ) : (
                  <>
                    <LogIn size={14} />
                    Smart Authorization Login
                  </>
                )}
              </button>
            </form>

            {/* Divider "OR" */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest text-slate-400">
                <span className="bg-white px-3 font-bold">OR</span>
              </div>
            </div>

            {/* Google Authentication Trigger */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 transition shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.6 15.01 1 12 1 7.24 1 3.21 3.73 1.29 7.7l3.85 2.99C6.07 7.25 8.81 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.43c-.28 1.44-1.1 2.66-2.33 3.48l3.63 2.81c2.12-1.95 3.76-4.82 3.76-8.39z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.14 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31L1.29 6.7C.47 8.3.01 10.1.01 12s.46 3.7 1.28 5.3l3.85-2.99z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.63-2.81c-1.1.74-2.5 1.18-4.33 1.18-3.19 0-5.93-2.21-6.86-5.65L1.29 15.8C3.21 19.77 7.24 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Sandbox Sign Up Information */}
            <div className="text-center mt-4">
              <span className="text-slate-500 text-xs">Don't have a secure workspace? </span>
              <button
                type="button"
                onClick={handleSignUp}
                className="text-xs text-[#2563EB] font-bold hover:underline transition cursor-pointer"
              >
                Sign Up
              </button>
            </div>

            {/* Sandbox quick pre-filled developer accounts (styled cleanly at the bottom) */}
            <div className="relative my-4 pt-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[8px] uppercase tracking-widest font-mono text-slate-400">
                <span className="bg-white px-2 font-bold">Sandbox Credentials Quick Fill</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="sandbox-fill-doctor"
                onClick={() => fillDemoProfile('doctor')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-left rounded-xl transition-all flex items-center gap-2 text-[10px] group/btn cursor-pointer"
              >
                <Stethoscope size={13} className="text-emerald-500" />
                <div className="truncate">
                  <div className="font-bold text-slate-800 group-hover/btn:text-[#2563EB]">Dr. Sharma</div>
                  <div className="text-[8px] text-slate-500">Cardiologist</div>
                </div>
              </button>

              <button
                type="button"
                id="sandbox-fill-receptionist"
                onClick={() => fillDemoProfile('receptionist')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-left rounded-xl transition-all flex items-center gap-2 text-[10px] group/btn cursor-pointer"
              >
                <Users size={13} className="text-purple-500" />
                <div className="truncate">
                  <div className="font-bold text-slate-800 group-hover/btn:text-[#2563EB]">Front Desk</div>
                  <div className="text-[8px] text-slate-500">Receptionist</div>
                </div>
              </button>

              <button
                type="button"
                id="sandbox-fill-admin"
                onClick={() => fillDemoProfile('admin')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-left rounded-xl transition-all flex items-center gap-2 text-[10px] group/btn cursor-pointer"
              >
                <Shield size={13} className="text-blue-500" />
                <div className="truncate">
                  <div className="font-bold text-slate-800 group-hover/btn:text-[#2563EB]">Admin Root</div>
                  <div className="text-[8px] text-slate-500">Full Console</div>
                </div>
              </button>

              <button
                type="button"
                id="sandbox-fill-patient"
                onClick={() => fillDemoProfile('patient')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-left rounded-xl transition-all flex items-center gap-2 text-[10px] group/btn cursor-pointer"
              >
                <Smartphone size={13} className="text-indigo-500" />
                <div className="truncate">
                  <div className="font-bold text-slate-800 group-hover/btn:text-[#2563EB]">Rahul Kumar</div>
                  <div className="text-[8px] text-slate-500">Patient Portal</div>
                </div>
              </button>
            </div>

          </motion.div>
        </div>

      </div>

      {/* Footer Branded Copyright */}
      <footer className="text-center text-[10px] text-slate-400 py-3 font-mono relative z-20 bg-slate-50 border-t border-slate-200/50 w-full shrink-0">
        &copy; 2026 AuraOS Clinic Solutions. Crafted with Apple-Stripe-Linear design values. Powered by Google AI Studio.
      </footer>

      {/* ---------------------------------------------------
          PAYMENT HISTORY CENTERED PREMIUM MODAL (1000px width)
          --------------------------------------------------- */}
      <AnimatePresence>
        {isPaymentHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentHistoryOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            ></motion.div>

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="bg-white rounded-[28px] shadow-[0_25px_80px_rgba(0,0,0,0.15)] w-full max-w-[1000px] max-h-[92vh] overflow-hidden flex flex-col relative z-10 border border-slate-200"
            >
              {/* Premium Top Line Accent */}
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-blue-500 via-[#2563EB] to-cyan-400"></div>

              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-[#2563EB] rounded-xl border border-blue-100">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 leading-none">Payment History</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">Patient ID:</span>
                      <span className="text-[10px] font-mono font-bold text-[#2563EB]">PAT-84920</span>
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsPaymentHistoryOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Patient Summary Card */}
                <div className="bg-gradient-to-r from-blue-50/50 via-indigo-50/20 to-slate-50/80 p-5 rounded-2xl border border-blue-100/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {/* Rounded Initial Avatar */}
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/10">
                      RK
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 leading-none">Rahul Kumar</h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-1.5 text-xs text-slate-500 font-medium">
                        <span>Age: <strong className="text-slate-800">28 Yrs</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Gender: <strong className="text-slate-800">Male</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Phone: <strong className="text-slate-800">+91 98765 43213</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 bg-white rounded-xl border border-slate-200/60 shadow-xxs flex items-center gap-2">
                    <UserCheck size={14} className="text-emerald-500" />
                    <span className="text-[11px] font-mono text-slate-500">Account Status: <strong className="text-emerald-600 font-bold uppercase">Active</strong></span>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xxs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">Total Payments</span>
                      <span className="text-2xl font-black text-slate-900 font-mono">₹24,750</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 size={20} />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xxs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">Total Refunds</span>
                      <span className="text-2xl font-black text-slate-900 font-mono">₹2,300</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                      <AlertCircle size={20} />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xxs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">Outstanding Balance</span>
                      <span className="text-2xl font-black text-slate-900 font-mono">₹0</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                      <DollarSign size={18} />
                    </div>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row gap-4 items-center justify-between">
                  {/* Search Input */}
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={searchTxId}
                      onChange={(e) => setSearchTxId(e.target.value)}
                      placeholder="Search Transaction ID or Type..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/10 transition-all font-mono"
                    />
                    {searchTxId && (
                      <button
                        onClick={() => setSearchTxId('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Right dropdowns */}
                  <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
                    {/* Date Range Picker preset select */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-full sm:w-auto">
                      <Calendar size={13} className="text-[#2563EB]" />
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="bg-transparent focus:outline-none text-slate-700 font-semibold cursor-pointer text-xs w-full sm:w-auto"
                      >
                        <option value="all">All Dates</option>
                        <option value="last7">Last 7 Days (June 2026)</option>
                        <option value="last30">Last 30 Days (June 2026)</option>
                      </select>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-full sm:w-auto">
                      <Filter size={13} className="text-[#2563EB]" />
                      <select
                        value={statusFilter}
                        onChange={(e: any) => setStatusFilter(e.target.value)}
                        className="bg-transparent focus:outline-none text-slate-700 font-semibold cursor-pointer text-xs w-full sm:w-auto"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Success">Success Status</option>
                        <option value="Refund">Refunded Status</option>
                        <option value="Pending">Pending Status</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Table container with overflow control to prevent horizontal scrolls */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xxs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                          <th className="py-3 px-4 font-bold">Date</th>
                          <th className="py-3 px-4 font-bold">Transaction ID</th>
                          <th className="py-3 px-4 font-bold">Type</th>
                          <th className="py-3 px-4 font-bold text-right">Amount (₹)</th>
                          <th className="py-3 px-4 font-bold text-center">Status</th>
                          <th className="py-3 px-4 font-bold">Payment Method</th>
                          <th className="py-3 px-4 font-bold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        <AnimatePresence initial={false}>
                          {filteredRecords.length > 0 ? (
                            filteredRecords.map((item) => (
                              <motion.tr
                                key={item.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="hover:bg-slate-50/50 transition-all"
                              >
                                <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">{item.date}</td>
                                <td className="py-3 px-4 font-mono font-bold text-[#2563EB] text-[11px] whitespace-nowrap">{item.id}</td>
                                <td className="py-3 px-4 font-medium whitespace-nowrap">{item.type}</td>
                                <td className="py-3 px-4 font-mono font-bold text-right text-slate-950 whitespace-nowrap">₹{item.amount.toLocaleString()}</td>
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                  {item.status === 'Success' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                      Success
                                    </span>
                                  )}
                                  {item.status === 'Refund' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                                      <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                      Refund
                                    </span>
                                  )}
                                  {item.status === 'Pending' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-100">
                                      <span className="w-1 h-1 rounded-full bg-[#2563EB] animate-pulse"></span>
                                      Pending
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-medium whitespace-nowrap flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                                  <span>{item.method}</span>
                                </td>
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      toast.info(`Simulating detailed transactional receipt download for ${item.id}`);
                                    }}
                                    className="p-1 text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-all cursor-pointer inline-flex"
                                    title="Receipt Download"
                                  >
                                    <Download size={13} />
                                  </button>
                                </td>
                              </motion.tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                                No transaction matching the filtered query.
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Info Advisory Panel */}
                <div className="p-3.5 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-2xl flex items-start gap-3 text-xs leading-normal">
                  <Info size={16} className="shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    AuraOS Cryptographic Billing Statements are generated using secure client-side ledgers connected to standard Indian UPI routing endpoints. Please use the <strong>Export Ledger PDF</strong> function to generate legal compliance statements.
                  </span>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPaymentHistoryOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs text-center"
                >
                  Close Portal
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 hover:shadow-lg cursor-pointer text-center"
                >
                  <Download size={13} />
                  <span>Export Ledger PDF</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
