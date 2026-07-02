import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  Smartphone,
  Info,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  patientName: string;
  doctorName: string;
  appointmentId: string;
  onPaymentSuccess: (transactionId: string, method: 'UPI' | 'GPay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'Cash', dateTime: string) => void;
  vpa?: string;
  clinicName?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  patientName,
  doctorName,
  appointmentId,
  onPaymentSuccess,
  vpa = 'aura.clinic@okaxis',
  clinicName = 'Aura Digital Clinic'
}) => {
  const [selectedApp, setSelectedApp] = useState<'GPay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'Any'>('Any');
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDateTime, setPaymentDateTime] = useState('');

  // Generate a random high-fidelity transaction reference
  const generatedTxnRef = useMemo(() => {
    const randomNum = Math.floor(100000000000 + Math.random() * 900000000000);
    return `TXN${randomNum}`;
  }, [appointmentId, isOpen]);

  // UPI intent link generation
  const upiUrl = useMemo(() => {
    const encodedName = encodeURIComponent(clinicName);
    const appPrefix = {
      GPay: 'gpay://upi/pay',
      PhonePe: 'phonepe://pay',
      Paytm: 'paytmmp://cash_wallet',
      BHIM: 'bhim://pay',
      Any: 'upi://pay'
    }[selectedApp] || 'upi://pay';

    return `${appPrefix}?pa=${vpa}&pn=${encodedName}&am=${amount}&cu=INR&tr=${appointmentId}&tn=AuraOSConsultation`;
  }, [selectedApp, vpa, clinicName, amount, appointmentId]);

  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('idle');
      setIsVerifying(false);
      setTransactionId('');
      setPaymentDateTime('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = () => {
    setIsVerifying(true);
    setPaymentStatus('verifying');

    setTimeout(() => {
      setIsVerifying(false);
      setPaymentStatus('success');
      const now = new Date().toISOString();
      const currentTxnId = generatedTxnRef;
      setTransactionId(currentTxnId);
      setPaymentDateTime(now);
      toast.success('UPI Payment Authenticated & Settled!');
    }, 1800);
  };

  const handleConfirmSuccess = () => {
    const methodMap: Record<string, 'GPay' | 'PhonePe' | 'Paytm' | 'BHIM' | 'UPI'> = {
      GPay: 'GPay',
      PhonePe: 'PhonePe',
      Paytm: 'Paytm',
      BHIM: 'BHIM',
      Any: 'UPI'
    };
    onPaymentSuccess(transactionId, methodMap[selectedApp] || 'UPI', paymentDateTime);
  };

  const appButtons = [
    { id: 'Any', name: 'UPI QR', color: 'border-slate-800 text-cyan-400 bg-slate-950/80 hover:border-cyan-500/40' },
    { id: 'GPay', name: 'Google Pay', color: 'border-blue-900/30 text-blue-400 bg-blue-950/20 hover:border-blue-500/40' },
    { id: 'PhonePe', name: 'PhonePe', color: 'border-purple-900/30 text-purple-400 bg-purple-950/20 hover:border-purple-500/40' },
    { id: 'Paytm', name: 'Paytm', color: 'border-sky-900/30 text-sky-400 bg-sky-950/20 hover:border-sky-500/40' },
    { id: 'BHIM', name: 'BHIM UPI', color: 'border-orange-900/30 text-orange-400 bg-orange-950/20 hover:border-orange-500/40' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-[#0b0f19] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] text-slate-200 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden my-auto"
      >
        {/* Neon Accent Header Strip */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 shrink-0 z-10"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 sm:p-6 pb-3 border-b border-slate-900 shrink-0 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">AuraOS UPI Gateway</h3>
              <p className="text-[10px] text-slate-400">Secure Instant Settlement Interface</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {paymentStatus !== 'success' ? (
            <div className="space-y-4">
              {/* Consultation/Appointment Summary */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Patient:</span>
                  <span className="text-white font-medium">{patientName}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Practitioner:</span>
                  <span className="text-white font-medium">{doctorName}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Appointment Ref:</span>
                  <span className="text-slate-300 font-mono text-[10px]">{appointmentId}</span>
                </div>
                <div className="border-t border-slate-900 pt-2 flex justify-between items-center">
                  <span className="text-xs font-semibold text-cyan-400">Amount Payable:</span>
                  <span className="text-lg font-black text-white font-mono font-black">₹{amount}.00</span>
                </div>
              </div>

              {/* Simulated App Selectors */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Select UPI Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {appButtons.map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setSelectedApp(btn.id)}
                      className={`py-2 px-2.5 rounded-xl text-xxs font-bold border transition-all text-center flex items-center justify-center ${
                        selectedApp === btn.id
                          ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                          : btn.color
                      }`}
                    >
                      {btn.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Dynamic UPI QR Code */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 border border-slate-900 rounded-2xl">
                <div className="p-3.5 bg-white rounded-2xl shadow-xl flex items-center justify-center relative group">
                  <QRCodeSVG
                    value={upiUrl}
                    size={140}
                    level="H"
                    includeMargin={true}
                  />
                  {isVerifying && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-cyan-400">
                      <Loader2 size={32} className="animate-spin mb-2" />
                      <span className="text-[10px] font-mono tracking-widest uppercase">Verifying...</span>
                    </div>
                  )}
                </div>

                {/* UPI and Scanning Guidelines */}
                <div className="text-center mt-3 w-full">
                  <p className="text-[10px] font-mono text-cyan-400 bg-cyan-500/5 py-1 px-3.5 rounded-lg border border-cyan-500/10 inline-block">
                    VPA: <span className="text-white font-bold">{vpa}</span>
                  </p>
                  <div className="flex items-center justify-center gap-1.5 text-xxs text-slate-400 mt-2">
                    <Smartphone size={12} className="text-cyan-400" />
                    <span>Scan using GPay, PhonePe, Paytm, or BHIM UPI</span>
                  </div>
                </div>
              </div>

              {/* Information Warning */}
              <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex items-start gap-2 text-xxs text-slate-400">
                <Info size={14} className="text-cyan-500 shrink-0 mt-0.5" />
                <span>
                  To test the billing and registration workflow in this sandbox, click <strong>Mark as Paid</strong> to simulate a successful real-time webhook confirmation.
                </span>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 pt-2 border-t border-slate-900 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      Mark as Paid
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Payment Success Confirmation View */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-white">✅ Payment Successful</h4>
                <p className="text-xs text-slate-400 font-medium">Transaction cleared by BHIM-UPI Router</p>
              </div>

              <div className="bg-slate-950/90 border border-slate-900 p-4 rounded-xl text-left space-y-2.5 max-w-sm mx-auto font-mono text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Transaction Ref:</span>
                  <span className="text-white font-bold text-xxs">{transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Settled:</span>
                  <span className="text-emerald-400 font-bold">₹{amount}.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span className="text-white text-xxs">{new Date(paymentDateTime).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Source:</span>
                  <span className="text-white">{selectedApp === 'Any' ? 'UPI QR App' : selectedApp}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900">
                <button
                  type="button"
                  onClick={handleConfirmSuccess}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                  Generate Final Invoice
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
