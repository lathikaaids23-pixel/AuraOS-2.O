import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClinicState, getInitialLocalState, saveLocalStateKey } from './store';
import { Patient, Appointment, Consultation, QueueItem, UserSession, Hospital, Ambulance, HospitalBedStatus, Payment, ClinicSettings } from './types';
import { isFirebaseConfigured, db, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

interface ClinicContextProps {
  state: ClinicState;
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (patient: Patient) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  bookAppointment: (appointment: Appointment) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  addConsultation: (consultation: Consultation) => Promise<void>;
  addPayment: (payment: Payment) => Promise<void>;
  addToQueue: (item: QueueItem) => Promise<void>;
  updateQueueStatus: (id: string, status: QueueItem['status']) => Promise<void>;
  clearQueue: () => Promise<void>;
  dispatchAmbulance: (id: string) => Promise<void>;
  updateBedStatus: (hospitalId: string, updates: Partial<HospitalBedStatus>) => Promise<void>;
  updateSettings: (settings: ClinicSettings) => Promise<void>;
  setCurrentUser: (user: UserSession | null) => void;
  triggerLocalBedStatusPoll: () => void;
}

const ClinicContext = createContext<ClinicContextProps | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ClinicState>(getInitialLocalState());

  // Set up Firestore Sync when Firebase is enabled
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      console.log('Firebase unconfigured or offline - Running Aura OS in Local Storage mode.');
      return;
    }

    console.log('Firebase active - Initializing live Firestore sync for Aura OS.');

    // 1. Sync Patients
    const unsubPatients = onSnapshot(collection(db, 'patients'), (snapshot) => {
      const patientsList: Patient[] = [];
      snapshot.forEach((d) => patientsList.push(d.data() as Patient));
      if (patientsList.length > 0) {
        setState((prev) => ({ ...prev, patients: patientsList }));
        saveLocalStateKey('aura_patients', patientsList);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'patients');
    });

    // 2. Sync Appointments
    const unsubAppointments = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((d) => list.push(d.data() as Appointment));
      setState((prev) => ({ ...prev, appointments: list }));
      saveLocalStateKey('aura_appointments', list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'appointments');
    });

    // 3. Sync Consultations
    const unsubConsultations = onSnapshot(collection(db, 'consultations'), (snapshot) => {
      const list: Consultation[] = [];
      snapshot.forEach((d) => list.push(d.data() as Consultation));
      setState((prev) => ({ ...prev, consultations: list }));
      saveLocalStateKey('aura_consultations', list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'consultations');
    });

    // 4. Sync Queue
    const unsubQueue = onSnapshot(collection(db, 'queue'), (snapshot) => {
      const list: QueueItem[] = [];
      snapshot.forEach((d) => list.push(d.data() as QueueItem));
      setState((prev) => ({ ...prev, queue: list }));
      saveLocalStateKey('aura_queue', list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'queue');
    });

    // 5. Sync Payments
    const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      const list: Payment[] = [];
      snapshot.forEach((d) => list.push(d.data() as Payment));
      setState((prev) => ({ ...prev, payments: list }));
      saveLocalStateKey('aura_payments', list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'payments');
    });

    // 6. Sync Ambulances
    const unsubAmbulances = onSnapshot(collection(db, 'ambulances'), (snapshot) => {
      const list: Ambulance[] = [];
      snapshot.forEach((d) => list.push(d.data() as Ambulance));
      if (list.length > 0) {
        setState((prev) => ({ ...prev, ambulances: list }));
        saveLocalStateKey('aura_ambulances', list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'ambulances');
    });

    // 7. Sync Bed Statuses
    const unsubBedStatuses = onSnapshot(collection(db, 'bedStatuses'), (snapshot) => {
      const list: HospitalBedStatus[] = [];
      snapshot.forEach((d) => list.push(d.data() as HospitalBedStatus));
      if (list.length > 0) {
        setState((prev) => ({ ...prev, bedStatuses: list }));
        saveLocalStateKey('aura_bed_statuses', list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'bedStatuses');
    });

    // 8. Sync Settings
    const unsubSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
      let loadedSettings: ClinicSettings | null = null;
      snapshot.forEach((d) => {
        if (d.id === 'clinic-config') {
          loadedSettings = d.data() as ClinicSettings;
        }
      });
      if (loadedSettings) {
        setState((prev) => ({ ...prev, settings: loadedSettings as ClinicSettings }));
        saveLocalStateKey('aura_settings', loadedSettings);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'settings');
    });

    return () => {
      unsubPatients();
      unsubAppointments();
      unsubConsultations();
      unsubQueue();
      unsubPayments();
      unsubAmbulances();
      unsubBedStatuses();
      unsubSettings();
    };
  }, []);

  // Interval polling for Bed Status and simulated ambulances in local mode
  useEffect(() => {
    if (isFirebaseConfigured) return;

    // Simulate real-time updates to bed occupancy every 30 seconds
    const bedInterval = setInterval(() => {
      triggerLocalBedStatusPoll();
    }, 30000);

    // Simulate ambulance movement progression
    const ambInterval = setInterval(() => {
      setState((prev) => {
        const updated = prev.ambulances.map((amb) => {
          if (amb.status === 'On the way') {
            // Randomly update progress or change to At emergency
            const roll = Math.random();
            if (roll > 0.7) {
              return {
                ...amb,
                status: 'At emergency' as const,
                lastUpdated: new Date().toISOString(),
              };
            }
          } else if (amb.status === 'At emergency') {
            const roll = Math.random();
            if (roll > 0.8) {
              return {
                ...amb,
                status: 'Available' as const,
                lastUpdated: new Date().toISOString(),
              };
            }
          }
          return amb;
        });
        saveLocalStateKey('aura_ambulances', updated);
        return { ...prev, ambulances: updated };
      });
    }, 15000);

    return () => {
      clearInterval(bedInterval);
      clearInterval(ambInterval);
    };
  }, []);

  const triggerLocalBedStatusPoll = () => {
    setState((prev) => {
      const updated = prev.bedStatuses.map((b) => {
        // Randomly perturb free beds slightly to simulate live tracking
        const randChangeGen = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
        const randChangeIcu = Math.floor(Math.random() * 2) - 1; // -1, 0, +1
        const nextGen = Math.max(0, b.bedsGeneralFree + randChangeGen);
        const nextIcu = Math.max(0, b.bedsICUFree + randChangeIcu);
        return {
          ...b,
          bedsGeneralFree: nextGen,
          bedsICUFree: nextIcu,
          patientsAdmitted: b.patientsAdmitted - randChangeGen,
          lastUpdated: new Date().toISOString(),
        };
      });
      saveLocalStateKey('aura_bed_statuses', updated);
      return { ...prev, bedStatuses: updated };
    });
  };

  // Helper to safely write to Firestore & local storage
  const executeMutation = async <T extends { id?: string; hospitalId?: string; }>(
    collectionName: string,
    docId: string,
    data: T,
    localUpdater: (prev: ClinicState) => ClinicState,
    localStateKey: string
  ) => {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, collectionName, docId), data);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
      }
    } else {
      setState((prev) => {
        const nextState = localUpdater(prev);
        // Extract the sub-field for local storage
        const subData = (nextState as any)[localStateKey];
        saveLocalStateKey(`aura_${localStateKey}`, subData);
        return nextState;
      });
    }
  };

  // --- Patients Actions ---
  const addPatient = async (patient: Patient) => {
    await executeMutation(
      'patients',
      patient.id,
      patient,
      (prev) => ({ ...prev, patients: [patient, ...prev.patients] }),
      'patients'
    );
    toast.success('Patient registered successfully');
  };

  const updatePatient = async (patient: Patient) => {
    await executeMutation(
      'patients',
      patient.id,
      patient,
      (prev) => ({
        ...prev,
        patients: prev.patients.map((p) => (p.id === patient.id ? patient : p)),
      }),
      'patients'
    );
    toast.success('Patient record updated');
  };

  const deletePatient = async (id: string) => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'patients', id));
        toast.success('Patient record deleted');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `patients/${id}`);
      }
    } else {
      setState((prev) => {
        const updated = prev.patients.filter((p) => p.id !== id);
        saveLocalStateKey('aura_patients', updated);
        return { ...prev, patients: updated };
      });
      toast.success('Patient record deleted');
    }
  };

  // --- Appointments Actions ---
  const bookAppointment = async (appointment: Appointment) => {
    await executeMutation(
      'appointments',
      appointment.id,
      appointment,
      (prev) => ({ ...prev, appointments: [...prev.appointments, appointment] }),
      'appointments'
    );
    toast.success('Appointment booked successfully');
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    const appointment = state.appointments.find((a) => a.id === id);
    if (!appointment) return;
    const updated = { ...appointment, status };

    await executeMutation(
      'appointments',
      id,
      updated,
      (prev) => ({
        ...prev,
        appointments: prev.appointments.map((a) => (a.id === id ? updated : a)),
      }),
      'appointments'
    );
    toast.success(`Appointment status updated to ${status}`);
  };

  // --- Consultation Actions ---
  const addConsultation = async (consultation: Consultation) => {
    await executeMutation(
      'consultations',
      consultation.id,
      consultation,
      (prev) => ({ ...prev, consultations: [consultation, ...prev.consultations] }),
      'consultations'
    );
    toast.success('Consultation summary saved');
  };

  // --- Payment Actions ---
  const addPayment = async (payment: Payment) => {
    await executeMutation(
      'payments',
      payment.id,
      payment,
      (prev) => ({ ...prev, payments: [payment, ...prev.payments] }),
      'payments'
    );
    toast.success(`Payment of ₹${payment.amount} processed`);
  };

  // --- Queue Actions ---
  const addToQueue = async (item: QueueItem) => {
    await executeMutation(
      'queue',
      item.id,
      item,
      (prev) => ({ ...prev, queue: [...prev.queue, item] }),
      'queue'
    );
    toast.success(`Token #${item.tokenNumber} generated for ${item.patientName}`);
  };

  const updateQueueStatus = async (id: string, status: QueueItem['status']) => {
    const item = state.queue.find((q) => q.id === id);
    if (!item) return;
    const updated = { ...item, status };

    await executeMutation(
      'queue',
      id,
      updated,
      (prev) => ({
        ...prev,
        queue: prev.queue.map((q) => (q.id === id ? updated : q)),
      }),
      'queue'
    );
  };

  const clearQueue = async () => {
    if (isFirebaseConfigured && db) {
      try {
        // Clear all documents in queue
        // For simple local/development setup, we just write empty queue arrays or delete each.
        state.queue.forEach(async (q) => {
          await deleteDoc(doc(db, 'queue', q.id));
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'queue');
      }
    } else {
      setState((prev) => {
        saveLocalStateKey('aura_queue', []);
        return { ...prev, queue: [] };
      });
      toast.success('Waiting queue cleared');
    }
  };

  // --- Ambulance Actions ---
  const dispatchAmbulance = async (id: string) => {
    const amb = state.ambulances.find((a) => a.id === id);
    if (!amb || amb.status !== 'Available') return;
    const updated = { ...amb, status: 'On the way' as const, lastUpdated: new Date().toISOString() };

    await executeMutation(
      'ambulances',
      id,
      updated,
      (prev) => ({
        ...prev,
        ambulances: prev.ambulances.map((a) => (a.id === id ? updated : a)),
      }),
      'ambulances'
    );
    toast.success(`Ambulance ${amb.vehicleNumber} dispatched!`);
  };

  // --- Bed Status Actions ---
  const updateBedStatus = async (hospitalId: string, updates: Partial<HospitalBedStatus>) => {
    const item = state.bedStatuses.find((b) => b.hospitalId === hospitalId);
    if (!item) return;
    const updated = { ...item, ...updates, lastUpdated: new Date().toISOString() };

    await executeMutation(
      'bedStatuses',
      hospitalId,
      updated,
      (prev) => ({
        ...prev,
        bedStatuses: prev.bedStatuses.map((b) => (b.hospitalId === hospitalId ? updated : b)),
      }),
      'bed_statuses'
    );
  };

  // --- Settings Actions ---
  const updateSettings = async (settings: ClinicSettings) => {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'settings', 'clinic-config'), settings);
        toast.success('Clinic configurations saved to cloud');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'settings/clinic-config');
      }
    } else {
      setState((prev) => {
        saveLocalStateKey('aura_settings', settings);
        return { ...prev, settings };
      });
      toast.success('Clinic configurations saved');
    }
  };

  const setCurrentUser = (user: UserSession | null) => {
    setState((prev) => {
      saveLocalStateKey('aura_user_session', user);
      return { ...prev, currentUser: user };
    });
  };

  return (
    <ClinicContext.Provider
      value={{
        state,
        addPatient,
        updatePatient,
        deletePatient,
        bookAppointment,
        updateAppointmentStatus,
        addConsultation,
        addPayment,
        addToQueue,
        updateQueueStatus,
        clearQueue,
        dispatchAmbulance,
        updateBedStatus,
        updateSettings,
        setCurrentUser,
        triggerLocalBedStatusPoll,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
