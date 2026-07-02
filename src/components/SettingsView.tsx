import React, { useState } from 'react';
import { useClinic } from '../ClinicContext';
import { useTranslation } from '../LanguageContext';
import { AIAvatar } from './AIAvatar';
import { toast } from 'sonner';
import {
  Settings,
  Building,
  Phone,
  MapPin,
  QrCode,
  Key,
  Save,
  CheckCircle2,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

export const SettingsView: React.FC = () => {
  const { state, updateSettings } = useClinic();
  const { t } = useTranslation();

  const currentSettings = state.settings;

  // Form states
  const [clinicName, setClinicName] = useState(currentSettings.clinicName || '');
  const [clinicAddress, setClinicAddress] = useState(currentSettings.clinicAddress || '');
  const [clinicPhone, setClinicPhone] = useState(currentSettings.clinicPhone || '');
  const [clinicVpa, setClinicVpa] = useState(currentSettings.clinicVpa || '');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(currentSettings.googleMapsApiKey || '');

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim() || !clinicAddress.trim() || !clinicPhone.trim() || !clinicVpa.trim()) {
      toast.error('All billing configuration parameters are required');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        clinicName,
        clinicAddress,
        clinicPhone,
        clinicVpa,
        googleMapsApiKey,
      });
    } catch (error) {
      toast.error('Failed to commit settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <AIAvatar size="md" variant="idle" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {t('settings')} <span className="text-xs bg-cyan-500/10 text-cyan-400 font-mono px-2 py-0.5 rounded border border-cyan-500/20">GLOBAL PARAMETERS</span>
            </h2>
            <p className="text-xs text-slate-400">Configure VPA addresses, practitioner credentials, and maps API endpoints</p>
          </div>
        </div>
      </div>

      {/* Configurations Form */}
      <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {/* VPA Callout */}
            <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-xl text-xxs text-slate-400 flex gap-2.5 items-start">
              <Info className="text-cyan-400 shrink-0 mt-0.5" size={14} />
              <div>
                <strong className="block text-cyan-400 uppercase font-mono tracking-wider mb-1">UPI ROUTING ENGINE</strong>
                The Virtual Payment Address (VPA) configured below is dynamically woven into GPay/PhonePe-compliant QR codes across checkout and EHR summaries, ensuring immediate cashier-less settlements.
              </div>
            </div>

            {/* Clinic Name */}
            <div>
              <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1">
                <Building size={12} className="text-cyan-400" />
                Clinic Name *
              </label>
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Clinic Address */}
            <div>
              <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1">
                <MapPin size={12} className="text-red-400" />
                Clinic Location / Address *
              </label>
              <textarea
                required
                rows={2}
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1">
                  <Phone size={12} className="text-emerald-400" />
                  Contact Line *
                </label>
                <input
                  type="text"
                  required
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* UPI VPA */}
              <div>
                <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1">
                  <QrCode size={12} className="text-cyan-400" />
                  Clinic UPI ID (VPA) *
                </label>
                <input
                  type="text"
                  required
                  value={clinicVpa}
                  onChange={(e) => setClinicVpa(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Google Maps API Key */}
            <div>
              <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1">
                <Key size={12} className="text-amber-400" />
                Google Maps API Key (Optional)
              </label>
              <input
                type="password"
                value={googleMapsApiKey}
                onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                placeholder="AI Studio automatically secures keys. Keep empty to use fallback Indian hospital databases."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-cyan-500 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-cyan-400 transition"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                  Saving configurations...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Commit configurations
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
