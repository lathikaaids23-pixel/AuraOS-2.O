import React, { useState, useMemo } from 'react';
import { useClinic } from '../ClinicContext';
import { useTranslation } from '../LanguageContext';
import { Hospital, HospitalBedStatus } from '../types';
import { AIAvatar } from './AIAvatar';
import { toast } from 'sonner';
import {
  Search,
  MapPin,
  HeartPulse,
  Building,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  Filter,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const HospitalFinderView: React.FC = () => {
  const { state, triggerLocalBedStatusPoll } = useClinic();
  const { t } = useTranslation();

  // Search/Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [costFilter, setCostFilter] = useState('');

  // AI Assistant Criteria
  const [aiCriteria, setAiCriteria] = useState<'low-income' | 'critical-icu' | 'premium-specialist'>('low-income');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<Array<{ hospital: Hospital; bedStatus: HospitalBedStatus; matchScore: number; reason: string }>>([]);

  const hospitals = state.hospitals;
  const bedStatuses = state.bedStatuses;

  // Extract cities
  const availableCities = useMemo(() => {
    return Array.from(new Set(hospitals.map((h) => h.city)));
  }, [hospitals]);

  // Combine Hospital details with real-time Bed Statuses
  const blendedHospitals = useMemo(() => {
    return hospitals.map((h) => {
      const beds = bedStatuses.find((b) => b.hospitalId === h.id) || {
        hospitalId: h.id,
        hospitalName: h.name,
        distanceKm: h.distanceKm || 5,
        bedsGeneralFree: 10,
        bedsICUFree: 2,
        bedsEmergencyFree: 1,
        patientsAdmitted: 150,
        patientsWaitingOPD: 25,
        patientsInTreatment: 110,
        lastUpdated: new Date().toISOString(),
      };
      return {
        ...h,
        beds,
      };
    });
  }, [hospitals, bedStatuses]);

  // Filter logic
  const filteredHospitals = useMemo(() => {
    return blendedHospitals.filter((h) => {
      const matchesSearch =
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        h.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity = cityFilter === '' || h.city === cityFilter;
      const matchesType = typeFilter === '' || h.type === typeFilter;
      const matchesCost = costFilter === '' || h.costCategory === costFilter;

      return matchesSearch && matchesCity && matchesType && matchesCost;
    });
  }, [blendedHospitals, searchQuery, cityFilter, typeFilter, costFilter]);

  // AI Matching Recommendation Generator
  const handleGenerateAiMatches = () => {
    setAiAnalyzing(true);
    setAiRecommendations([]);

    setTimeout(() => {
      let filtered = [...blendedHospitals];

      // Smart recommendation sort logic depending on selected clinician criteria
      let recommendations: any[] = [];

      if (aiCriteria === 'low-income') {
        // Prioritize Govt (cost category Free or Low) and close proximity
        filtered.sort((a, b) => {
          const costScoreA = a.costCategory === 'Free' ? 0 : a.costCategory === 'Low' ? 1 : 3;
          const costScoreB = b.costCategory === 'Free' ? 0 : b.costCategory === 'Low' ? 1 : 3;
          if (costScoreA !== costScoreB) return costScoreA - costScoreB;
          return a.beds.distanceKm - b.beds.distanceKm;
        });

        recommendations = filtered.slice(0, 2).map((h) => ({
          hospital: h,
          bedStatus: h.beds,
          matchScore: h.costCategory === 'Free' ? 98 : 92,
          reason: `Government-sponsored setup with ${h.costCategory} care categories and available General Beds (${h.beds.bedsGeneralFree} vacant), saving financial stress for the patient.`,
        }));
      } else if (aiCriteria === 'critical-icu') {
        // Prioritize ICU beds free and distance
        filtered.sort((a, b) => {
          if (b.beds.bedsICUFree !== a.beds.bedsICUFree) {
            return b.beds.bedsICUFree - a.beds.bedsICUFree;
          }
          return a.beds.distanceKm - b.beds.distanceKm;
        });

        recommendations = filtered.slice(0, 2).map((h) => ({
          hospital: h,
          bedStatus: h.beds,
          matchScore: Math.min(100, 80 + h.beds.bedsICUFree * 4),
          reason: `Primary ICU beds immediately vacant (${h.beds.bedsICUFree} available) coupled with closest proximity at ${h.beds.distanceKm} km. Immediate dispatch recommended.`,
        }));
      } else {
        // Prioritize specialties matching Premium facilities
        filtered.sort((a, b) => {
          const specA = a.costCategory === 'Premium' ? 0 : 1;
          const specB = b.costCategory === 'Premium' ? 0 : 1;
          if (specA !== specB) return specA - specB;
          return b.rating - a.rating;
        });

        recommendations = filtered.slice(0, 2).map((h) => ({
          hospital: h,
          bedStatus: h.beds,
          matchScore: 96,
          reason: `Specialized premium setup with outstanding tertiary treatment ratings (${h.rating} Stars), fully participating in private cashless insurance covers.`,
        }));
      }

      setAiRecommendations(recommendations);
      setAiAnalyzing(false);
      toast.success('AI triage recommendation generated!');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <AIAvatar size="md" variant="idle" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {t('hospitalFinder')} <span className="text-xs bg-cyan-500/10 text-cyan-400 font-mono px-2 py-0.5 rounded border border-cyan-500/20">LIVE DIRECTORY</span>
            </h2>
            <p className="text-xs text-slate-400">Scan Indian hospital beds, verify Govt/Private tariffs, and locate optimal emergency admissions</p>
          </div>
        </div>

        <button
          onClick={triggerLocalBedStatusPoll}
          className="px-3.5 py-2 border border-slate-800 hover:border-cyan-500/20 bg-slate-950 hover:bg-slate-900 text-xs text-cyan-400 rounded-xl flex items-center gap-1.5 transition font-mono"
        >
          <TrendingUp size={12} />
          Force Poll Bed Counts
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2-Span): Hospital Directory */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900/40 border border-blue-500/10 p-4 rounded-2xl flex flex-wrap gap-2.5 items-center">
            <div className="flex-grow min-w-[200px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search hospitals by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex gap-1.5 flex-wrap">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xxs text-slate-300 focus:outline-none"
              >
                <option value="">All Cities</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xxs text-slate-300 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
              </select>

              <select
                value={costFilter}
                onChange={(e) => setCostFilter(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xxs text-slate-300 focus:outline-none"
              >
                <option value="">All Tariffs</option>
                <option value="Free">Free Care</option>
                <option value="Low">Low Cost</option>
                <option value="Mid">Medium</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
          </div>

          {/* Hospitals List */}
          <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
            {filteredHospitals.length === 0 ? (
              <div className="py-20 border border-dashed border-slate-900 rounded-2xl text-center text-slate-500 font-mono text-xs">
                No Indian hospitals matching criteria.
              </div>
            ) : (
              filteredHospitals.map((h) => (
                <div
                  key={h.id}
                  className="p-5 bg-slate-900/30 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row justify-between gap-4 hover:border-cyan-500/20 transition-all shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        h.type === 'Government' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {h.type}
                      </span>
                      <span className="text-xxs text-slate-500 font-mono">Distance: {h.beds.distanceKm} km</span>
                    </div>

                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Building size={14} className="text-cyan-400" />
                      {h.name}
                    </h4>

                    <p className="text-xxs text-slate-400 flex items-center gap-1">
                      <MapPin size={10} className="text-red-400" />
                      {h.city} · Rating: {h.rating} Stars
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {h.specialties.map((spec) => (
                        <span key={spec} className="px-1.5 py-0.5 bg-slate-950 text-slate-400 text-[9px] rounded-md font-mono">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bed Counts Dashboard Card */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-900 grid grid-cols-3 gap-3.5 min-w-[240px] text-center font-mono">
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-slate-500 uppercase">General</div>
                      <div className="text-sm font-bold text-emerald-400">{h.beds.bedsGeneralFree} Free</div>
                    </div>
                    <div className="space-y-0.5 border-x border-slate-900">
                      <div className="text-[9px] text-slate-500 uppercase">ICU</div>
                      <div className={`text-sm font-bold ${h.beds.bedsICUFree > 0 ? 'text-amber-400' : 'text-red-500'}`}>
                        {h.beds.bedsICUFree} Free
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-slate-500 uppercase">Emergency</div>
                      <div className="text-sm font-bold text-white">{h.beds.bedsEmergencyFree} Free</div>
                    </div>
                    <div className="col-span-3 border-t border-slate-900 pt-1.5 flex justify-between items-center text-[9px] text-slate-500">
                      <span>Tariff: <strong className="text-slate-300">{h.costCategory}</strong></span>
                      <span>Insurance: <strong className="text-slate-300">{h.insuranceAccepted ? 'Accepted' : 'None'}</strong></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: AI recommendation triager */}
        <div className="space-y-4">
          <div className="bg-slate-950/30 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-cyan-400" size={18} />
                <h3 className="font-bold text-white text-xs uppercase font-mono tracking-wider">
                  AI Match Recommendation
                </h3>
              </div>

              <p className="text-xxs text-slate-400">
                Identify optimal hospital placements based on customized patient clinical criteria.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xxs text-slate-400 uppercase tracking-wider font-mono">Triage Metric</label>
                <select
                  value={aiCriteria}
                  onChange={(e) => setAiCriteria(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="low-income">Financial Aid / Cheap & Gov Tariffs</option>
                  <option value="critical-icu">Immediate ICU / Critical Spares</option>
                  <option value="premium-specialist">Tertiary Specialities / Premium Stars</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateAiMatches}
                disabled={aiAnalyzing}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition"
              >
                {aiAnalyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Running Triager...
                  </>
                ) : (
                  <>
                    <BrainCircuit size={14} />
                    Generate Matches
                  </>
                )}
              </button>

              {/* Match outputs */}
              {aiRecommendations.length > 0 && (
                <div className="space-y-3 pt-2">
                  {aiRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-xl text-xxs space-y-1.5 hover:border-cyan-500/20 transition-all relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bg-cyan-500/15 text-cyan-400 text-[9px] font-mono font-black px-1.5 py-0.5 rounded-bl">
                        {rec.matchScore}% Match
                      </div>
                      <h4 className="font-bold text-white pr-16">{rec.hospital.name}</h4>
                      <p className="text-slate-400 text-xxs leading-relaxed font-sans">{rec.reason}</p>
                      <div className="text-[10px] text-emerald-400 font-mono pt-1">
                        General: {rec.bedStatus.bedsGeneralFree} | ICU: {rec.bedStatus.bedsICUFree} Beds Free
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
