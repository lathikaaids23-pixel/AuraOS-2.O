import React, { useMemo } from 'react';
import { useClinic } from '../ClinicContext';
import { useTranslation } from '../LanguageContext';
import { Payment } from '../types';
import { AIAvatar } from './AIAvatar';
import { toast } from 'sonner';
import { generateReceiptPDF } from '../utils/pdfGenerator';
import {
  FileBarChart2,
  TrendingUp,
  Download,
  DollarSign,
  QrCode,
  CreditCard,
  CheckCircle,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

export const ReportsView: React.FC = () => {
  const { state } = useClinic();
  const { t } = useTranslation();

  const payments = state.payments;

  // Revenue Aggregates
  const stats = useMemo(() => {
    let upiCount = 0;
    let upiSum = 0;
    let cashCount = 0;
    let cashSum = 0;

    payments.forEach((p) => {
      if (p.method === 'UPI' || p.method === 'GPay' || p.method === 'PhonePe') {
        upiCount++;
        upiSum += p.amount;
      } else {
        cashCount++;
        cashSum += p.amount;
      }
    });

    return {
      total: upiSum + cashSum,
      upiCount,
      upiSum,
      cashCount,
      cashSum,
    };
  }, [payments]);

  const handleDownloadLedgerCsv = () => {
    if (payments.length === 0) {
      toast.error('No transactions available to export');
      return;
    }

    const headers = 'ID,Patient Name,Amount,Method,UPI Reference,Status,Created At\n';
    const rows = payments
      .map(
        (p) =>
          `"${p.id}","${p.patientName}",${p.amount},"${p.method}","${p.upiRef || ''}","${p.status}","${p.createdAt}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AuraClinic_BillingLedger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Billing Ledger CSV exported!');
  };

  const triggerReceiptPDF = (p: Payment) => {
    const patient = state.patients.find((pat) => pat.id === p.patientId);
    // Find doctor from appointments if we can, or fallback to the primary doctor
    const apt = state.appointments.find((a) => a.patientId === p.patientId);
    const doctor = apt ? state.doctors.find((d) => d.id === apt.doctorId) : state.doctors[0];

    if (patient && doctor) {
      generateReceiptPDF(p, patient, doctor, state.settings);
      toast.success(`Receipt downloaded for ${patient.name}`);
    } else {
      // Create a fallback mock patient/doctor to satisfy the PDF generator
      const mockPatient = patient || {
        id: p.patientId,
        name: p.patientName,
        phone: '+91 98765 43210',
        city: 'Chennai',
        age: 30,
        gender: 'Male' as const,
        condition: 'General Checkup',
        createdAt: p.createdAt,
      };
      const mockDoctor = doctor || state.doctors[0];
      generateReceiptPDF(p, mockPatient, mockDoctor, state.settings);
      toast.success(`Receipt downloaded for ${p.patientName}`);
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
              {t('reports')} <span className="text-xs bg-cyan-500/10 text-cyan-400 font-mono px-2 py-0.5 rounded border border-cyan-500/20">REVENUE LEDGERS</span>
            </h2>
            <p className="text-xs text-slate-400">Audit patient cash transactions, verify digital UPI settlement buckets, and download billing logs</p>
          </div>
        </div>

        <button
          onClick={handleDownloadLedgerCsv}
          disabled={payments.length === 0}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-105 disabled:opacity-40"
        >
          <FileText size={14} />
          Export Ledger (CSV)
        </button>
      </div>

      {/* Aggregate split cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl relative overflow-hidden">
          <div className="text-xxs font-mono text-slate-500 uppercase tracking-widest">Total Clinical Revenue</div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">₹{stats.total}.00</div>
          <p className="text-[10px] text-slate-500 mt-2">Combined counter and gateway receipts</p>
        </div>

        <div className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl relative overflow-hidden">
          <div className="text-xxs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <QrCode size={12} className="text-cyan-400" />
            UPI Gateway Receipts
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">₹{stats.upiSum}.00</div>
          <p className="text-[10px] text-cyan-400/80 font-mono mt-2">{stats.upiCount} settled transactions</p>
        </div>

        <div className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl relative overflow-hidden">
          <div className="text-xxs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <CreditCard size={12} className="text-blue-400" />
            Cash Drawer Registry
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">₹{stats.cashSum}.00</div>
          <p className="text-[10px] text-blue-400/80 font-mono mt-2">{stats.cashCount} manual cash audits</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900/20 border border-blue-500/5 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Completed Settlements Ledger</h4>
          <span className="text-[10px] font-mono text-slate-500">{payments.length} ledger logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-xxs font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Settlement Method</th>
                <th className="py-3 px-4">UPI Ref Code</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs text-slate-300">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                    No completed payments in the billing system today.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/30 transition">
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">{p.id.toUpperCase()}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{p.patientName}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-400">{p.method}</td>
                    <td className="py-3.5 px-4 font-mono text-cyan-400 text-[10px]">{p.upiRef || 'N/A (Cash)'}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">₹{p.amount}.00</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xxs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} />
                        Settle
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => triggerReceiptPDF(p)}
                        className="p-1.5 hover:bg-slate-800 rounded text-cyan-400 transition"
                        title="Download Receipt (PDF)"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
