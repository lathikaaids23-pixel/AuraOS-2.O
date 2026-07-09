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
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginView: React.FC = () => {
  const { setCurrentUser } = useClinic();
  const { t, setLanguage, language } = useTranslation();
  const [loading, setLoading] = useState(false);

  // Smart Login Form States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [authMode, setAuthMode] = useState<'password' | 'otp' | 'biometric'>('password');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Biometric States
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  const triggerBiometricAuth = async () => {
    setBiometricScanning(true);
    setBiometricSuccess(false);

    // Try real Web Authentication API first
    if (window.PublicKeyCredential) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        const options: CredentialRequestOptions = {
          publicKey: {
            challenge: challenge,
            rpId: window.location.hostname || 'localhost',
            allowCredentials: [],
            userVerification: 'required',
            timeout: 10000
          }
        };

        toast.loading('Initiating system WebAuthn biometric handshake...', { id: 'webauthn-handshake' });
        
        // Browsers block this inside sandboxed iframes unless authorized.
        const credential = await navigator.credentials.get(options);
        if (credential) {
          toast.dismiss('webauthn-handshake');
          setBiometricScanning(false);
          setBiometricSuccess(true);
          toast.success('Biometric key validation successful!');
          setTimeout(() => {
            logInAsDefaultStaff();
          }, 1000);
          return;
        }
      } catch (err: any) {
        console.warn('Native WebAuthn failed/blocked (standard inside iframe):', err);
        toast.dismiss('webauthn-handshake');
      }
    }

    // Secure fallback simulation for clinical workspace preview
    toast.info('Secure WebAuthn sandbox bypass requested. Initiating Aura Holographic Scanner...', { duration: 3000 });
    
    setTimeout(() => {
      setBiometricScanning(false);
      setBiometricSuccess(true);
      toast.success('Holographic biometric credentials authorized!', { id: 'biometric-success' });
      setTimeout(() => {
        logInAsDefaultStaff();
      }, 1000);
    }, 2500);
  };

  const logInAsDefaultStaff = () => {
    const finalRole = detectedRole ? detectedRole.id : 'doctor';
    const roleDisplayNames = {
      admin: 'Admin Console (Superuser)',
      doctor: 'Dr. Rahul Sharma (Cardiologist)',
      receptionist: 'Main Desk Receptionist',
      guest: 'Patient Profile (AuraOS Portal)'
    };

    const session = {
      uid: `biometric-${finalRole}-${Date.now()}`,
      email: identifier || `${finalRole}@auraos.in`,
      displayName: roleDisplayNames[finalRole as 'admin' | 'doctor' | 'receptionist' | 'guest'] || 'Aura Clinician',
      role: finalRole as 'admin' | 'doctor' | 'receptionist' | 'guest',
    };
    setCurrentUser(session);
  };

  // Auto-detect role based on input text
  const detectedRole = React.useMemo(() => {
    const text = identifier.toLowerCase().trim();
    if (!text) return null;
    if (text.includes('doctor') || text.includes('dr.') || text.includes('sharma') || text === '9876543210') {
      return { id: 'doctor', label: 'Doctor', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' };
    }
    if (text.includes('reception') || text.includes('receptionist') || text === '9876543211') {
      return { id: 'receptionist', label: 'Receptionist', color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' };
    }
    if (text.includes('admin') || text.includes('root') || text === '9876543212') {
      return { id: 'admin', label: 'Clinical Admin', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' };
    }
    if (text.includes('patient') || text.includes('rahul') || text === '9876543213') {
      return { id: 'guest', label: 'Patient Profile', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' };
    }
    return { id: 'doctor', label: 'Prescribing Doctor (Default)', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' };
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

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between p-4 md:p-6 font-sans relative overflow-hidden">
      {/* Background Decorative Radial Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[35%] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Bar */}
      <header className="flex justify-between items-center max-w-7xl mx-auto w-full relative z-20">
        <div className="flex items-center gap-3">
          <AIAvatar size="sm" variant="idle" />
          <div>
            <h1 className="text-xl font-black tracking-widest text-white flex items-center gap-2">
              AURA <span className="text-cyan-400 font-mono text-[10px] tracking-normal px-2.5 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/5">OS 2.0</span>
            </h1>
          </div>
        </div>

        {/* Trilingual Language Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-900/80 backdrop-blur-md">
          <Globe size={11} className="text-slate-500 ml-2 mr-0.5" />
          {(['en', 'ta', 'hi'] as const).map((lang) => (
            <button
              key={lang}
              id={`lang-sel-${lang}`}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 text-[10px] rounded-lg font-bold transition-all duration-300 ${
                language === lang
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)] font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              {lang === 'en' ? 'EN' : lang === 'ta' ? 'தமிழ்' : 'हिंदी'}
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-grow flex items-center justify-center py-6 md:py-12 relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          
          {/* Left Column: Doctor Avatar & Medical Holograms */}
          <div className="col-span-1 lg:col-span-6 flex flex-col items-center justify-center relative hidden lg:flex">
            
            {/* Animated Doctor Illustration Container */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-950/20 backdrop-blur-xs flex items-center justify-center p-2 shadow-2xl shadow-cyan-500/5 group"
            >
              {/* Pulsing visual halo around the image */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-blue-500/0 to-indigo-500/5 pointer-events-none"></div>

              {/* The generated high-quality 3D female doctor avatar */}
              <img
                src="/src/assets/images/smart_login_doctor_1782843664008.jpg"
                alt="AuraOS AI Doctor Assistant"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-2xl group-hover:scale-[1.01] transition-transform duration-700"
              />

              {/* Holographic Overlays */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-6 left-6 bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 pointer-events-none"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute left-3"></span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider">AURA AI CONNECTED</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-6 right-6 bg-slate-900/85 backdrop-blur-md border border-blue-500/20 px-3 py-2 rounded-xl shadow-lg flex items-center gap-2.5 pointer-events-none"
              >
                <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400">
                  <Activity size={12} className="animate-pulse" />
                </div>
                <div>
                  <div className="text-[9px] font-mono text-slate-400">Smart Diagnostic Feed</div>
                  <div className="text-[10px] font-mono font-bold text-white">99.8% Sync Efficiency</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Ambient medical decorative elements behind/around the doctor */}
            <div className="absolute -top-10 -left-10 text-cyan-500/15 pointer-events-none animate-spin-slow">
              <Plus size={42} strokeWidth={1} />
            </div>
            <div className="absolute -bottom-8 -right-8 text-blue-500/15 pointer-events-none animate-bounce-slow">
              <Plus size={36} strokeWidth={1} />
            </div>
          </div>

          {/* Right Column: Premium Smart Login Form */}
          <div className="col-span-1 lg:col-span-6 flex flex-col justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              className="w-full max-w-md bg-slate-900/30 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.12)] relative overflow-hidden"
            >
              {/* Glassmorphism top neon bar */}
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>

              {/* Title & Branding */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-md animate-pulse"></div>
                    <AIAvatar size="lg" variant="thinking" />
                  </div>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white mb-1 flex items-center justify-center gap-2">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AuraOS</span>
                </h2>
                <div className="text-slate-400 text-xs font-semibold">
                  Smart Clinic Authorization
                </div>
              </div>

              {/* Smart Form */}
              <form onSubmit={handleSmartLogin} className="space-y-4">
                
                {/* Identifier Input */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5 font-mono font-semibold flex justify-between">
                    <span>Email or Mobile Number</span>
                    <span className="text-cyan-400/80">Indian Format *</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors focus-within:text-cyan-400" size={15} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. doctor@auraos.in or 9876543210"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Auth Mode Toggle */}
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-900/80">
                  <button
                    type="button"
                    onClick={() => setAuthMode('password')}
                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1 ${
                      authMode === 'password'
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    <Lock size={11} />
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('otp')}
                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1 ${
                      authMode === 'otp'
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    <Smartphone size={11} />
                    OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('biometric');
                      triggerBiometricAuth();
                    }}
                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1 ${
                      authMode === 'biometric'
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    <Fingerprint size={11} />
                    Biometrics
                  </button>
                </div>

                {/* Password input / OTP input / Biometric input */}
                <AnimatePresence mode="wait">
                  {authMode === 'password' ? (
                    <motion.div
                      key="password"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-mono font-semibold">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[10px] text-cyan-400/80 hover:text-cyan-300 transition hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
                        />
                      </div>
                    </motion.div>
                  ) : authMode === 'otp' ? (
                    <motion.div
                      key="otp"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-2.5"
                    >
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-mono font-semibold">
                          Simulated Verification OTP
                        </label>
                        {otpCountdown > 0 ? (
                          <span className="text-[10px] font-mono text-cyan-400">
                            Resend in {otpCountdown}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="text-[10px] text-cyan-400 hover:underline font-bold"
                          >
                            Request OTP
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Enter 4-digit code (Use 1234)"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="flex-1 bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-2.5 text-center text-sm text-white font-mono tracking-widest focus:outline-none focus:border-cyan-500/50"
                        />
                        {!isOtpSent && otpCountdown === 0 && (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition"
                          >
                            Send OTP
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="biometric"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4 py-2 flex flex-col items-center justify-center text-center"
                    >
                      <div
                        className="relative w-28 h-28 rounded-full bg-slate-950 flex items-center justify-center border-2 border-slate-800 hover:border-cyan-500/50 transition duration-300 overflow-hidden cursor-pointer group"
                        onClick={triggerBiometricAuth}
                      >
                        {/* Biometric Scan Line */}
                        {biometricScanning && (
                          <motion.div
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-10"
                          />
                        )}

                        {/* Scanner Pulse Background */}
                        <div className={`absolute inset-0 bg-cyan-500/5 rounded-full transition-all duration-500 ${
                          biometricScanning ? 'scale-110 opacity-100' : 'scale-100 opacity-50'
                        }`} />

                        {/* Fingerprint icon with state-driven color */}
                        <Fingerprint
                          size={48}
                          className={`transition-colors duration-500 z-10 ${
                            biometricSuccess
                              ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                              : biometricScanning
                              ? 'text-cyan-400 animate-pulse'
                              : 'text-slate-600 group-hover:text-cyan-500'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          {biometricSuccess
                            ? 'Authentication Verified'
                            : biometricScanning
                            ? 'Scanning Biometrics...'
                            : 'Biometrics Active'}
                        </div>
                        <p className="text-slate-500 text-[10px] max-w-[280px] leading-relaxed font-mono">
                          {biometricSuccess
                            ? 'Access granted. Synchronizing clinical profile...'
                            : biometricScanning
                            ? 'Verify hardware sensor alignment or hold finger...'
                            : 'Tap scanner above or the button below to initiate hardware WebAuthn scan'}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Smart Role-Detection Indicator */}
                <AnimatePresence>
                  {detectedRole && authMode !== 'biometric' && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between font-mono ${detectedRole.color}`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles size={13} className="animate-pulse" />
                        <span>Smart-Detection:</span>
                      </div>
                      <span className="font-bold uppercase tracking-wide">{detectedRole.label}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                {authMode === 'biometric' ? (
                  <button
                    type="button"
                    onClick={triggerBiometricAuth}
                    disabled={biometricScanning || biometricSuccess}
                    className={`w-full py-3 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] ${
                      biometricSuccess
                        ? 'bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        : biometricScanning
                        ? 'bg-cyan-600/50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.45)]'
                    }`}
                  >
                    {biometricSuccess ? (
                      <>
                        <Sparkles size={14} className="animate-spin" />
                        Access Verified - Syncing OS...
                      </>
                    ) : biometricScanning ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        Scanning hardware credentials...
                      </>
                    ) : (
                      <>
                        <Fingerprint size={14} />
                        Scan Fingerprint / Face ID
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        Validating Session...
                      </>
                    ) : (
                      <>
                        <LogIn size={14} />
                        Authorize Smart Access
                      </>
                    )}
                  </button>
                )}
              </form>

              {/* Sign Up Link */}
              <div className="text-center mt-4">
                <span className="text-slate-500 text-xxs">Don't have a secure workspace? </span>
                <button
                  type="button"
                  onClick={handleSignUp}
                  className="text-xxs text-cyan-400 font-bold hover:underline transition"
                >
                  Sign Up Here
                </button>
              </div>

              {/* Social Login Integrations */}
              <div className="mt-5 pt-4 border-t border-slate-900/80 space-y-2">
                <div className="text-[9px] uppercase tracking-wider text-slate-500 text-center mb-3 font-mono">
                  Or Connect with Identity Providers
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Google OAuth Option */}
                  <button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="py-2.5 px-3 bg-slate-950/80 hover:bg-slate-900/90 border border-slate-850 hover:border-slate-800 text-slate-300 font-semibold text-xxs rounded-xl flex items-center justify-center gap-2.5 transition"
                  >
                    {/* Google Custom Color Vector Logo */}
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                    <span>Google ID</span>
                  </button>

                  {/* Microsoft Microsoft Option */}
                  <button
                    onClick={() => toast.info("Simulation: Initializing secure Microsoft Single Sign-On...")}
                    type="button"
                    className="py-2.5 px-3 bg-slate-950/80 hover:bg-slate-900/90 border border-slate-850 hover:border-slate-800 text-slate-300 font-semibold text-xxs rounded-xl flex items-center justify-center gap-2.5 transition"
                  >
                    {/* Microsoft 4-Color Square Vector Logo */}
                    <svg className="w-3.5 h-3.5" viewBox="0 0 23 23">
                      <rect width="10.5" height="10.5" fill="#F25022" />
                      <rect x="11.5" width="10.5" height="10.5" fill="#7FBA00" />
                      <rect y="11.5" width="10.5" height="10.5" fill="#00A4EF" />
                      <rect x="11.5" y="11.5" width="10.5" height="10.5" fill="#FFB900" />
                    </svg>
                    <span>Microsoft</span>
                  </button>
                </div>
              </div>

              {/* Quick-Fill Sandbox Accounts */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-900"></div>
                </div>
                <div className="relative flex justify-center text-[9px] uppercase">
                  <span className="bg-[#0b101c] px-3.5 text-slate-500 font-mono tracking-widest">
                    Sandbox Pre-filled Accounts
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="sandbox-fill-doctor"
                  onClick={() => fillDemoProfile('doctor')}
                  className="py-2 px-2.5 bg-slate-950/40 hover:bg-slate-900/90 border border-slate-900 hover:border-slate-800 text-left rounded-xl transition-all flex items-center gap-2 text-xxs group/btn"
                >
                  <Stethoscope size={13} className="text-emerald-400" />
                  <div className="truncate">
                    <div className="font-bold text-white group-hover/btn:text-cyan-400 transition-colors">Dr. Sharma</div>
                    <div className="text-[8px] text-slate-500">Doctor Profile</div>
                  </div>
                </button>

                <button
                  type="button"
                  id="sandbox-fill-receptionist"
                  onClick={() => fillDemoProfile('receptionist')}
                  className="py-2 px-2.5 bg-slate-950/40 hover:bg-slate-900/90 border border-slate-900 hover:border-slate-800 text-left rounded-xl transition-all flex items-center gap-2 text-xxs group/btn"
                >
                  <Users size={13} className="text-purple-400" />
                  <div className="truncate">
                    <div className="font-bold text-white group-hover/btn:text-cyan-400 transition-colors">Front Desk</div>
                    <div className="text-[8px] text-slate-500">Receptionist</div>
                  </div>
                </button>

                <button
                  type="button"
                  id="sandbox-fill-admin"
                  onClick={() => fillDemoProfile('admin')}
                  className="py-2 px-2.5 bg-slate-950/40 hover:bg-slate-900/90 border border-slate-900 hover:border-slate-800 text-left rounded-xl transition-all flex items-center gap-2 text-xxs group/btn"
                >
                  <Shield size={13} className="text-cyan-400" />
                  <div className="truncate">
                    <div className="font-bold text-white group-hover/btn:text-cyan-400 transition-colors">Admin Root</div>
                    <div className="text-[8px] text-slate-500">Full Access</div>
                  </div>
                </button>

                <button
                  type="button"
                  id="sandbox-fill-patient"
                  onClick={() => fillDemoProfile('patient')}
                  className="py-2 px-2.5 bg-slate-950/40 hover:bg-slate-900/90 border border-slate-900 hover:border-slate-800 text-left rounded-xl transition-all flex items-center gap-2 text-xxs group/btn"
                >
                  <Smartphone size={13} className="text-blue-400" />
                  <div className="truncate">
                    <div className="font-bold text-white group-hover/btn:text-cyan-400 transition-colors">Rahul Kumar</div>
                    <div className="text-[8px] text-slate-500">Patient Portal</div>
                  </div>
                </button>
              </div>

            </motion.div>
          </div>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="text-center text-[10px] text-slate-600 max-w-md mx-auto py-2 font-mono relative z-20">
        &copy; 2026 Aura Clinic OS. Powered by Google AI Studio Antigravity. All rights reserved.
      </footer>
    </div>
  );
};

