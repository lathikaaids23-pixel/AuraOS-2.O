import { Patient, Doctor, Appointment, Consultation, QueueItem, UserSession, Hospital, Ambulance, HospitalBedStatus, Payment, ClinicSettings } from './types';
import { MOCK_PATIENTS } from './data/mockPatients';
import { DOCTORS } from './data/doctors';
import { FALLBACK_HOSPITALS } from './data/hospitals';
import { SEEDED_AMBULANCES, SEEDED_BED_STATUSES } from './data/ambulances';

export interface ClinicState {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  consultations: Consultation[];
  queue: QueueItem[];
  payments: Payment[];
  ambulances: Ambulance[];
  bedStatuses: HospitalBedStatus[];
  hospitals: Hospital[];
  settings: ClinicSettings;
  currentUser: UserSession | null;
  isLoading: boolean;
}

const DEFAULT_SETTINGS: ClinicSettings = {
  clinicName: 'Aura Digital Clinic',
  clinicAddress: '12, Cathedral Road, Gopalapuram, Chennai, Tamil Nadu - 600086',
  clinicPhone: '+91 87380 30604',
  clinicVpa: 'aura.clinic@okaxis',
  googleMapsApiKey: '',
};

export function getInitialLocalState(): ClinicState {
  // Load from localStorage or seed
  const patients = loadOrSeed('aura_patients', MOCK_PATIENTS);
  const appointments = loadOrSeed('aura_appointments', []);
  const consultations = loadOrSeed('aura_consultations', []);
  const queue = loadOrSeed('aura_queue', []);
  const payments = loadOrSeed('aura_payments', []);
  const ambulances = loadOrSeed('aura_ambulances', SEEDED_AMBULANCES);
  const bedStatuses = loadOrSeed('aura_bed_statuses', SEEDED_BED_STATUSES);
  const hospitals = loadOrSeed('aura_hospitals', FALLBACK_HOSPITALS);
  const settings = loadOrSeed('aura_settings', DEFAULT_SETTINGS);
  const currentUser = loadOrSeed<UserSession | null>('aura_user_session', null);

  return {
    patients,
    doctors: DOCTORS,
    appointments,
    consultations,
    queue,
    payments,
    ambulances,
    bedStatuses,
    hospitals,
    settings,
    currentUser,
    isLoading: false,
  };
}

function loadOrSeed<T>(key: string, seed: T): T {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
  }
  // Store the seed initially
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

export function saveLocalStateKey(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
}
