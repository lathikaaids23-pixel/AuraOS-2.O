import React, { useState, useMemo } from 'react';
import { useClinic } from '../ClinicContext';
import { useTranslation } from '../LanguageContext';
import { Patient, Consultation } from '../types';
import { AIAvatar } from './AIAvatar';
import { toast } from 'sonner';
import Papa from 'papaparse';
import {
  Plus,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit3,
  Download,
  AlertCircle,
  FileSpreadsheet,
  X,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generatePrescriptionPDF, generateConsultationSummaryPDF } from '../utils/pdfGenerator';

export const PatientsView: React.FC = () => {
  const { state, addPatient, updatePatient, deletePatient } = useClinic();
  const { t } = useTranslation();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [formPhone, setFormPhone] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formCondition, setFormCondition] = useState('');
  const [formOutcome, setFormOutcome] = useState('In Treatment');
  const [formEmail, setFormEmail] = useState('');

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [columnMap, setColumnMap] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    city: '',
    condition: '',
  });

  // Extract cities and outcomes for filter dropdowns
  const availableCities = useMemo(() => {
    const set = new Set(state.patients.map((p) => p.city));
    return Array.from(set);
  }, [state.patients]);

  const availableOutcomes = ['In Treatment', 'Recovered', 'Referred', 'Completed'];

  // Form Reset
  const resetForm = () => {
    setFormName('');
    setFormAge('');
    setFormGender('Male');
    setFormPhone('');
    setFormCity('');
    setFormCondition('');
    setFormOutcome('In Treatment');
    setFormEmail('');
  };

  // Indian Phone Validator (10 digits, optional +91 prefix)
  const validateIndianPhone = (phone: string) => {
    const cleaned = phone.replace(/[\s\-]/g, '');
    const regex = /^(\+91)?\d{10}$/;
    return regex.test(cleaned);
  };

  // Submit Handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAge || !formPhone || !formCity || !formCondition) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!validateIndianPhone(formPhone)) {
      toast.error('Invalid Indian phone format. Must be 10 digits (e.g. 9876543210)');
      return;
    }

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      name: formName,
      age: parseInt(formAge, 10),
      gender: formGender,
      phone: formPhone,
      city: formCity,
      condition: formCondition,
      outcome: formOutcome,
      email: formEmail || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      await addPatient(newPatient);
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      toast.error('Error adding patient');
    }
  };

  const handleEditOpen = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormName(patient.name);
    setFormAge(String(patient.age));
    setFormGender(patient.gender);
    setFormPhone(patient.phone);
    setFormCity(patient.city);
    setFormCondition(patient.condition);
    setFormOutcome(patient.outcome || 'In Treatment');
    setFormEmail(patient.email || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    if (!formName.trim() || !formAge || !formPhone || !formCity || !formCondition) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!validateIndianPhone(formPhone)) {
      toast.error('Invalid Indian phone format');
      return;
    }

    const updated: Patient = {
      ...selectedPatient,
      name: formName,
      age: parseInt(formAge, 10),
      gender: formGender,
      phone: formPhone,
      city: formCity,
      condition: formCondition,
      outcome: formOutcome,
      email: formEmail || undefined,
    };

    try {
      await updatePatient(updated);
      setIsEditOpen(false);
      setSelectedPatient(null);
      resetForm();
    } catch (err) {
      toast.error('Error updating patient');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete patient "${name}"?`)) {
      try {
        await deletePatient(id);
      } catch (err) {
        toast.error('Error deleting patient');
      }
    }
  };

  // CSV parsing trigger
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields && results.data.length > 0) {
          setCsvHeaders(results.meta.fields);
          setCsvRows(results.data);
          // Auto map guess
          const maps = { ...columnMap };
          results.meta.fields.forEach((h) => {
            const lower = h.toLowerCase();
            if (lower.includes('name')) (maps as any).name = h;
            else if (lower.includes('age')) (maps as any).age = h;
            else if (lower.includes('gender') || lower.includes('sex')) (maps as any).gender = h;
            else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) (maps as any).phone = h;
            else if (lower.includes('city') || lower.includes('address')) (maps as any).city = h;
            else if (lower.includes('condition') || lower.includes('symptom')) (maps as any).condition = h;
          });
          setColumnMap(maps);
        } else {
          toast.error('No readable headers or columns found in CSV');
        }
      },
      error: (err) => {
        toast.error(`CSV Parsing failed: ${err.message}`);
      }
    });
  };

  const handleBulkImport = async () => {
    if (!columnMap.name || !columnMap.age || !columnMap.phone || !columnMap.condition) {
      toast.error('Please map at least Name, Age, Phone, and Condition columns');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const row of csvRows) {
      const name = row[columnMap.name];
      const ageStr = row[columnMap.age];
      const gender = (row[columnMap.gender] || 'Male') as any;
      const phone = row[columnMap.phone];
      const city = row[columnMap.city] || 'Unknown';
      const condition = row[columnMap.condition];

      if (name && ageStr && phone && condition) {
        const patient: Patient = {
          id: `pat-import-${Math.random().toString(36).substr(2, 9)}`,
          name: String(name),
          age: parseInt(ageStr, 10) || 30,
          gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : 'Male',
          phone: String(phone),
          city: String(city),
          condition: String(condition),
          outcome: 'In Treatment',
          createdAt: new Date().toISOString(),
        };

        try {
          await addPatient(patient);
          successCount++;
        } catch (error) {
          failCount++;
        }
      } else {
        failCount++;
      }
    }

    toast.success(`Bulk insert completed. Imported ${successCount} patients successfully.`);
    if (failCount > 0) {
      toast.error(`${failCount} records failed due to missing required mapped fields.`);
    }
    setIsImportOpen(false);
    setCsvFile(null);
    setCsvRows([]);
  };

  // Filter patients
  const filteredPatients = useMemo(() => {
    return state.patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery);

      const matchesCity = cityFilter === '' || p.city === cityFilter;
      const matchesOutcome = outcomeFilter === '' || p.outcome === outcomeFilter;

      return matchesSearch && matchesCity && matchesOutcome;
    });
  }, [state.patients, searchQuery, cityFilter, outcomeFilter]);

  // Pagination bounds
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(start, start + itemsPerPage);
  }, [filteredPatients, currentPage]);

  const triggerPDFDownload = (patient: Patient) => {
    // Generate a quick patient summary PDF
    const fakeConsultation: Consultation = {
      id: `cons-mock-${patient.id}`,
      patientId: patient.id,
      patientName: patient.name,
      doctorId: 'doc-1',
      doctorName: 'Dr. Rahul Sharma',
      symptoms: patient.condition,
      diagnosis: 'EHR Summary Record',
      notes: 'Active clinical record registered on Aura OS. Outcome status: ' + (patient.outcome || 'Pending'),
      prescription: [],
      createdAt: patient.createdAt,
    };
    const doctor = state.doctors[0];
    generateConsultationSummaryPDF(fakeConsultation, patient, doctor);
    toast.success(`EHR Profile PDF downloaded for ${patient.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <AIAvatar size="md" variant="idle" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {t('patients')} <span className="text-xs bg-cyan-500/10 text-cyan-400 font-mono px-2 py-0.5 rounded border border-cyan-500/20">{filteredPatients.length} EHR Total</span>
            </h2>
            <p className="text-xs text-slate-400">Add, manage, and batch-import electronic health records (EHR)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2 border border-slate-800 hover:border-cyan-500/30 bg-slate-950/60 hover:bg-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Upload size={14} className="text-cyan-400" />
            {t('importCSV')}
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-105"
          >
            <Plus size={14} />
            {t('addPatient')}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/40 border border-blue-500/10 p-4 rounded-2xl flex flex-col md:flex-row gap-3.5 items-stretch md:items-center">
        <div className="flex-grow relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder={t('searchPatients')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <div className="relative flex-grow sm:flex-grow-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950/60 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Cities</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <select
            value={outcomeFilter}
            onChange={(e) => {
              setOutcomeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Outcomes</option>
            {availableOutcomes.map((out) => (
              <option key={out} value={out}>
                {out}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-slate-900/20 border border-blue-500/5 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-xxs font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">{t('patientName')}</th>
                <th className="py-3 px-4">{t('age')} / {t('gender')}</th>
                <th className="py-3 px-4">{t('phone')}</th>
                <th className="py-3 px-4">{t('city')}</th>
                <th className="py-3 px-4">{t('condition')}</th>
                <th className="py-3 px-4">{t('outcome')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs text-slate-300">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 font-mono">
                    No matching EHR profiles found.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/30 transition">
                    <td className="py-3.5 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-3.5 px-4">
                      {p.age} Yrs / <span className="text-slate-400">{p.gender}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{p.phone}</td>
                    <td className="py-3.5 px-4">{p.city}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-400" title={p.condition}>
                      {p.condition}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          p.outcome === 'Recovered'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                            : p.outcome === 'Referred'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {p.outcome || 'In Treatment'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => triggerPDFDownload(p)}
                          className="p-1.5 hover:bg-slate-800 rounded text-cyan-400 transition"
                          title="Download Patient Record (PDF)"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => handleEditOpen(p)}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-950/60 border-t border-slate-900 px-4 py-3 flex justify-between items-center text-slate-400">
          <div className="text-xxs font-mono">
            Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} records
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
              disabled={currentPage === 1}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xxs font-mono text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
              disabled={currentPage === totalPages}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ADD PATIENT MODAL */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-900/60 shrink-0">
                <div className="flex items-center gap-2">
                  <AIAvatar size="sm" variant="idle" />
                  <h3 className="font-bold text-white text-md">Register New Patient Record</h3>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="flex flex-col flex-grow overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4 flex-grow">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="e.g. Arun Kumar"
                      />
                    </div>

                    <div>
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Age *</label>
                      <input
                        type="number"
                        required
                        value={formAge}
                        onChange={(e) => setFormAge(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="e.g. 34"
                      />
                    </div>

                    <div>
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Gender *</label>
                      <select
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone Number (Indian) *</label>
                      <input
                        type="text"
                        required
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="e.g. 9876543210"
                      />
                    </div>

                    <div>
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">City *</label>
                      <input
                        type="text"
                        required
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="e.g. Chennai"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Condition / Primary Symptoms *</label>
                    <textarea
                      required
                      rows={2}
                      value={formCondition}
                      onChange={(e) => setFormCondition(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                      placeholder="e.g. Severe headache, persistent cough"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">EHR Outcome</label>
                      <select
                        value={formOutcome}
                        onChange={(e) => setFormOutcome(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="In Treatment">In Treatment</option>
                        <option value="Recovered">Recovered</option>
                        <option value="Referred">Referred</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Address (Optional)</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="e.g. arun@mail.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-900 bg-slate-950/40 flex justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-500 text-black font-semibold rounded-xl text-xs shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT PATIENT MODAL */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditOpen(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-900/60 shrink-0">
                <div className="flex items-center gap-2">
                  <AIAvatar size="sm" variant="idle" />
                  <h3 className="font-bold text-white text-md">Edit Patient EHR</h3>
                </div>
                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex flex-col flex-grow overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4 flex-grow">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Age *</label>
                      <input
                        type="number"
                        required
                        value={formAge}
                        onChange={(e) => setFormAge(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Gender *</label>
                      <select
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">City *</label>
                      <input
                        type="text"
                        required
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Condition / Primary Symptoms *</label>
                    <textarea
                      required
                      rows={2}
                      value={formCondition}
                      onChange={(e) => setFormCondition(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">EHR Outcome</label>
                      <select
                        value={formOutcome}
                        onChange={(e) => setFormOutcome(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="In Treatment">In Treatment</option>
                        <option value="Recovered">Recovered</option>
                        <option value="Referred">Referred</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xxs text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-900 bg-slate-950/40 flex justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-500 text-black font-semibold rounded-xl text-xs shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  >
                    Update Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMPORT PATIENTS MODAL (CSV WIZARD) */}
      <AnimatePresence>
        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportOpen(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-900/60 shrink-0">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="text-cyan-400" size={18} />
                  <h3 className="font-bold text-white text-md">Bulk CSV Patient EHR Importer</h3>
                </div>
                <button onClick={() => setIsImportOpen(false)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow space-y-4">
                {/* Step 1: Upload */}
                <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-cyan-500/30 transition-all relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload size={32} className="mx-auto text-cyan-400/80 mb-2" />
                  <p className="text-xs font-bold text-white">Click or drag CSV file to upload</p>
                  <p className="text-[10px] text-slate-500 mt-1">Accepts tabular records (.csv) with headers</p>
                </div>

                {csvFile && (
                  <div className="space-y-3">
                    <div className="text-xxs font-mono text-emerald-400 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Loaded file: {csvFile.name} ({csvRows.length} rows found)
                    </div>

                    {/* Step 2: Mapping Configuration */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
                      <h4 className="font-bold text-white mb-2 uppercase tracking-wider text-xxs font-mono">Map CSV Columns to EHR Schema</h4>
                      <div className="grid grid-cols-2 gap-3.5">
                        {Object.keys(columnMap).map((field) => (
                          <div key={field} className="space-y-1">
                            <label className="block text-[10px] font-mono text-slate-400 uppercase capitalize">{field} *</label>
                            <select
                              value={(columnMap as any)[field]}
                              onChange={(e) => setColumnMap({ ...columnMap, [field]: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xxs text-white"
                            >
                              <option value="">Select column...</option>
                              {csvHeaders.map((header) => (
                                <option key={header} value={header}>
                                  {header}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 3: Raw Row Preview */}
                    <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-900">
                      <h5 className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">First 3 Rows Preview</h5>
                      <div className="space-y-1.5 text-xxs font-mono text-slate-400 max-h-24 overflow-y-auto">
                        {csvRows.slice(0, 3).map((row, rIdx) => (
                          <div key={rIdx} className="p-1.5 bg-slate-900/50 rounded border border-slate-800/40">
                            {JSON.stringify(row)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-900 bg-slate-950/40 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={!csvFile}
                  className="px-4 py-2 bg-cyan-500 text-black font-semibold rounded-xl text-xs shadow-[0_0_12px_rgba(6,182,212,0.4)] disabled:opacity-50"
                >
                  Bulk Import Patients
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
