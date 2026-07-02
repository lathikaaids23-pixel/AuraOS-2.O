import React, { useMemo } from 'react';
import { useClinic } from '../ClinicContext';
import { useTranslation } from '../LanguageContext';
import { AIAvatar } from './AIAvatar';
import {
  Users,
  CalendarDays,
  TrendingUp,
  Activity,
  UserPlus,
  Flame,
  PlusSquare,
  BadgeAlert,
  ArrowUpRight,
  ClipboardList
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

export const DashboardView: React.FC<{ setActivePage: (page: string) => void }> = ({ setActivePage }) => {
  const { state } = useClinic();
  const { t } = useTranslation();

  // 1. Calculate Summary Metrics
  const totalPatientsCount = state.patients.length;
  const todaysAppointmentsCount = useMemo(() => {
    return state.appointments.filter((a) => a.status === 'scheduled').length;
  }, [state.appointments]);

  const liveQueueCount = useMemo(() => {
    return state.queue.filter((q) => q.status === 'Waiting').length;
  }, [state.queue]);

  const totalRevenue = useMemo(() => {
    return state.payments.reduce((sum, p) => sum + p.amount, 0);
  }, [state.payments]);

  // 2. Prepare Condition Demographics Chart Data
  const conditionChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    state.patients.forEach((p) => {
      // Clean and normalize conditions slightly for grouping
      let cond = p.condition.split(',')[0].trim();
      cond = cond.charAt(0).toUpperCase() + cond.slice(1).toLowerCase();
      // Keep it inside top 5 or group into Others
      counts[cond] = (counts[cond] || 0) + 1;
    });

    const list = Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key],
    }));

    // Sort and take top 4, grouping the rest into 'Other'
    list.sort((a, b) => b.value - a.value);
    if (list.length > 4) {
      const top = list.slice(0, 4);
      const otherVal = list.slice(4).reduce((sum, item) => sum + item.value, 0);
      top.push({ name: 'Others', value: otherVal });
      return top;
    }
    return list.length > 0 ? list : [{ name: 'Healthy', value: 1 }];
  }, [state.patients]);

  // 3. Prepare Transactional Payment Method Data
  const paymentChartData = useMemo(() => {
    let upiTotal = 0;
    let cashTotal = 0;

    state.payments.forEach((p) => {
      if (p.method === 'UPI' || p.method === 'GPay' || p.method === 'PhonePe') {
        upiTotal += p.amount;
      } else {
        cashTotal += p.amount;
      }
    });

    return [
      { name: 'UPI Gateway', Amount: upiTotal },
      { name: 'Cash Register', Amount: cashTotal },
    ];
  }, [state.payments]);

  // Recharts styling palettes
  const PIE_COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Top Welcome greeting panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <AIAvatar size="md" variant="idle" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {t('welcomeGreeting')}, {state.currentUser?.displayName || 'Clinician'}!
            </h2>
            <p className="text-xs text-slate-400">Aura OS 2.0 clinical diagnostic workspace active · Chennai District Node</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xxs font-mono bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-slate-400">
          <Activity size={12} className="text-emerald-400 animate-pulse" />
          <span>Local Storage Persistence Buffer Synced</span>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/30 border border-blue-500/10 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-cyan-500/5 rounded-full filter blur-xl"></div>
          <Users className="text-cyan-400 mb-2" size={20} />
          <div className="text-2xl font-black text-white font-mono">{totalPatientsCount}</div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mt-1">{t('totalPatients')}</div>
        </div>

        <div className="bg-slate-950/30 border border-blue-500/10 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-blue-500/5 rounded-full filter blur-xl"></div>
          <CalendarDays className="text-blue-400 mb-2" size={20} />
          <div className="text-2xl font-black text-white font-mono">{todaysAppointmentsCount}</div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mt-1">Scheduled Slots</div>
        </div>

        <div className="bg-slate-950/30 border border-blue-500/10 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-emerald-500/5 rounded-full filter blur-xl"></div>
          <Flame className="text-emerald-400 mb-2" size={20} />
          <div className="text-2xl font-black text-white font-mono">{liveQueueCount}</div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mt-1">Patients in Queue</div>
        </div>

        <div className="bg-slate-950/30 border border-blue-500/10 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-amber-500/5 rounded-full filter blur-xl"></div>
          <TrendingUp className="text-amber-400 mb-2" size={20} />
          <div className="text-2xl font-black text-emerald-400 font-mono">₹{totalRevenue}</div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mt-1">Total Collections</div>
        </div>
      </div>

      {/* Interactive Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conditions Pie Chart */}
        <div className="bg-slate-950/20 border border-slate-900 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ClipboardList size={14} className="text-cyan-400" />
            EHR Condition Demographics
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conditionChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {conditionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d1a', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', fontSize: '11px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Collections Bar Chart */}
        <div className="bg-slate-950/20 border border-slate-900 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
            <TrendingUp size={14} className="text-blue-400" />
            Gateway Settlement Volumes
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d1a', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', fontSize: '11px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="Amount" fill="#06b6d4" radius={[8, 8, 0, 0]}>
                  {paymentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#06b6d4' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions Shortcuts Panel */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Quick operations shortcuts</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setActivePage('patients')}
            className="p-4 bg-slate-900/40 border border-slate-800 hover:border-cyan-500/20 rounded-xl text-left transition group"
          >
            <UserPlus size={20} className="text-cyan-400 mb-2" />
            <div className="text-xs font-bold text-white flex items-center gap-1">
              Add Patient
              <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">EHR Register & Import</p>
          </button>

          <button
            onClick={() => setActivePage('queue')}
            className="p-4 bg-slate-900/40 border border-slate-800 hover:border-cyan-500/20 rounded-xl text-left transition group"
          >
            <PlusSquare size={20} className="text-blue-400 mb-2" />
            <div className="text-xs font-bold text-white flex items-center gap-1">
              Queue Tokens
              <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Live Sequential Tokenizer</p>
          </button>

          <button
            onClick={() => setActivePage('hospital-finder')}
            className="p-4 bg-slate-900/40 border border-slate-800 hover:border-cyan-500/20 rounded-xl text-left transition group"
          >
            <Users size={20} className="text-emerald-400 mb-2" />
            <div className="text-xs font-bold text-white flex items-center gap-1">
              Beds & Tariffs
              <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Hospital Finder</p>
          </button>

          <button
            onClick={() => setActivePage('emergency')}
            className="p-4 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 rounded-xl text-left transition group"
          >
            <BadgeAlert size={20} className="text-red-500 mb-2 animate-pulse" />
            <div className="text-xs font-bold text-white flex items-center gap-1">
              Dispatches SOS
              <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Ambulances Telemetry</p>
          </button>
        </div>
      </div>
    </div>
  );
};
