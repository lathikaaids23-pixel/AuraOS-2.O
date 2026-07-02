import { Doctor } from '../types';

export const DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Rahul Sharma',
    specialty: 'General Physician & Cardiology',
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    timeSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'],
    email: 'rahul.sharma@auraclinic.in',
    phone: '9876543210',
    isAvailable: true,
  },
  {
    id: 'doc-2',
    name: 'Dr. Priya Nair',
    specialty: 'Pediatrics & Neonatology',
    availability: ['Monday', 'Wednesday', 'Friday'],
    timeSlots: ['09:30 AM', '10:30 AM', '11:30 AM', '03:00 PM', '04:00 PM', '05:00 PM'],
    email: 'priya.nair@auraclinic.in',
    phone: '9876543211',
    isAvailable: true,
  },
  {
    id: 'doc-3',
    name: 'Dr. Amit Patel',
    specialty: 'Dermatology & Venereology',
    availability: ['Tuesday', 'Thursday', 'Saturday'],
    timeSlots: ['10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'],
    email: 'amit.patel@auraclinic.in',
    phone: '9876543212',
    isAvailable: true,
  },
  {
    id: 'doc-4',
    name: 'Dr. Ananya Reddy',
    specialty: 'Gynecology & Obstetrics',
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM'],
    email: 'ananya.reddy@auraclinic.in',
    phone: '9876543213',
    isAvailable: true,
  }
];
