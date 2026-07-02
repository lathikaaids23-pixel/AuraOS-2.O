import React, { useState } from 'react';
import { useClinic } from '../ClinicContext';
import { useTranslation } from '../LanguageContext';
import { AIAvatar } from './AIAvatar';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Stethoscope,
  ListOrdered,
  FileBarChart,
  MapPin,
  Settings,
  LogOut,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppShellProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, activePage, setActivePage }) => {
  const { state, setCurrentUser } = useClinic();
  const { t, language, setLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'patients', label: t('patients'), icon: Users },
    { id: 'queue', label: t('queue'), icon: ListOrdered },
    { id: 'appointments', label: t('appointments'), icon: CalendarCheck },
    { id: 'consultation', label: t('consultation'), icon: Stethoscope },
    { id: 'reports', label: t('reports'), icon: FileBarChart },
    { id: 'hospital-finder', label: t('hospitalFinder'), icon: MapPin },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const currentRole = state.currentUser?.role || 'guest';
  const displayName = state.currentUser?.displayName || 'Clinician';

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Absolute floating neon background lights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-blue-500/15 py-3 px-4 sm:px-6 flex justify-between items-center h-16 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 hover:bg-slate-900 rounded text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2">
            <AIAvatar size="sm" variant="idle" />
            <h1 className="text-md sm:text-lg font-black tracking-wider text-white flex items-center gap-1.5">
              AURA <span className="text-cyan-400 font-mono text-xs px-1.5 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/5">OS 2.0</span>
            </h1>
          </div>
        </div>

        {/* Global Controls: Languages, EMERGENCY and User Info */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Trilingual toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800 text-xs">
            {(['en', 'ta', 'hi'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-0.5 rounded-md font-medium transition ${
                  language === lang
                    ? 'bg-cyan-500 text-black font-semibold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'ta' ? 'தமிழ்' : 'हिंदी'}
              </button>
            ))}
          </div>

          {/* EMERGENCY Action Button */}
          <button
            onClick={() => {
              setActivePage('emergency');
              setMobileMenuOpen(false);
            }}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-500/30 hover:scale-105 active:scale-95 animate-pulse"
            id="emergency-header-btn"
          >
            <AlertTriangle size={14} className="text-white fill-white" />
            <span className="tracking-wider">{t('emergency')}</span>
          </button>

          {/* User badge */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <div className="hidden md:block text-right">
              <div className="text-xs font-bold text-white leading-none">{displayName}</div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mt-0.5">{currentRole}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-slate-900 rounded text-slate-400 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-grow flex relative">
        {/* Sidebar Left Desktop Navigation */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-950/40 backdrop-blur-md border-r border-blue-500/10 p-4 h-[calc(100vh-64px)] sticky top-16 z-30 justify-between">
          <div className="space-y-1.5">
            <div className="px-3 mb-4 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              Main Operations
            </div>
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-950/50 to-cyan-950/40 border-l-4 border-cyan-400 text-cyan-400 font-semibold shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-3 bg-slate-950/80 border border-blue-500/10 rounded-xl flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="text-[10px] font-mono text-slate-400">
              <div>Aura Cloud Sync</div>
              <div className="text-emerald-400/80">Secured & Active</div>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden fixed inset-0 bg-black z-30"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="md:hidden fixed top-0 bottom-0 left-0 w-64 bg-[#0a0e1a]/95 backdrop-blur-md border-r border-blue-500/20 p-5 z-40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <AIAvatar size="sm" variant="idle" />
                      <span className="font-extrabold text-white">AURA NAVIGATION</span>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                      <X size={20} />
                    </button>
                  </div>

                  <nav className="space-y-1.5">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activePage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActivePage(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-950/50 to-cyan-950/40 border-l-4 border-cyan-400 text-cyan-400 font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                          }`}
                        >
                          <Icon size={18} />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg text-xs">
                    {(['en', 'ta', 'hi'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`flex-1 py-1 rounded text-center transition ${
                          language === lang ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {lang === 'en' ? 'EN' : lang === 'ta' ? 'தமிழ்' : 'हिंदी'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-slate-800 text-slate-400 hover:text-red-400 text-xs rounded-lg transition"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Core Main content body */}
        <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
