export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string; // Indian format: 10 digits, optional +91
  city: string;
  condition: string;
  outcome?: string; // e.g. Recovered, In Treatment, Referred, etc.
  email?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  availability: string[]; // e.g. ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  timeSlots: string[];    // e.g. ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"]
  email: string;
  phone: string;
  isAvailable: boolean;
  avatar?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 AM"
  status: 'scheduled' | 'completed' | 'cancelled';
  reason?: string;
  createdAt: string;
}

export interface Drug {
  name: string;
  dosage: string;      // e.g., "500mg"
  frequency: string;   // e.g., "1-0-1" or "Once daily"
  duration: string;    // e.g., "5 days"
}

export interface Consultation {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  prescription: Drug[];
  interactionWarnings?: string; // AI generated warnings text
  pdfUrl?: string;
  createdAt: string;
}

export interface QueueItem {
  id: string;
  patientId: string;
  patientName: string;
  tokenNumber: number;
  doctorId: string;
  doctorName: string;
  status: 'Waiting' | 'In Progress' | 'Completed' | 'Skipped';
  checkInTime: string;
  estimatedWaitMinutes: number;
}

export interface UserSession {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'guest';
}

export interface Hospital {
  id: string;
  name: string;
  type: 'Government' | 'Private' | 'Trust' | 'Corporate';
  city: string;
  address: string;
  distanceKm: number;
  costCategory: 'Free' | 'Low' | 'Mid' | 'Premium';
  consultationFee: number;
  specialties: string[];
  bedsGeneral: number;
  bedsICU: number;
  bedsEmergency: number;
  rating: number;
  insuranceAccepted: string[];
  phone: string;
  isOpen24x7: boolean;
}

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  type: 'ALS' | 'BLS';
  area: string;
  distanceKm: number;
  status: 'Available' | 'On the way' | 'At emergency';
  driverName: string;
  driverPhone: string;
  lastUpdated: string;
}

export interface HospitalBedStatus {
  hospitalId: string;
  hospitalName: string;
  distanceKm: number;
  bedsGeneralFree: number;
  bedsICUFree: number;
  bedsEmergencyFree: number;
  patientsAdmitted: number;
  patientsWaitingOPD: number;
  patientsInTreatment: number;
  lastUpdated: string;
}

export interface Payment {
  id: string;
  patientId: string;
  patientName: string;
  amount: number;
  method: 'UPI' | 'GPay' | 'PhonePe' | 'Cash';
  upiRef?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface ClinicSettings {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicVpa: string; // UPI ID (e.g. aura@okicici)
  googleMapsApiKey?: string;
}
