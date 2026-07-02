import React, { useState, useMemo } from 'react';
import { useClinic } from '../ClinicContext';
import { useTranslation } from '../LanguageContext';
import { Appointment, Doctor, Patient, Payment } from '../types';
import { AIAvatar } from './AIAvatar';
import { PaymentModal } from './PaymentModal';
import { toast } from 'sonner';
import { generateReceiptPDF } from '../utils/pdfGenerator';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Activity,
  Plus,
  X,
  CreditCard,
  QrCode,
  CheckCircle,
  Download,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Printer,
  Share2,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  UserPlus,
  ArrowRight,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Static detailed metadata map for practitioners to implement step 2 parameters
const PRACTITIONER_METADATA: Record<string, { experienceYears: number; consultationFee: number; waitingPatientsCount: number; avatarBg: string }> = {
  'doc-1': { experienceYears: 12, consultationFee: 500, waitingPatientsCount: 6, avatarBg: 'from-emerald-500 to-teal-600' },
  'doc-2': { experienceYears: 8, consultationFee: 400, waitingPatientsCount: 3, avatarBg: 'from-purple-500 to-indigo-600' },
  'doc-3': { experienceYears: 14, consultationFee: 600, waitingPatientsCount: 2, avatarBg: 'from-orange-500 to-amber-600' },
  'doc-4': { experienceYears: 10, consultationFee: 500, waitingPatientsCount: 5, avatarBg: 'from-pink-500 to-rose-600' },
};

