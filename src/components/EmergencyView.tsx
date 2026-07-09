import React, { useState, useMemo, useEffect } from 'react';
import { useClinic } from '../ClinicContext';
import { useTranslation } from '../LanguageContext';
import { Ambulance, Hospital, HospitalBedStatus } from '../types';
import { AIAvatar } from './AIAvatar';
import { toast } from 'sonner';
import {
  AlertTriangle,
  PhoneCall,
  Navigation,
  CheckCircle2,
  Activity,
  PlusCircle,
  Truck,
  HeartPulse,
  ExternalLink,
  MapPin,
  Clock,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export const EmergencyView: React.FC = () => {
  const { state, dispatchAmbulance } = useClinic();
  const { t } = useTranslation();

  // Active SOS target states
  const [activeSos, setActiveSos] = useState<{
    ambulance: Ambulance;
    hospital: Hospital;
    bedStatus: HospitalBedStatus;
    timestamp: string;
  } | null>(null);

  const [triggeringSos, setTriggeringSos] = useState(false);

  // GPS Coordinates States
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat: 13.0827, lng: 80.2707 }); // Default to clinic Chennai center
  const [ambulancePos, setAmbulancePos] = useState<{ lat: number; lng: number } | null>(null);
  const [geolocationGranted, setGeolocationGranted] = useState(false);

  // Sync user GPS coordinates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGeolocationGranted(true);
          toast.success('GPS coordinates synchronized securely with Aura OS.');
        },
        (error) => {
          console.warn('Geolocation access declined or unavailable:', error);
          // Fallback to Chennai base coordinates
          setUserLocation({ lat: 13.0827, lng: 80.2707 });
        }
      );
    }
  }, []);

  // Simulate active vehicle movement
  useEffect(() => {
    if (!activeSos) {
      setAmbulancePos(null);
      return;
    }

    // Spawn vehicle slightly offset from patient location
    const startCoords = {
      lat: userLocation.lat + 0.015,
      lng: userLocation.lng - 0.015,
    };
    setAmbulancePos(startCoords);

    const interval = setInterval(() => {
      setAmbulancePos((current) => {
        if (!current) return null;
        const dLat = userLocation.lat - current.lat;
        const dLng = userLocation.lng - current.lng;
        const distance = Math.sqrt(dLat * dLat + dLng * dLng);

        if (distance < 0.001) {
          clearInterval(interval);
          toast.success('🚑 Assigned Ambulance has arrived at patient coordinates!', { id: 'ambulance-arrival' });
          return userLocation;
        }

        // Crawl closer to user location
        const step = 0.0015;
        return {
          lat: current.lat + (dLat / distance) * step,
          lng: current.lng + (dLng / distance) * step,
        };
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [activeSos, userLocation]);

  const ambulances = state.ambulances;
  const hospitals = state.hospitals;
  const bedStatuses = state.bedStatuses;

  const handleTriggerSos = () => {
    setTriggeringSos(true);
    setActiveSos(null);

    setTimeout(() => {
      // 1. Find nearest Available ambulance
      const availableAmbulances = ambulances.filter((a) => a.status === 'Available');
      if (availableAmbulances.length === 0) {
        toast.error('All fleet ambulances are currently active. Re-routing to secondary municipal services.');
        setTriggeringSos(false);
        return;
      }

      // Sort by distance
      availableAmbulances.sort((a, b) => a.distanceKm - b.distanceKm);
      const assignedAmbulance = availableAmbulances[0];

      // 2. Find nearest hospital with free ICU beds
      const candidateHospitals = hospitals.map((h) => {
        const beds = bedStatuses.find((b) => b.hospitalId === h.id) || { bedsICUFree: 0, distanceKm: 99 };
        return {
          ...h,
          beds,
        };
      });

      const hospitalsWithIcu = candidateHospitals.filter((h) => h.beds.bedsICUFree > 0);
      if (hospitalsWithIcu.length === 0) {
        toast.error('Zero vacant ICU beds across immediate network. Contacting regional state controller.');
        setTriggeringSos(false);
        return;
      }

      // Sort by distance
      hospitalsWithIcu.sort((a, b) => a.beds.distanceKm - b.beds.distanceKm);
      const assignedHospital = hospitalsWithIcu[0];

      // Dispatch the ambulance in store
      dispatchAmbulance(assignedAmbulance.id);

      setActiveSos({
        ambulance: {
          ...assignedAmbulance,
          status: 'On the way',
        },
        hospital: assignedHospital,
        bedStatus: assignedHospital.beds,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      setTriggeringSos(false);
      toast.success('🚨 EMERGENCY SOS LAUNCHED: Nearest ambulance dispatched immediately.');
    }, 1500);
  };

  const handleManualDispatch = async (id: string, num: string) => {
    try {
      await dispatchAmbulance(id);
    } catch (error) {
      toast.error('Dispatch failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <AIAvatar size="md" variant="alert" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              EMERGENCY SOS COORDINATOR <span className="text-xs bg-red-500/10 text-red-400 font-mono px-2 py-0.5 rounded border border-red-500/20">REAL-TIME TRAFFIC CONTROL</span>
            </h2>
            <p className="text-xs text-slate-400">Trigger immediate diagnostic dispatches, track medical transport, and reserve trauma bays</p>
          </div>
        </div>

        {/* WhatsApp Callout */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl flex items-center gap-2 text-xxs font-mono text-emerald-400">
          <PhoneCall size={14} className="animate-bounce" />
          <span>WhatsApp Consultation Line: <strong>+91 87380 30604</strong></span>
        </div>
      </div>

      {/* SOS TRIGGER HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Flashing Button Column */}
        <div className="bg-red-950/15 border border-red-500/20 p-6 rounded-2xl flex flex-col justify-center items-center text-center space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse">
            <AlertTriangle size={36} className="text-red-500" />
          </div>

          <div>
            <h3 className="font-extrabold text-white text-md uppercase font-mono tracking-wider">Trauma Emergency SOS</h3>
            <p className="text-xxs text-slate-400 mt-1 max-w-xs mx-auto">
              Clicking below dispatches the nearest municipal ambulance and reserves an available ICU bed.
            </p>
          </div>

          <button
            onClick={handleTriggerSos}
            disabled={triggeringSos}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] border border-red-500/40 hover:scale-[1.03] transition-all disabled:opacity-45 select-none"
          >
            {triggeringSos ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                TRIAGING OPTIMAL FIT...
              </>
            ) : (
              '🚨 DEPLOY TRAUMA SOS'
            )}
          </button>
        </div>

        {/* Live SOS Assignment Card */}
        <div className="lg:col-span-2 bg-slate-950/40 border border-slate-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center min-h-[220px]">
          {activeSos ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">ACTIVE EMERGENCY SOS TRAFFIC</h4>
                </div>
                <span className="text-xxs font-mono text-slate-500">Dispatched: {activeSos.timestamp}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Side: Live GPS Tracking Map */}
                <div className="h-56 rounded-xl overflow-hidden border border-slate-800/80 relative bg-slate-950 shadow-inner">
                  {!hasValidKey ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/90 font-mono">
                      <Compass size={22} className="text-slate-600 animate-spin mb-1.5" style={{ animationDuration: '8s' }} />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">GPS Tracking Offline</span>
                      <span className="text-[9px] text-slate-500 max-w-[180px] mt-1 leading-normal">
                        Configure GOOGLE_MAPS_PLATFORM_KEY to view live vehicle route tracking.
                      </span>
                    </div>
                  ) : (
                    <APIProvider apiKey={API_KEY} version="weekly">
                      <Map
                        center={ambulancePos || userLocation}
                        zoom={14}
                        mapId="DEMO_MAP_ID"
                        disableDefaultUI={true}
                        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                        style={{ width: '100%', height: '100%' }}
                      >
                        {/* Patient clinic location */}
                        <AdvancedMarker position={userLocation}>
                          <Pin background="#ef4444" borderColor="#ffffff" glyphColor="#ffffff" scale={0.9} />
                        </AdvancedMarker>

                        {/* Crawling Ambulance location */}
                        {ambulancePos && (
                          <AdvancedMarker position={ambulancePos}>
                            <div className="relative flex items-center justify-center">
                              <span className="absolute inline-flex h-8 w-8 rounded-full bg-cyan-400/30 animate-ping"></span>
                              <div className="relative px-2 py-1 bg-cyan-500 text-black font-extrabold font-mono text-[9px] rounded shadow-md border border-white flex items-center gap-1">
                                <span>🚑</span>
                                <span>SOS</span>
                              </div>
                            </div>
                          </AdvancedMarker>
                        )}
                      </Map>
                    </APIProvider>
                  )}
                </div>

                {/* Right Side: Dispatch information & controls */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Ambulance details */}
                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xxs">
                      <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest flex items-center gap-1">
                        <Truck size={11} />
                        Vehicle Telemetry
                      </span>
                      <h5 className="font-extrabold text-white text-xs">{activeSos.ambulance.vehicleNumber}</h5>
                      <p className="text-[10px] text-slate-400">Driver: <strong>{activeSos.ambulance.driverName}</strong></p>
                      <p className="text-[10px] text-slate-400 font-mono">Phone: {activeSos.ambulance.driverPhone}</p>
                      <div className="text-[9px] font-mono text-cyan-400 flex items-center gap-1 pt-1.5">
                        <Navigation size={9} className="animate-bounce" />
                        GPS Tracking Active
                      </div>
                    </div>

                    {/* Target Destination Hospital */}
                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xxs">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                        <HeartPulse size={11} />
                        Reserved Trauma Bay
                      </span>
                      <h5 className="font-extrabold text-white text-xs">{activeSos.hospital.name}</h5>
                      <p className="text-[10px] text-slate-400">{activeSos.hospital.city}</p>
                      <p className="text-[10px] text-slate-400">ICU Bed: <strong className="text-emerald-400">ALLOCATED</strong></p>
                      <div className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 pt-1.5">
                        <CheckCircle2 size={9} />
                        Status: RESERVED
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Redirection Action */}
                  <div className="pt-2.5 border-t border-slate-900 flex justify-between items-center text-xxs font-mono">
                    <span className="text-slate-500">Need real-time consult with medic?</span>
                    <a
                      href="https://wa.me/918738030604?text=Hi,%20I%20need%20clinical%20support%20with%20active%20SOS%20transport"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 font-bold hover:underline flex items-center gap-1"
                    >
                      Launch WhatsApp medic chat <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-12 font-mono text-xs flex flex-col justify-center items-center gap-2">
              <Navigation size={24} className="text-slate-700 animate-pulse" />
              <span>Coordinator idle. Awaiting SOS trigger to calculate telemetry.</span>
            </div>
          )}
        </div>
      </div>

      {/* AMBULANCE FLEET GRID */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Emergency Fleet Grid</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ambulances.map((amb) => (
            <div
              key={amb.id}
              className="p-4 bg-slate-900/30 border border-slate-800/80 rounded-xl hover:border-cyan-500/10 transition flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">{amb.vehicleNumber}</span>
                  <span
                    className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                      amb.status === 'Available'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : amb.status === 'On the way'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {amb.status}
                  </span>
                </div>

                <p className="text-xxs text-slate-400 font-mono">Type: {amb.type} · Area: {amb.area}</p>
                <p className="text-xxs text-slate-400 font-mono">Driver: {amb.driverName} ({amb.driverPhone})</p>
                <p className="text-[10px] text-slate-500 font-mono">Telemetry: {amb.distanceKm} km out</p>
              </div>

              {amb.status === 'Available' && (
                <button
                  onClick={() => handleManualDispatch(amb.id, amb.vehicleNumber)}
                  className="mt-3 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xxs rounded-lg transition"
                >
                  Manual Dispatch
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
