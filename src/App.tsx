import React, { useState } from 'react';
import { ClinicProvider, useClinic } from './ClinicContext';
import { LanguageProvider } from './LanguageContext';
import { AppShell } from './components/AppShell';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { PatientsView } from './components/PatientsView';
import { QueueView } from './components/QueueView';
import { AppointmentsView } from './components/AppointmentsView';
import { ConsultationView } from './components/ConsultationView';
import { ReportsView } from './components/ReportsView';
import { HospitalFinderView } from './components/HospitalFinderView';
import { EmergencyView } from './components/EmergencyView';
import { SettingsView } from './components/SettingsView';
import { AIHelperWidget } from './components/AIHelperWidget';
import { Toaster } from 'sonner';

const AppContent: React.FC = () => {
  const { state } = useClinic();
  const [activePage, setActivePage] = useState('dashboard');

  if (!state.currentUser) {
    return <LoginView />;
  }

  return (
    <AppShell activePage={activePage} setActivePage={setActivePage}>
      {activePage === 'dashboard' && <DashboardView setActivePage={setActivePage} />}
      {activePage === 'patients' && <PatientsView />}
      {activePage === 'queue' && <QueueView />}
      {activePage === 'appointments' && <AppointmentsView />}
      {activePage === 'consultation' && <ConsultationView />}
      {activePage === 'reports' && <ReportsView />}
      {activePage === 'hospital-finder' && <HospitalFinderView />}
      {activePage === 'emergency' && <EmergencyView />}
      {activePage === 'settings' && <SettingsView />}
      <AIHelperWidget />
    </AppShell>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ClinicProvider>
        <AppContent />
        <Toaster theme="dark" position="top-right" richColors closeButton />
      </ClinicProvider>
    </LanguageProvider>
  );
}