export const AppointmentsView: React.FC = () => {
  const { state, bookAppointment, updateAppointmentStatus, addPayment, addPatient } = useClinic();
  const { t } = useTranslation();

  // Filters state for the main list
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Main Wizard Modal state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1 to 7

  // --- Wizard Form States ---
  // Step 1: Date
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Step 2: Doctor and Slot
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  // Step 3: Patient (Existing search vs New registration)
  const [patientSelectionMode, setPatientSelectionMode] = useState<'existing' | 'new'>('existing');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [matchedPatients, setMatchedPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // New Patient Form fields
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientGender, setNewPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientBloodGroup, setNewPatientBloodGroup] = useState('O+');
  const [newPatientAddress, setNewPatientAddress] = useState('');
  const [newPatientEmergencyContact, setNewPatientEmergencyContact] = useState('');
  const [newPatientSymptoms, setNewPatientSymptoms] = useState('');

  // Step 4 & 5: Payment details
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);
  const [recordedPayment, setRecordedPayment] = useState<Payment | null>(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState('');

  // Step 6: Generated Invoice Reference details
  const [generatedInvoiceNum, setGeneratedInvoiceNum] = useState('');

  // Step 7: Success Details
  const [finalTokenNumber, setFinalTokenNumber] = useState(1);
  const [finalWaitingTime, setFinalWaitingTime] = useState(0);

  // active booking for the single "Complete & Pay" list action
  const [isPaymentOnlyOpen, setIsPaymentOnlyOpen] = useState(false);
  const [paymentOnlyAppointment, setPaymentOnlyAppointment] = useState<Appointment | null>(null);

  // Get current active lists
  const currentDoctors = state.doctors;
  const currentPatients = state.patients;

  // Determine current day of week to filter doctors by availability
  const selectedDayOfWeek = useMemo(() => {
    if (!selectedDate) return '';
    const dateObj = new Date(selectedDate);
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[dateObj.getDay()];
  }, [selectedDate]);

  // Filter doctors that are available on the selected weekday
  const availableDoctors = useMemo(() => {
    return currentDoctors.filter((doc) => {
      // If doctor availability is empty or contains the day name
      return doc.availability && doc.availability.includes(selectedDayOfWeek);
    });
  }, [currentDoctors, selectedDayOfWeek]);

  // Handle existing patient search (by Mobile, ID, or Aadhaar)
  const handlePatientSearch = (val: string) => {
    setPatientSearchQuery(val);
    if (!val.trim()) {
      setMatchedPatients([]);
      return;
    }
    const q = val.toLowerCase();
    const filtered = currentPatients.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p as any).aadhaar?.includes(q)
      );
    });
    setMatchedPatients(filtered);
  };

  const selectExistingPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearchQuery('');
    setMatchedPatients([]);
    toast.success(`Autofilled patient profile: ${patient.name}`);
  };

  // Move through booking step-by-step
  const handleNextStep = async () => {
    if (wizardStep === 1) {
      if (!selectedDate) {
        toast.error('Please choose a valid scheduling date');
        return;
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (!selectedDoctorId) {
        toast.error('Please choose a clinical practitioner');
        return;
      }
      if (!selectedTimeSlot) {
        toast.error('Please select an available consultation slot');
        return;
      }
      setWizardStep(3);
    } else if (wizardStep === 3) {
      // Validate or create patient profile
      if (patientSelectionMode === 'existing') {
        if (!selectedPatient) {
          toast.error('Please search and select an existing patient, or toggle to New Patient registration');
          return;
        }
      } else {
        // Register New Patient
        if (!newPatientName || !newPatientPhone || !newPatientAge) {
          toast.error('Name, Age, and Mobile Number are required to register');
          return;
        }
        const createdPatient: Patient = {
          id: `pat-${Date.now()}`,
          name: newPatientName,
          age: parseInt(newPatientAge) || 30,
          gender: newPatientGender,
          phone: newPatientPhone,
          email: newPatientEmail,
          city: newPatientAddress || 'Chennai',
          condition: newPatientSymptoms || 'OPD Consultation',
          createdAt: new Date().toISOString()
        };
        try {
          await addPatient(createdPatient);
          setSelectedPatient(createdPatient);
        } catch (err) {
          toast.error('Failed to register patient');
          return;
        }
      }
      setWizardStep(4);
    } else if (wizardStep === 4) {
      // Proceed to Step 5 (Launch UPI QR Payment Modal)
      const generatedAptId = `apt-${Date.now()}`;
      setActiveAppointmentId(generatedAptId);
      setIsPaymentGatewayOpen(true);
      setWizardStep(5);
    }
  };

  // Callback on successful simulated payment
  const handlePaymentGatewaySuccess = async (
    txnId: string,
    method: 'UPI' | 'GPay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'Cash',
    dateTime: string
  ) => {
    if (!selectedPatient || !selectedDoctorId) return;

    const doctor = currentDoctors.find((d) => d.id === selectedDoctorId);
    const doctorMeta = PRACTITIONER_METADATA[selectedDoctorId] || { consultationFee: 500, waitingPatientsCount: 3 };

    // Register Appointment in state
    const appointment: Appointment = {
      id: activeAppointmentId,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: selectedDoctorId,
      doctorName: doctor ? doctor.name : 'Consultant',
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      status: 'completed', // immediately marked as paid and completed
      reason: patientSelectionMode === 'new' ? newPatientSymptoms : 'General Consultation',
      createdAt: dateTime
    };

    const paymentRecord: Payment = {
      id: `pay-${Date.now()}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      amount: doctorMeta.consultationFee,
      method: method === 'Cash' ? 'Cash' : 'UPI',
      upiRef: txnId,
      status: 'completed',
      createdAt: dateTime
    };

    try {
      await bookAppointment(appointment);
      await addPayment(paymentRecord);

      setRecordedPayment(paymentRecord);
      setGeneratedInvoiceNum(`INV-2026-${Math.floor(100000 + Math.random() * 900000)}`);

      // Calculate queue tokens
      const queueCount = state.appointments.filter(a => a.doctorId === selectedDoctorId && a.date === selectedDate).length;
      const calculatedToken = queueCount + 1;
      const waitTime = (doctorMeta.waitingPatientsCount + queueCount) * 15;

      setFinalTokenNumber(calculatedToken);
      setFinalWaitingTime(waitTime);

      setIsPaymentGatewayOpen(false);
      setWizardStep(6); // Forward to Invoice screen
    } catch (err) {
      toast.error('Failed to complete scheduling and payment record');
    }
  };

  // Payment Callback for inline pay
  const handlePaymentOnlySuccess = async (
    txnId: string,
    method: 'UPI' | 'GPay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'Cash',
    dateTime: string
  ) => {
    if (!paymentOnlyAppointment) return;

    const doctorMeta = PRACTITIONER_METADATA[paymentOnlyAppointment.doctorId] || { consultationFee: 500 };
    const paymentRecord: Payment = {
      id: `pay-${Date.now()}`,
      patientId: paymentOnlyAppointment.patientId,
      patientName: paymentOnlyAppointment.patientName,
      amount: doctorMeta.consultationFee,
      method: method === 'Cash' ? 'Cash' : 'UPI',
      upiRef: txnId,
      status: 'completed',
      createdAt: dateTime
    };

    try {
      await addPayment(paymentRecord);
      await updateAppointmentStatus(paymentOnlyAppointment.id, 'completed');
      setIsPaymentOnlyOpen(false);
      setPaymentOnlyAppointment(null);
      toast.success('Consultation marked as paid!');
    } catch (err) {
      toast.error('Failed to record settlement');
    }
  };

  const handleDownloadInvoice = () => {
    if (!recordedPayment || !selectedPatient || !selectedDoctorId) return;
    const doctor = currentDoctors.find((d) => d.id === selectedDoctorId);
    if (doctor) {
      generateReceiptPDF(recordedPayment, selectedPatient, doctor, state.settings);
    }
  };

  const handleDownloadInvoiceOnly = (apt: Appointment) => {
    const doctor = currentDoctors.find((d) => d.id === apt.doctorId);
    const patient = currentPatients.find((p) => p.id === apt.patientId);
    // Find the completed payment for this patient
    const payment = state.payments.find((p) => p.patientId === apt.patientId && p.amount === (PRACTITIONER_METADATA[apt.doctorId]?.consultationFee || 500));

    if (patient && doctor && payment) {
      generateReceiptPDF(payment, patient, doctor, state.settings);
    } else if (patient && doctor) {
      // Generate a dummy paid payment for PDF convenience
      const dummyPayment: Payment = {
        id: `pay-rec-${Date.now()}`,
        patientId: patient.id,
        patientName: patient.name,
        amount: PRACTITIONER_METADATA[apt.doctorId]?.consultationFee || 500,
        method: 'UPI',
        upiRef: 'TXN-SETTLED-DIRECT',
        status: 'completed',
        createdAt: new Date().toISOString()
      };
      generateReceiptPDF(dummyPayment, patient, doctor, state.settings);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleShareInvoice = () => {
    if (navigator.share) {
      navigator.share({
        title: 'AuraOS Medical Billing Invoice',
        text: `Medical consultation invoice is ready for ${selectedPatient?.name}`,
        url: window.location.href
      }).catch(() => {
        toast.info('Invoice link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Invoice link copied to clipboard!');
    }
  };

  const resetWizard = () => {
    setIsWizardOpen(false);
    setWizardStep(1);
    setSelectedDoctorId('');
    setSelectedTimeSlot('');
    setSelectedPatient(null);
    setPatientSearchQuery('');
    setMatchedPatients([]);
    setNewPatientName('');
    setNewPatientAge('');
    setNewPatientGender('Male');
    setNewPatientPhone('');
    setNewPatientEmail('');
    setNewPatientAddress('');
    setNewPatientSymptoms('');
    setNewPatientEmergencyContact('');
    setRecordedPayment(null);
    setActiveAppointmentId('');
  };

  // Main table appointments filtering
  const filteredAppointments = useMemo(() => {
    return state.appointments.filter((a) => {
      const matchesSearch =
        a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.doctorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDoctor = doctorFilter === '' || a.doctorId === doctorFilter;
      const matchesStatus = statusFilter === '' || a.status === statusFilter;
      return matchesSearch && matchesDoctor && matchesStatus;
    });
  }, [state.appointments, searchQuery, doctorFilter, statusFilter]);

  // Calculations for Step 4 Confirmation
  const selectedDoctor = useMemo(() => {
    return currentDoctors.find((d) => d.id === selectedDoctorId);
  }, [selectedDoctorId, currentDoctors]);

  const selectedDoctorMeta = useMemo(() => {
    return PRACTITIONER_METADATA[selectedDoctorId] || { consultationFee: 500, experienceYears: 10, waitingPatientsCount: 3 };
  }, [selectedDoctorId]);

  return (
    <div className="space-y-6">
      {/* Top Heading Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <AIAvatar size="md" variant="idle" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
              {t('appointments')} 
              <span className="text-xs bg-cyan-500/10 text-cyan-400 font-mono px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                {filteredAppointments.length} Bookings
              </span>
            </h2>
            <p className="text-xs text-slate-400">Intelligent clinic scheduler, digital payments routing, and invoice printers</p>
          </div>
        </div>

        <button
          onClick={() => {
            setWizardStep(1);
            setIsWizardOpen(true);
          }}
          className="px-4.5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:scale-105"
        >
          <Plus size={15} />
          Book Appointment
        </button>
      </div>

      {/* Main Filter Section */}
      <div className="bg-slate-950/40 backdrop-blur-md border border-slate-900 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        <div className="flex-grow relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input
            type="text"
            placeholder="Search bookings by patient, department, or practitioner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40 transition-all placeholder-slate-600"
          />
        </div>

        <div className="flex gap-2.5">
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="bg-slate-950 border border-slate-900 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40"
          >
            <option value="">All Practitioners</option>
            {currentDoctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-900 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Paid & Checked-in</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Scheduled Booking Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-2 py-16 border border-dashed border-slate-900 rounded-2xl text-center text-slate-500 font-mono text-xs">
            No consulting slots found matching filters.
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const docMeta = PRACTITIONER_METADATA[apt.doctorId] || { consultationFee: 500 };
            return (
              <div
                key={apt.id}
                className="p-5 bg-slate-950/20 backdrop-blur-sm border border-slate-900 rounded-2xl flex flex-col justify-between hover:border-cyan-500/20 transition-all shadow-lg group relative"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-900 rounded-xl text-cyan-400">
                        <CalendarIcon size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{apt.patientName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          📅 {apt.date} · ⏰ {apt.timeSlot}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        apt.status === 'completed'
                          ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                          : apt.status === 'cancelled'
                          ? 'bg-rose-500/5 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/5 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {apt.status === 'completed' ? 'Paid & Active' : apt.status}
                    </span>
                  </div>

                  <div className="pl-12 space-y-2 text-xxs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Activity size={12} className="text-cyan-500" />
                      <span>Practitioner: <strong className="text-slate-200">{apt.doctorName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CreditCard size={12} className="text-slate-500" />
                      <span>Consultation Fee: <strong className="text-emerald-400 font-mono">₹{docMeta.consultationFee}</strong></span>
                    </div>
                    {apt.reason && (
                      <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-900/60 text-[10px] italic">
                        &ldquo;{apt.reason}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-900/60 flex justify-end gap-2 text-xxs">
                  {apt.status === 'scheduled' ? (
                    <>
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                        className="px-3 py-1.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-400 font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setPaymentOnlyAppointment(apt);
                          setIsPaymentOnlyOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold rounded-xl flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all"
                      >
                        <CreditCard size={11} />
                        Process Payment
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDownloadInvoiceOnly(apt)}
                      className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/20 text-cyan-400 font-extrabold rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Download size={11} />
                      Invoice Receipt PDF
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* INTELLIGENT 7-STEP BOOKING WIZARD MODAL */}
      <AnimatePresence>
        {isWizardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={resetWizard}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#090d16] border border-cyan-500/25 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col my-8"
            >
              {/* Top Accent line */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-500" />

              {/* Header with Title and Wizard Progress Tracker */}
              <div className="p-6 border-b border-slate-900 flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-bold text-white text-base">Clinician Appointment Planner</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Configure slot, select doctor, verify insurance and invoice patients</p>
                </div>
                <button
                  onClick={resetWizard}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Horizontal Multi-Step indicator */}
              <div className="bg-slate-950 px-6 py-3 border-b border-slate-900 flex justify-between items-center text-[10px] font-mono tracking-wide text-slate-500 overflow-x-auto whitespace-nowrap">
                {[
                  '1. Select Date',
                  '2. Consultant',
                  '3. Patient Info',
                  '4. Summary',
                  '5. Payment',
                  '6. Invoice',
                  '7. Completed'
                ].map((stepText, idx) => {
                  const sNum = idx + 1;
                  const isActive = wizardStep === sNum;
                  const isCompleted = wizardStep > sNum;
                  return (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${
                          isActive
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                            : 'border-slate-800 text-slate-600'
                        }`}
                      >
                        {isCompleted ? '✓' : sNum}
                      </span>
                      <span className={isActive ? 'text-white font-bold' : isCompleted ? 'text-emerald-500' : ''}>
                        {stepText.split('. ')[1]}
                      </span>
                      {idx < 6 && <span className="text-slate-800 px-1">&rarr;</span>}
                    </div>
                  );
                })}
              </div>

              {/* Wizard Content Panel */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {/* STEP 1: SELECT DATE */}
                {wizardStep === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="bg-slate-950 p-4.5 border border-slate-900 rounded-2xl space-y-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                          Choose Consultation Date
                        </label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" size={16} />
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500/40 font-mono"
                          />
                        </div>
                      </div>

                      {/* Info on date availability */}
                      <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl flex items-start gap-2.5 text-xxs text-cyan-400">
                        <Clock size={15} className="shrink-0 mt-0.5" />
                        <div>
                          <strong>DATE SMART CHECK:</strong> Only doctors with rostered duties on <span className="underline font-bold font-mono">{selectedDayOfWeek}</span> will be displayed as available. Past dates and unavailable slots are automatically filtered out.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: SELECT DOCTOR AND TIME SLOT */}
                {wizardStep === 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                      Available Consultants for {selectedDate} ({selectedDayOfWeek})
                    </h4>

                    {availableDoctors.length === 0 ? (
                      <div className="p-8 bg-slate-950 border border-slate-900 rounded-2xl text-center text-slate-500 text-xs font-mono">
                        ⚠️ No doctors rostered on {selectedDayOfWeek}. Please try another date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {availableDoctors.map((doc) => {
                          const meta = PRACTITIONER_METADATA[doc.id] || { experienceYears: 10, consultationFee: 500, waitingPatientsCount: 2, avatarBg: 'from-blue-500 to-cyan-500' };
                          const isSelected = selectedDoctorId === doc.id;
                          return (
                            <div
                              key={doc.id}
                              onClick={() => {
                                setSelectedDoctorId(doc.id);
                                setSelectedTimeSlot(''); // reset slot when doctor changes
                              }}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 ${
                                isSelected
                                  ? 'bg-cyan-500/5 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                  : 'bg-slate-950 border-slate-900 hover:border-slate-800'
                              }`}
                            >
                              <div className="flex gap-3">
                                {/* Doctor stylized Profile Photo */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.avatarBg} flex items-center justify-center font-bold text-white text-base shadow`}>
                                  {doc.name.split(' ').slice(1).map(n => n[0]).join('') || 'Dr'}
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                                    {doc.name}
                                    <span className="text-[9px] bg-slate-900 text-cyan-400 px-1.5 py-0.5 rounded font-mono border border-slate-800">
                                      Fee: ₹{meta.consultationFee}
                                    </span>
                                  </h5>
                                  <p className="text-[10px] text-cyan-400 mt-0.5">{doc.specialty}</p>
                                  <div className="flex items-center gap-2.5 text-slate-400 text-[10px] mt-1 font-mono">
                                    <span>🩺 {meta.experienceYears} Yrs Exp</span>
                                    <span>👥 Wait queue: {meta.waitingPatientsCount} patients</span>
                                  </div>
                                </div>
                              </div>

                              {/* Time Slots trigger selection on active */}
                              {isSelected && (
                                <div className="w-full sm:w-auto shrink-0 space-y-1.5 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-900">
                                  <label className="block text-[9px] text-slate-500 font-mono uppercase">
                                    Select Slot
                                  </label>
                                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                                    {doc.timeSlots && doc.timeSlots.map((slot) => {
                                      const isSlotSelected = selectedTimeSlot === slot;
                                      return (
                                        <button
                                          key={slot}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTimeSlot(slot);
                                          }}
                                          className={`py-1 px-2 rounded font-mono text-[9px] font-bold border transition ${
                                            isSlotSelected
                                              ? 'bg-cyan-500 text-black border-cyan-400'
                                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                                          }`}
                                        >
                                          {slot}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 3: PATIENT SELECTION OR REGISTRATION */}
                {wizardStep === 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {/* Patient Mode Toggle */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-900">
                      <button
                        type="button"
                        onClick={() => {
                          setPatientSelectionMode('existing');
                          setSelectedPatient(null);
                        }}
                        className={`py-2 px-4.5 rounded-xl text-xxs font-bold transition flex items-center justify-center gap-2 ${
                          patientSelectionMode === 'existing'
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/10'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <UserCheck size={14} />
                        Existing Patient Search
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPatientSelectionMode('new');
                          setSelectedPatient(null);
                        }}
                        className={`py-2 px-4.5 rounded-xl text-xxs font-bold transition flex items-center justify-center gap-2 ${
                          patientSelectionMode === 'new'
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/10'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <UserPlus size={14} />
                        Register New Patient
                      </button>
                    </div>

                    {/* EXISTING PATIENT SEARCH PANEL */}
                    {patientSelectionMode === 'existing' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                            Search Mobile / Patient ID / Aadhaar
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                            <input
                              type="text"
                              placeholder="e.g. 9876543210 or pat-..."
                              value={patientSearchQuery}
                              onChange={(e) => handlePatientSearch(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                            />
                          </div>
                        </div>

                        {/* Search Matches dropdown */}
                        <AnimatePresence>
                          {matchedPatients.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="bg-slate-950 border border-slate-900 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-900"
                            >
                              {matchedPatients.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => selectExistingPatient(p)}
                                  className="p-3 hover:bg-slate-900 cursor-pointer flex justify-between items-center text-xs"
                                >
                                  <div>
                                    <div className="font-bold text-white">{p.name}</div>
                                    <div className="text-[10px] text-slate-400">Mobile: {p.phone} | ID: {p.id}</div>
                                  </div>
                                  <span className="text-[10px] font-bold text-cyan-400 font-mono">Select &rarr;</span>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Stored Patient Indicator */}
                        {selectedPatient && (
                          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-3 text-xs">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                              <UserCheck size={16} />
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-white">Verified Patient Autofilled:</p>
                              <p className="text-slate-300">{selectedPatient.name} ({selectedPatient.gender}, {selectedPatient.age} Yrs)</p>
                              <p className="text-slate-400 text-[10px]">Phone: {selectedPatient.phone} | City: {selectedPatient.city}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* NEW PATIENT REGISTRATION FORM */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4.5 bg-slate-950 rounded-2xl border border-slate-900">
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Patient's Full Legal Name"
                            value={newPatientName}
                            onChange={(e) => setNewPatientName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">Age *</label>
                          <input
                            type="number"
                            required
                            placeholder="Age in Yrs"
                            value={newPatientAge}
                            onChange={(e) => setNewPatientAge(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">Gender *</label>
                          <select
                            value={newPatientGender}
                            onChange={(e) => setNewPatientGender(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">Mobile Number *</label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. 98765 43210"
                            value={newPatientPhone}
                            onChange={(e) => setNewPatientPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                          <input
                            type="email"
                            placeholder="e.g. patient@auraos.in"
                            value={newPatientEmail}
                            onChange={(e) => setNewPatientEmail(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">Blood Group</label>
                          <select
                            value={newPatientBloodGroup}
                            onChange={(e) => setNewPatientBloodGroup(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                          >
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">Emergency Contact</label>
                          <input
                            type="text"
                            placeholder="Name & Contact phone"
                            value={newPatientEmergencyContact}
                            onChange={(e) => setNewPatientEmergencyContact(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">City / Home Address</label>
                          <input
                            type="text"
                            placeholder="Street, City, pincode"
                            value={newPatientAddress}
                            onChange={(e) => setNewPatientAddress(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">Symptoms / Reason for Visit</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Chest pain, persistent dry cough, general physical health exam"
                            value={newPatientSymptoms}
                            onChange={(e) => setNewPatientSymptoms(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 4: APPOINTMENT CONFIRMATION */}
                {wizardStep === 4 && selectedPatient && selectedDoctor && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-900 space-y-4 text-xs">
                      <div className="flex items-center gap-2 pb-3.5 border-b border-slate-900 text-cyan-400 font-bold uppercase tracking-wider">
                        <FileText size={16} />
                        Consultation Booking Voucher
                      </div>

                      <div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
                        <div>
                          <span className="text-slate-400 block font-mono text-[10px] uppercase">Patient Name</span>
                          <strong className="text-white text-xs">{selectedPatient.name}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-mono text-[10px] uppercase">Practitioner Details</span>
                          <strong className="text-white text-xs">{selectedDoctor.name}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-mono text-[10px] uppercase">Specialty & Dept</span>
                          <span className="text-slate-300">{selectedDoctor.specialty}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-mono text-[10px] uppercase">Scheduled Time</span>
                          <span className="text-slate-300 font-mono">{selectedDate} · {selectedTimeSlot}</span>
                        </div>
                        <div className="col-span-2 border-t border-slate-900 pt-3 flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block font-mono text-[10px] uppercase">Base Consultation Fee</span>
                            <span className="text-emerald-400 font-mono font-bold">₹{selectedDoctorMeta.consultationFee}.00</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block font-mono text-[10px] uppercase">Total Amount</span>
                            <strong className="text-white font-mono text-base font-black">₹{selectedDoctorMeta.consultationFee}.00</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2.5 text-xxs text-amber-400">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>
                        <strong>CONFIRMATION MANDATE:</strong> Proceeding to payment registers this consultation slot as completed, generates a live queue ticket, and creates a billing invoice.
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: UPI QR PAYMENT ACTIVE PANEL */}
                {wizardStep === 5 && selectedPatient && selectedDoctor && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-5">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-pulse">
                      <QrCode size={30} />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <h4 className="text-base font-extrabold text-white">💳 Payment Gateway Terminal Active</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        A secure UPI Payment overlay has been opened for <strong className="text-white">{selectedPatient.name}</strong>. Please complete the transaction of <strong className="text-emerald-400">₹{selectedDoctorMeta.consultationFee}.00</strong> on the QR panel to proceed.
                      </p>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 max-w-sm mx-auto text-left font-mono text-[11px] space-y-1.5 text-slate-400">
                      <div className="flex justify-between">
                        <span>Patient Ref:</span>
                        <span className="text-white">{selectedPatient.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Practitioner:</span>
                        <span className="text-white">{selectedDoctor.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Appointment Ref:</span>
                        <span className="text-cyan-400">{activeAppointmentId || 'Generating...'}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setIsPaymentGatewayOpen(true)}
                        className="px-5 py-2.5 bg-cyan-500/10 border border-cyan-400/30 hover:border-cyan-400 text-cyan-400 font-bold text-xs rounded-xl hover:bg-cyan-500/15 transition-all shadow-[0_0_15px_rgba(6,182,212,0.05)]"
                      >
                        Re-open Payment Gateway Terminal
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 6: CLINICAL BILLING & INVOICE */}
                {wizardStep === 6 && selectedPatient && selectedDoctor && recordedPayment && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {/* Invoice visual container */}
                    <div id="print-area" className="p-6 bg-white text-slate-900 rounded-2xl shadow-xl space-y-4 border border-slate-200">
                      {/* Logo and AuraOS Branding */}
                      <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          {/* Stylized healthcare logo */}
                          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            ✙
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 tracking-tight text-sm">AURA MEDICAL ECOSYSTEM</h4>
                            <p className="text-[9px] text-slate-500 font-mono tracking-wide">AuraOS Diagnostic & Operations Platform</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <h4 className="font-extrabold text-blue-600 text-sm">TAX INVOICE</h4>
                          <p className="text-[9px] text-slate-500 font-mono">Invoice: {generatedInvoiceNum}</p>
                          <p className="text-[9px] text-slate-500 font-mono">Date: {new Date(recordedPayment.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Invoice Details */}
                      <div className="grid grid-cols-2 gap-4 text-xs pb-4 border-b border-slate-100">
                        <div>
                          <h5 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1">BILL TO (PATIENT)</h5>
                          <p className="font-bold text-slate-900">{selectedPatient.name}</p>
                          <p className="text-slate-500 text-[10px]">Age/Gender: {selectedPatient.age} Yrs / {selectedPatient.gender}</p>
                          <p className="text-slate-500 text-[10px]">Phone: {selectedPatient.phone}</p>
                          <p className="text-slate-500 text-[10px]">Location: {selectedPatient.city}</p>
                        </div>
                        <div className="text-right">
                          <h5 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1">PRACTITIONER / DEPARTMENT</h5>
                          <p className="font-bold text-slate-900">{selectedDoctor.name}</p>
                          <p className="text-slate-500 text-[10px]">{selectedDoctor.specialty}</p>
                          <p className="text-slate-500 text-[10px]">Appointment ID: {activeAppointmentId}</p>
                        </div>
                      </div>

                      {/* Itemized Charge Breakdown */}
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                            <th className="py-2 px-3 rounded-l">Description</th>
                            <th className="py-2 px-3 text-center">Qty</th>
                            <th className="py-2 px-3 text-right">Unit Price</th>
                            <th className="py-2 px-3 text-right rounded-r">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                          <tr>
                            <td className="py-2.5 px-3">
                              OPD Clinical Consultation Fee ({selectedDoctor.name})
                              <span className="block text-[10px] text-slate-400 font-mono">Slot: {selectedDate} {selectedTimeSlot}</span>
                            </td>
                            <td className="py-2.5 px-3 text-center">1</td>
                            <td className="py-2.5 px-3 text-right">₹{selectedDoctorMeta.consultationFee}.00</td>
                            <td className="py-2.5 px-3 text-right">₹{selectedDoctorMeta.consultationFee}.00</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Financial Totals */}
                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <div className="w-48 space-y-1.5 text-xs text-right">
                          <div className="flex justify-between text-slate-500">
                            <span>Subtotal:</span>
                            <span>₹{selectedDoctorMeta.consultationFee}.00</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>GST Tax (18%):</span>
                            <span>₹{Math.round(selectedDoctorMeta.consultationFee * 0.18)}.00</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Discount:</span>
                            <span>-₹0.00</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                            <span>Total Amount:</span>
                            <span>₹{selectedDoctorMeta.consultationFee + Math.round(selectedDoctorMeta.consultationFee * 0.18)}.00</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method / Verification Badge */}
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xxs text-emerald-800">
                        <div>
                          <strong className="block text-emerald-950">✅ TRANSACTION COMPLETED / VERIFIED</strong>
                          <span>Settled via {recordedPayment.method} {recordedPayment.upiRef && `· Ref: ${recordedPayment.upiRef}`}</span>
                        </div>
                        <span className="font-bold text-emerald-700 bg-white border border-emerald-150 px-2.5 py-1 rounded">
                          ₹{selectedDoctorMeta.consultationFee + Math.round(selectedDoctorMeta.consultationFee * 0.18)} PAID
                        </span>
                      </div>
                    </div>

                    {/* Actions Trigger Buttons */}
                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      <button
                        onClick={handleDownloadInvoice}
                        className="py-2.5 bg-slate-950 border border-slate-800 hover:border-cyan-500/20 text-cyan-400 font-extrabold text-xxs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Download size={13} />
                        Download PDF
                      </button>
                      <button
                        onClick={handlePrintInvoice}
                        className="py-2.5 bg-slate-950 border border-slate-800 hover:border-cyan-500/20 text-cyan-400 font-extrabold text-xxs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Printer size={13} />
                        Print Invoice
                      </button>
                      <button
                        onClick={handleShareInvoice}
                        className="py-2.5 bg-slate-950 border border-slate-800 hover:border-cyan-500/20 text-cyan-400 font-extrabold text-xxs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Share2 size={13} />
                        Share Invoice
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 7: APPOINTMENT SUCCESS SCREEN */}
                {wizardStep === 7 && selectedPatient && selectedDoctor && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-5">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                      <CheckCircle2 size={32} className="animate-bounce" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-white">✅ Appointment Successfully Booked</h4>
                      <p className="text-xs text-slate-400">Consultant roster details and tokens allocated successfully</p>
                    </div>

                    {/* Allocation Card */}
                    <div className="bg-slate-950/80 border border-slate-850 p-5 rounded-2xl max-w-md mx-auto grid grid-cols-2 gap-4 text-left font-mono text-xs">
                      <div className="col-span-2 pb-2.5 border-b border-slate-900 text-slate-400">
                        <span>Patient:</span>
                        <strong className="text-white block font-sans text-sm mt-0.5">{selectedPatient.name}</strong>
                      </div>
                      <div className="col-span-2 pb-2.5 border-b border-slate-900 text-slate-400">
                        <span>Consultant:</span>
                        <strong className="text-cyan-400 block font-sans text-sm mt-0.5">{selectedDoctor.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Token Number</span>
                        <strong className="text-emerald-400 text-xl font-bold">#{finalTokenNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Est. Wait Time</span>
                        <strong className="text-white text-xl font-bold">{finalWaitingTime} Mins</strong>
                      </div>
                      <div className="col-span-2 text-xxs text-slate-500 italic font-sans text-center mt-2">
                        Token updated in active OPD waiting lists. Please proceed to diagnostics lobby.
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Wizard Footer Controls */}
              <div className="p-6 border-t border-slate-900 flex justify-between bg-slate-950/40">
                {wizardStep > 1 && wizardStep < 6 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(prev => prev - 1)}
                    className="px-4 py-2.5 border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <ChevronLeft size={14} />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {wizardStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-105 transition-all ml-auto"
                  >
                    Continue
                    <ChevronRight size={14} />
                  </button>
                ) : wizardStep === 6 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(7)}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-105 transition-all ml-auto"
                  >
                    Finish & View Token
                    <ArrowRight size={14} />
                  </button>
                ) : wizardStep === 7 ? (
                  <button
                    type="button"
                    onClick={resetWizard}
                    className="px-5 py-2.5 bg-cyan-500 text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all ml-auto"
                  >
                    Return to Dashboard
                  </button>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPI QR PAYMENT MODAL IN WIZARD (STEP 5) */}
      {selectedPatient && selectedDoctor && (
        <PaymentModal
          isOpen={isPaymentGatewayOpen}
          onClose={() => setIsPaymentGatewayOpen(false)}
          amount={selectedDoctorMeta.consultationFee}
          patientName={selectedPatient.name}
          doctorName={selectedDoctor.name}
          appointmentId={activeAppointmentId}
          onPaymentSuccess={handlePaymentGatewaySuccess}
          vpa={state.settings.clinicVpa}
          clinicName={state.settings.clinicName}
        />
      )}

      {/* UPI QR PAYMENT MODAL FOR INLINE APPOINTMENTS */}
      {paymentOnlyAppointment && (
        <PaymentModal
          isOpen={isPaymentOnlyOpen}
          onClose={() => {
            setIsPaymentOnlyOpen(false);
            setPaymentOnlyAppointment(null);
          }}
          amount={PRACTITIONER_METADATA[paymentOnlyAppointment.doctorId]?.consultationFee || 500}
          patientName={paymentOnlyAppointment.patientName}
          doctorName={paymentOnlyAppointment.doctorName}
          appointmentId={paymentOnlyAppointment.id}
          onPaymentSuccess={handlePaymentOnlySuccess}
          vpa={state.settings.clinicVpa}
          clinicName={state.settings.clinicName}
        />
      )}
    </div>
  );
};
