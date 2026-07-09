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
  DollarSign,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Precise Coordinate centers for Indian Cities in default data
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Delhi: { lat: 28.6139, lng: 77.2090 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Patna: { lat: 25.5941, lng: 85.1376 },
};

function getHospitalCoords(hospital: Hospital) {
  const cityCenter = CITY_COORDINATES[hospital.city] || { lat: 20.5937, lng: 78.9629 };
  // Generate pseudorandom stable offset per hospital using hash of the ID
  const seed = hospital.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = Math.sin(seed) * (hospital.distanceKm % 5 + 1) * 0.007;
  const lngOffset = Math.cos(seed) * (hospital.distanceKm % 5 + 1) * 0.007;
  return {
    lat: cityCenter.lat + latOffset,
    lng: cityCenter.lng + lngOffset,
  };
}

export const HospitalFinderView: React.FC = () => {
  const { state, triggerLocalBedStatusPoll } = useClinic();
  const { t } = useTranslation();

  // Search/Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [costFilter, setCostFilter] = useState('');

  // Map Navigation State
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // Center of India
  const [mapZoom, setMapZoom] = useState(4.8);

  const handleCityChange = (city: string) => {
    setCityFilter(city);
    if (city && CITY_COORDINATES[city]) {
      setMapCenter(CITY_COORDINATES[city]);
      setMapZoom(11);
    } else {
      setMapCenter({ lat: 20.5937, lng: 78.9629 });
      setMapZoom(4.8);
    }
  };

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
                onChange={(e) => handleCityChange(e.target.value)}
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

          {/* Interactive Aura Cyber-Medical Grid Locator (Replacer for Google Map) */}
          <div className="w-full h-80 rounded-2xl bg-slate-950/90 border border-slate-800/80 overflow-hidden relative shadow-lg p-1 select-none flex flex-col justify-between">
            {/* Top Coordinate indicators */}
            <div className="flex justify-between items-center px-4 py-2 bg-slate-950/80 border-b border-slate-900 z-10 text-[9px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                ACTIVE RADAR SCANNING...
              </span>
              <span>GRID LOCK: {cityFilter ? cityFilter.toUpperCase() : "INDIA OVERALL"}</span>
            </div>

            {/* Simulated Grid Area */}
            <div className="relative flex-grow overflow-hidden w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 flex items-center justify-center">
              
              {/* Radar Sweeper Line */}
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/10 flex items-center justify-center">
                  <div className="w-[180px] h-[180px] rounded-full border border-cyan-500/10 flex items-center justify-center">
                    <div className="w-[80px] h-[80px] rounded-full border border-cyan-500/5"></div>
                  </div>
                </div>
                {/* Rotating scanning ray */}
                <div className="absolute top-1/2 left-1/2 w-full h-0.5 bg-gradient-to-r from-cyan-500/20 to-transparent origin-left rotate-45 animate-[spin_8s_linear_infinite] -translate-y-1/2"></div>
              </div>

              {/* Central Target Beacon */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10 pointer-events-none">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border border-white/20"></span>
                </span>
                <span className="text-[8px] font-mono font-bold text-blue-400/80 bg-slate-950/90 border border-slate-800 px-1.5 py-0.5 rounded mt-1 shadow-md uppercase">
                  {cityFilter || "India"}
                </span>
              </div>

              {/* Plotted Hospital Nodes */}
              {filteredHospitals.map((h) => {
                const coords = getHospitalCoords(h);
                const isSelected = selectedHospitalId === h.id;
                
                // Scale coordinates cleanly centered around the chosen view
                const isIndiaWide = !cityFilter;
                const activeCenterCoords = cityFilter && CITY_COORDINATES[cityFilter] 
                  ? CITY_COORDINATES[cityFilter] 
                  : { lat: 20.5937, lng: 78.9629 };

                const latDiff = coords.lat - activeCenterCoords.lat;
                const lngDiff = coords.lng - activeCenterCoords.lng;

                // Percent positions inside the grid (keep within 10%-90%)
                const leftPercent = isIndiaWide
                  ? Math.min(90, Math.max(10, ((coords.lng - 68) / (97 - 68)) * 100))
                  : Math.min(88, Math.max(12, 50 + (lngDiff * 1400))); // higher amplification for city view
                
                const topPercent = isIndiaWide
                  ? Math.min(90, Math.max(10, (1 - (coords.lat - 8) / (37 - 8)) * 100))
                  : Math.min(88, Math.max(12, 50 - (latDiff * 1400)));

                return (
                  <div
                    key={h.id}
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group/pin"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHospitalId(h.id);
                        toast.info(`Active target locked: ${h.name}`);
                      }}
                      className="relative flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-75"
                    >
                      {/* Interactive Pulse Halo if selected */}
                      {isSelected && (
                        <span className="absolute flex h-7 w-7">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400/40"></span>
                          <span className="relative inline-flex rounded-full h-7 w-7 border border-pink-500/30"></span>
                        </span>
                      )}

                      {/* Actual Marker Node */}
                      <span className={`w-3 h-3 rounded-full border border-slate-950 flex items-center justify-center shadow-lg transition-all duration-300 ${
                        isSelected 
                          ? 'bg-pink-500 scale-125 ring-2 ring-pink-300' 
                          : h.type === 'Government' 
                            ? 'bg-emerald-500 hover:bg-emerald-400 ring-1 ring-emerald-500/20' 
                            : 'bg-cyan-500 hover:bg-cyan-400 ring-1 ring-cyan-500/20'
                      }`}>
                        <span className="w-1 h-1 bg-white rounded-full"></span>
                      </span>
                    </button>

                    {/* Rich Hover / Active Tooltip */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl shadow-xl w-44 pointer-events-none opacity-0 group-hover/pin:opacity-100 transition-all duration-200 z-30 text-xxs font-sans">
                      <p className="font-extrabold text-white truncate">{h.name}</p>
                      <div className="flex justify-between items-center mt-1 text-[9px] font-mono">
                        <span className={h.type === 'Government' ? 'text-emerald-400' : 'text-cyan-400'}>
                          {h.type}
                        </span>
                        <span className="text-slate-400">
                          {h.beds.bedsGeneralFree} General Free
                        </span>
                      </div>
                      <p className="text-[8px] text-slate-500 mt-0.5 font-mono">Distance: {h.beds.distanceKm} km</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Map Legend Bar */}
            <div className="flex justify-between items-center px-4 py-2 bg-slate-950/80 border-t border-slate-900 z-10 text-[9px] font-mono text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Govt ({filteredHospitals.filter(h => h.type === 'Government').length})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  Private ({filteredHospitals.filter(h => h.type !== 'Government').length})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  Selected
                </span>
              </div>
              <span className="text-slate-500 text-[8px]">AURA MEDICAL SYSTEM GRID</span>
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
                  className={`p-5 bg-slate-900/30 border rounded-2xl flex flex-col md:flex-row justify-between gap-4 hover:border-cyan-500/20 transition-all shadow-md ${
                    selectedHospitalId === h.id ? 'border-cyan-500/50 bg-cyan-950/5' : 'border-slate-800/80'
                  }`}
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
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHospitalId(h.id);
                          const coords = getHospitalCoords(h);
                          setMapCenter(coords);
                          setMapZoom(13);
                          toast.info(`Centered map on ${h.name}`);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Compass size={11} className="animate-spin" style={{ animationDuration: '6s' }} />
                        Locate on Map
                      </button>
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
