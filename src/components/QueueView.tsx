import React, { useState, useMemo } from 'react';
import { useClinic } from '../ClinicContext';
import { useTranslation } from '../LanguageContext';
import { QueueItem } from '../types';
import { AIAvatar } from './AIAvatar';
import { toast } from 'sonner';
import {
  UserCheck,
  Play,
  CheckCircle,
  TrendingUp,
  XCircle,
  Clock,
  PlusCircle,
  ListRestart,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const QueueView: React.FC = () => {
  const { state, addToQueue, updateQueueStatus, clearQueue } = useClinic();
  const { t } = useTranslation();

  // Admission form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // 1. Group / Filter Queue
  const waitingList = useMemo(() => state.queue.filter((q) => q.status === 'Waiting'), [state.queue]);
  const activeList = useMemo(() => state.queue.filter((q) => q.status === 'In Progress'), [state.queue]);
  const completedList = useMemo(() => state.queue.filter((q) => q.status === 'Completed' || q.status === 'Skipped'), [state.queue]);

  // Compute stats
  const totalWaiting = waitingList.length;
  const currentToken = activeList[0]?.tokenNumber || 'None';
  const averageWaitTime = totalWaiting * 15;

  // Generate unique sequential token
  const getNextTokenNumber = () => {
    if (state.queue.length === 0) return 101;
    const maxToken = Math.max(...state.queue.map((q) => q.tokenNumber));
    return maxToken + 1;
  };

  const handleAdmitPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedDoctorId) {
      toast.error('Please select both a patient and a consulting practitioner');
      return;
    }

    const patient = state.patients.find((p) => p.id === selectedPatientId);
    const doctor = state.doctors.find((d) => d.id === selectedDoctorId);

    if (!patient || !doctor) return;

    // Check if patient is already waiting in queue
    const isAlreadyWaiting = state.queue.some((q) => q.patientId === patient.id && (q.status === 'Waiting' || q.status === 'In Progress'));
    if (isAlreadyWaiting) {
      toast.error(`${patient.name} is already active in the queue`);
      return;
    }

    const precedingWaitingCount = waitingList.length;
    const estimatedWaitMinutes = precedingWaitingCount * 15;

    const nextItem: QueueItem = {
      id: `q-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      tokenNumber: getNextTokenNumber(),
      doctorId: doctor.id,
      doctorName: doctor.name,
      status: 'Waiting',
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedWaitMinutes,
    };

    try {
      await addToQueue(nextItem);
      setSelectedPatientId('');
      setSelectedDoctorId('');
    } catch (err) {
      toast.error('Error generating token');
    }
  };

  // Call next patient sequentially
  const handleCallNext = async () => {
    if (waitingList.length === 0) {
      toast.info('No patients waiting in queue');
      return;
    }

    // Sort waiting list by token number to get the absolute next
    const sortedWaiting = [...waitingList].sort((a, b) => a.tokenNumber - b.tokenNumber);
    const nextPatient = sortedWaiting[0];

    // If there's an existing In Progress patient, transition them to Completed first
    if (activeList.length > 0) {
      for (const active of activeList) {
        await updateQueueStatus(active.id, 'Completed');
      }
    }

    try {
      await updateQueueStatus(nextPatient.id, 'In Progress');
      toast.success(`Calling Token #${nextPatient.tokenNumber} (${nextPatient.patientName}) to Cabinet!`);
    } catch (err) {
      toast.error('Failed to call next token');
    }
  };

  const handleManualStatusChange = async (id: string, status: QueueItem['status']) => {
    try {
      await updateQueueStatus(id, status);
      toast.success(`Token transitioned to ${status}`);
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <AIAvatar size="md" variant="idle" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {t('queue')} <span className="text-xs bg-cyan-500/10 text-cyan-400 font-mono px-2 py-0.5 rounded border border-cyan-500/20">LIVE CABINET FLOW</span>
            </h2>
            <p className="text-xs text-slate-400">Sequence patient admissions, track wait times, and dispatch cabinet calls</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCallNext}
            disabled={waitingList.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-105 disabled:opacity-40"
          >
            <Play size={12} fill="currentColor" />
            Call Next Patient
          </button>
          <button
            onClick={clearQueue}
            disabled={state.queue.length === 0}
            className="px-3.5 py-2 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <ListRestart size={14} />
            {t('clearQueue')}
          </button>
        </div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/40 border border-blue-500/10 p-5 rounded-2xl relative overflow-hidden flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="text-xxs font-mono text-slate-500 uppercase tracking-widest">Preceding Waiting</div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">{totalWaiting} Patients</div>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-blue-500/10 p-5 rounded-2xl relative overflow-hidden flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-xxs font-mono text-slate-500 uppercase tracking-widest">Active Consultation</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">#{currentToken}</div>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-blue-500/10 p-5 rounded-2xl relative overflow-hidden flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xxs font-mono text-slate-500 uppercase tracking-widest">Estimated Wait-time</div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">~ {averageWaitTime} Mins</div>
          </div>
        </div>
      </div>

      {/* Main Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Admit to Queue Form */}
        <div className="bg-slate-950/30 border border-slate-900 p-5 rounded-2xl h-fit">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-1.5 uppercase font-mono tracking-wider">
            <PlusCircle size={16} className="text-cyan-400" />
            Admit Patient to Queue
          </h3>

          <form onSubmit={handleAdmitPatient} className="space-y-4">
            <div>
              <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Select Patient Record *</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">-- Choose Patient --</option>
                {state.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phone.slice(-10)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Consulting Practitioner *</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">-- Choose Doctor --</option>
                {state.doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition"
            >
              Generate Queue Token
              <ArrowRight size={14} />
            </button>
          </form>
        </div>

        {/* Right Column (2-Span): Sequential Waiting & Completed Columns */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Waiting Pool */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Waiting Pool</span>
              <span className="text-xxs px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">{waitingList.length}</span>
            </h4>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {waitingList.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-900 rounded-xl text-center text-slate-500 text-xs font-mono">
                  No patients waiting.
                </div>
              ) : (
                waitingList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-cyan-500/20 transition group flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-cyan-400 bg-cyan-500/5 border border-cyan-500/10 px-1.5 py-0.5 rounded">
                          Token #{item.tokenNumber}
                        </span>
                        <span className="text-xxs text-slate-500 font-mono">Checked: {item.checkInTime}</span>
                      </div>
                      <h5 className="text-xs font-bold text-white mt-1.5">{item.patientName}</h5>
                      <p className="text-[10px] text-slate-400 font-medium">To see: {item.doctorName}</p>
                    </div>

                    <div className="flex gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleManualStatusChange(item.id, 'In Progress')}
                        className="p-1.5 bg-slate-800 hover:bg-cyan-500/10 rounded text-cyan-400"
                        title="Admit to Consultation Room"
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                      <button
                        onClick={() => handleManualStatusChange(item.id, 'Skipped')}
                        className="p-1.5 bg-slate-800 hover:bg-red-500/10 rounded text-red-400"
                        title="Skip Patient"
                      >
                        <XCircle size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active & Checked Out */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Active Cabinets & Checkout</h4>

            <div className="space-y-3">
              {/* Active list */}
              {activeList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-emerald-950/15 border border-emerald-500/30 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden"
                >
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 m-2 animate-ping"></span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xxs font-mono font-bold text-emerald-400 uppercase tracking-widest">IN CABINET</span>
                      <span className="text-xxs text-slate-400">· Token #{item.tokenNumber}</span>
                    </div>
                    <h5 className="text-xs font-bold text-white mt-1">{item.patientName}</h5>
                    <p className="text-[10px] text-emerald-300">Consulting: {item.doctorName}</p>
                  </div>

                  <button
                    onClick={() => handleManualStatusChange(item.id, 'Completed')}
                    className="p-1.5 bg-emerald-500 text-black hover:bg-emerald-400 rounded-lg"
                    title="Complete Consultation"
                  >
                    <CheckCircle size={12} />
                  </button>
                </div>
              ))}

              {/* Completed list */}
              <div className="border-t border-slate-900 pt-3 space-y-2.5">
                <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Recently Checked Out</div>
                {completedList.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-900/20 border border-slate-900 rounded-lg flex items-center justify-between text-xxs text-slate-400 font-mono"
                  >
                    <div>
                      <span className="font-bold text-slate-300">{item.patientName}</span> (Token #{item.tokenNumber})
                      <div className="text-[10px] text-slate-500">Seen by {item.doctorName}</div>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold ${
                        item.status === 'Completed' ? 'bg-slate-800 text-slate-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
