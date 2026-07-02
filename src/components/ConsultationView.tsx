import React, { useState, useMemo } from 'react';
import { useClinic } from '../ClinicContext';
import { useTranslation } from '../LanguageContext';
import { Consultation, Appointment, Patient } from '../types';
import { AIAvatar } from './AIAvatar';
import { toast } from 'sonner';
import { generatePrescriptionPDF, generateConsultationSummaryPDF } from '../utils/pdfGenerator';
import {
  Stethoscope,
  Search,
  Plus,
  Trash2,
  BrainCircuit,
  FileCheck2,
  Download,
  AlertTriangle,
  ClipboardList,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PrescribedDrug {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export const ConsultationView: React.FC = () => {
  const { state, addConsultation, updateAppointmentStatus } = useClinic();
  const { t } = useTranslation();

  // Selected Appointment to consult on
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');

  // Consultation Fields
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  // Prescribed drugs list
  const [prescription, setPrescription] = useState<PrescribedDrug[]>([]);
  const [drugName, setDrugName] = useState('');
  const [drugDosage, setDrugDosage] = useState('');
  const [drugFrequency, setDrugFrequency] = useState('1-0-1');
  const [drugDuration, setDrugDuration] = useState('5 Days');

  // AI Interaction check results
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiWarnings, setAiWarnings] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Saved result reference to allow immediate downloads
  const [savedConsultation, setSavedConsultation] = useState<Consultation | null>(null);

  const activeAppointments = useMemo(() => {
    return state.appointments.filter((a) => a.status === 'scheduled');
  }, [state.appointments]);

  const activeAppointment = useMemo(() => {
    return state.appointments.find((a) => a.id === selectedAppointmentId) || null;
  }, [selectedAppointmentId, state.appointments]);

  const activePatient = useMemo(() => {
    if (!activeAppointment) return null;
    return state.patients.find((p) => p.id === activeAppointment.patientId) || null;
  }, [activeAppointment, state.patients]);

  const handleAddDrug = () => {
    if (!drugName.trim() || !drugDosage.trim()) {
      toast.error('Please enter both drug name and strength dosage');
      return;
    }

    const nextDrug: PrescribedDrug = {
      name: drugName.trim(),
      dosage: drugDosage.trim(),
      frequency: drugFrequency,
      duration: drugDuration,
    };

    setPrescription([...prescription, nextDrug]);
    setDrugName('');
    setDrugDosage('');
    toast.success(`${nextDrug.name} added to prescription draft`);
  };

  const handleRemoveDrug = (index: number) => {
    const next = [...prescription];
    next.splice(index, 1);
    setPrescription(next);
  };

  // Client-side rule engine fallback for severe drug combinations
  const runLocalDrugInteractionChecks = (drugs: PrescribedDrug[]) => {
    const names = drugs.map((d) => d.name.toLowerCase());
    const warnings: string[] = [];

    const pairs = [
      {
        keys: ['aspirin', 'warfarin'],
        warning: 'CRITICAL BLEEDING ALERT: Combined antiplatelet and anticoagulant action severely enhances hemorrhagic risk.'
      },
      {
        keys: ['ibuprofen', 'aspirin'],
        warning: 'GASTRIC RISK ALERT: Dual NSAID intake significantly escalates gastrointestinal bleeding and ulcer risk.'
      },
      {
        keys: ['sildenafil', 'nitroglycerin'],
        warning: 'FATAL HYPOTENSION ALERT: Co-administering Nitric Oxide donors and PDE5 inhibitors causes severe, potentially fatal blood pressure crashes.'
      },
      {
        keys: ['metformin', 'contrast dye'],
        warning: 'LACTIC ACIDOSIS ALERT: Contrast media can induce acute kidney failure, accumulating Metformin. Suspend Metformin 48 hours before/after contrast procedures.'
      }
    ];

    pairs.forEach((pair) => {
      const hasAll = pair.keys.every((key) => names.some((name) => name.includes(key)));
      if (hasAll) {
        warnings.push(pair.warning);
      }
    });

    return warnings;
  };

  const handleAnalyzePrescriptions = async () => {
    if (prescription.length === 0) {
      toast.error('Please add at least one medication to run analysis');
      return;
    }

    setAiAnalyzing(true);
    setAiWarnings(null);
    setAiSummary(null);

    // 1. Run client-side hardcoded interactions first
    const localIssues = runLocalDrugInteractionChecks(prescription);

    try {
      // 2. Call backend proxy
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          diagnosis,
          prescription,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAiSummary(data.summary);
        // Combine client-side rules with AI output if any rules matched
        if (localIssues.length > 0) {
          setAiWarnings(localIssues.join('\n') + '\n\n' + (data.warnings || ''));
        } else {
          setAiWarnings(data.warnings);
        }
      } else {
        throw new Error(data.details || 'Backend proxy failure');
      }
    } catch (error) {
      console.warn('AI analysis fell back to local clinical rules engine:', error);
      // Fallback purely to local interactions
      setAiSummary('Local rule check completed. (Offline/Sandbox fallback)');
      if (localIssues.length > 0) {
        setAiWarnings(localIssues.join('\n'));
      } else {
        setAiWarnings('Clear: No common catastrophic interactions flagged by local database.');
      }
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppointment || !activePatient) {
      toast.error('Please select an active scheduled patient appointment');
      return;
    }

    if (!symptoms.trim() || !diagnosis.trim()) {
      toast.error('Symptoms and Clinical Diagnosis are required fields');
      return;
    }

    const doctor = state.doctors.find((d) => d.id === activeAppointment.doctorId);
    if (!doctor) return;

    // Run rapid final check
    const localIssues = runLocalDrugInteractionChecks(prescription);

    const consultation: Consultation = {
      id: `cons-${Date.now()}`,
      appointmentId: activeAppointment.id,
      patientId: activePatient.id,
      patientName: activePatient.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      symptoms,
      diagnosis,
      notes: notes || 'No extra clinical remarks added.',
      prescription,
      interactionWarnings: localIssues.length > 0 ? localIssues.join(' | ') : undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      await addConsultation(consultation);
      await updateAppointmentStatus(activeAppointment.id, 'completed');
      setSavedConsultation(consultation);
      toast.success('Consultation successfully added to EHR ledger!');
    } catch (err) {
      toast.error('Failed to save consultation summary');
    }
  };

  const handleDownloadPrescription = () => {
    if (!savedConsultation || !activePatient) return;
    const doctor = state.doctors.find((d) => d.id === savedConsultation.doctorId);
    if (doctor) {
      generatePrescriptionPDF(savedConsultation, activePatient, doctor, state.settings);
    }
  };

  const handleDownloadSummary = () => {
    if (!savedConsultation || !activePatient) return;
    const doctor = state.doctors.find((d) => d.id === savedConsultation.doctorId);
    if (doctor) {
      generateConsultationSummaryPDF(savedConsultation, activePatient, doctor);
    }
  };

  const handleResetConsultation = () => {
    setSelectedAppointmentId('');
    setSymptoms('');
    setDiagnosis('');
    setNotes('');
    setPrescription([]);
    setAiWarnings(null);
    setAiSummary(null);
    setSavedConsultation(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <AIAvatar size="md" variant="idle" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {t('consultation')} <span className="text-xs bg-cyan-500/10 text-cyan-400 font-mono px-2 py-0.5 rounded border border-cyan-500/20">AI CO-PILOT ACTIVE</span>
            </h2>
            <p className="text-xs text-slate-400">Conduct diagnostic examinations, build prescriptions, and run drug interaction safety checks</p>
          </div>
        </div>

        {savedConsultation && (
          <button
            onClick={handleResetConsultation}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:text-white hover:border-slate-700 transition"
          >
            Start Another Consultation
          </button>
        )}
      </div>

      {/* Main Form */}
      {!savedConsultation ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2-Span): Consultation Details & Rx */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950/30 border border-slate-900 p-5 rounded-2xl space-y-4">
              {/* Select Active Scheduled Appointment */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                  <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Select Scheduled Patient Appointment *</label>
                  <select
                    value={selectedAppointmentId}
                    onChange={(e) => setSelectedAppointmentId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Choose Scheduled Appointment --</option>
                    {activeAppointments.map((apt) => (
                      <option key={apt.id} value={apt.id}>
                        {apt.patientName} (Practitioner: {apt.doctorName} · {apt.timeSlot})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activePatient && (
                <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-xxs flex items-center gap-3">
                  <UserCheck size={16} className="text-cyan-400" />
                  <div>
                    <span className="text-slate-300 font-bold">Selected EHR:</span> {activePatient.name} ({activePatient.gender}, {activePatient.age} Yrs) · City: {activePatient.city}
                  </div>
                </div>
              )}

              {/* Symptoms and Diagnosis fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Patient Symptoms *</label>
                  <textarea
                    required
                    rows={3}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                    placeholder="Describe symptoms presented..."
                  />
                </div>

                <div>
                  <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Clinical Diagnosis *</label>
                  <textarea
                    required
                    rows={3}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                    placeholder="Enter diagnostic conclusions..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Doctor Clinical Notes / Advice</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                  placeholder="Extra advice, referrals, next checkups..."
                />
              </div>
            </div>

            {/* Prescription draft builder */}
            <div className="bg-slate-950/30 border border-slate-900 p-5 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5 uppercase font-mono tracking-wider border-b border-slate-900 pb-2">
                <ClipboardList size={16} className="text-cyan-400" />
                Prescribed Medications & Posology Draft
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Medication Name</label>
                  <input
                    type="text"
                    value={drugName}
                    onChange={(e) => setDrugName(e.target.value)}
                    placeholder="e.g. Aspirin / Sildenafil"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Dosage / Strength</label>
                  <input
                    type="text"
                    value={drugDosage}
                    onChange={(e) => setDrugDosage(e.target.value)}
                    placeholder="e.g. 500mg / 50mg"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Frequency</label>
                  <select
                    value={drugFrequency}
                    onChange={(e) => setDrugFrequency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="1-0-1">1-0-1 (Morning & Night)</option>
                    <option value="1-1-1">1-1-1 (Thrice daily)</option>
                    <option value="1-0-0">1-0-0 (Morning only)</option>
                    <option value="0-0-1">0-0-1 (Night only)</option>
                    <option value="PRN">PRN (As needed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Duration</label>
                  <input
                    type="text"
                    value={drugDuration}
                    onChange={(e) => setDrugDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddDrug}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xxs rounded-lg flex items-center gap-1 transition"
              >
                <Plus size={12} />
                Add to Prescription Draft
              </button>

              {/* Table of draft prescription */}
              {prescription.length > 0 && (
                <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xxs font-mono whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                          <th className="p-2">Drug Name</th>
                          <th className="p-2">Strength</th>
                          <th className="p-2">Frequency</th>
                          <th className="p-2">Duration</th>
                          <th className="p-2 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        {prescription.map((d, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-bold text-white">{d.name}</td>
                            <td className="p-2">{d.dosage}</td>
                            <td className="p-2">{d.frequency}</td>
                            <td className="p-2">{d.duration}</td>
                            <td className="p-2 text-right">
                              <button
                                onClick={() => handleRemoveDrug(idx)}
                                className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-900 transition"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Interaction Checks & Action triggers */}
          <div className="space-y-4">
            <div className="bg-slate-950/30 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between h-full">
              <div className="space-y-4">
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <BrainCircuit size={16} className="text-cyan-400" />
                  Prescription Safety check
                </h3>

                <p className="text-xxs text-slate-400">
                  Click below to analyze the active prescription list against known drug-drug contraindications and warnings.
                </p>

                <button
                  type="button"
                  onClick={handleAnalyzePrescriptions}
                  disabled={aiAnalyzing || prescription.length === 0}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition disabled:opacity-40"
                >
                  {aiAnalyzing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Auditing Interactions...
                    </>
                  ) : (
                    <>
                      <BrainCircuit size={14} />
                      Audit Prescriptions (AI Check)
                    </>
                  )}
                </button>

                {/* AI Outputs */}
                {(aiSummary || aiWarnings) && (
                  <div className="space-y-3 pt-2">
                    {aiWarnings && aiWarnings.toLowerCase().includes('alert') && (
                      <div className="bg-red-500/5 border border-red-500/30 p-3.5 rounded-xl text-xxs text-red-400 flex gap-2 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                        <AlertTriangle size={16} className="shrink-0 text-red-500" />
                        <div>
                          <strong className="block text-red-500 uppercase font-mono tracking-wider mb-1 text-[9px]">Contraindication Warning</strong>
                          <span className="leading-normal whitespace-pre-line">{aiWarnings}</span>
                        </div>
                      </div>
                    )}

                    {aiSummary && (
                      <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-xl text-xxs text-slate-300 leading-normal">
                        <strong className="block text-cyan-400 font-mono uppercase tracking-wider mb-1 text-[9px]">Audit Log Summary</strong>
                        <p className="whitespace-pre-line">{aiSummary}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Master Save Trigger */}
              <div className="border-t border-slate-900 pt-4 mt-6">
                <button
                  onClick={handleSaveConsultation}
                  disabled={!selectedAppointmentId}
                  className="w-full py-3 bg-cyan-500 text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition disabled:opacity-40 hover:bg-cyan-400"
                >
                  <FileCheck2 size={14} />
                  Save EHR Consultation
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Saved Consultation Successful view, displaying printable templates */
        <div className="max-w-xl mx-auto bg-slate-950 border border-cyan-500/30 rounded-2xl p-6 text-center space-y-6 shadow-[0_0_25px_rgba(6,182,212,0.2)]">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto text-xl">
            <FileCheck2 size={24} />
          </div>

          <div>
            <h3 className="font-extrabold text-white text-md">Clinical Consultation Recorded</h3>
            <p className="text-xxs text-slate-400 mt-1">EHR summary correctly committed to cloud Ledger</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-left text-xxs font-mono space-y-2 max-w-sm mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-400">Patient:</span>
              <strong className="text-white">{savedConsultation.patientName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Consultant:</span>
              <strong className="text-white">{savedConsultation.doctorName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ref Code:</span>
              <strong className="text-white">CON-{savedConsultation.id.slice(0, 8).toUpperCase()}</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
            <button
              onClick={handleDownloadPrescription}
              className="px-4 py-2 border border-slate-800 hover:border-cyan-500/30 bg-slate-950 hover:bg-slate-900 text-cyan-400 font-bold text-xs rounded-lg flex items-center gap-1.5 justify-center transition"
            >
              <Download size={14} />
              Download Prescription PDF
            </button>
            <button
              onClick={handleDownloadSummary}
              className="px-4 py-2 border border-slate-800 hover:border-cyan-500/30 bg-slate-950 hover:bg-slate-900 text-cyan-400 font-bold text-xs rounded-lg flex items-center gap-1.5 justify-center transition"
            >
              <Download size={14} />
              Download Summary PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
