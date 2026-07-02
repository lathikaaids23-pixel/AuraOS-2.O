import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, Doctor, Consultation, Payment, ClinicSettings } from '../types';

// Palette styling
const PRIMARY_COLOR: [number, number, number] = [10, 14, 26]; // deep navy #0a0e1a
const ACCENT_COLOR: [number, number, number] = [6, 182, 212]; // cyan-blue #06b6d4
const TEXT_MUTED = [100, 116, 139]; // slate-500

function addBrandedHeader(doc: jsPDF, title: string, clinicInfo: any) {
  const pageWith = doc.internal.pageSize.getWidth();

  // Draw deep background bar for Header
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWith, 35, 'F');

  // Draw glowing accent strip below header
  doc.setFillColor(ACCENT_COLOR[0], ACCENT_COLOR[1], ACCENT_COLOR[2]);
  doc.rect(0, 35, pageWith, 2, 'F');

  // Clinic Brand Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(clinicInfo.clinicName || 'Aura Digital Clinic', 15, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(clinicInfo.clinicAddress || 'Chennai, India', 15, 25);
  doc.text(`Phone: ${clinicInfo.clinicPhone || '+91 87380 30604'}`, 15, 29);

  // Document Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), pageWith - 15, 20, { align: 'right' });

  // Reset colors
  doc.setTextColor(0, 0, 0);
}

function addBrandedFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWith = doc.internal.pageSize.getWidth();

  // Glowing footer line
  doc.setFillColor(ACCENT_COLOR[0], ACCENT_COLOR[1], ACCENT_COLOR[2]);
  doc.rect(0, pageHeight - 15, pageWith, 1, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text(
    'This is a computer-generated document. No physical signature is required.',
    15,
    pageHeight - 9
  );
  doc.text(
    `Generated on: ${new Date().toLocaleString()}`,
    pageWith - 15,
    pageHeight - 9,
    { align: 'right' }
  );
}

export function generatePrescriptionPDF(
  consultation: Consultation,
  patient: Patient,
  doctor: Doctor,
  clinicInfo: ClinicSettings
) {
  const doc = new jsPDF();
  addBrandedHeader(doc, 'Medical Prescription', clinicInfo);

  // Metadata block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PATIENT DETAILS', 15, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${patient.name} (${patient.gender}, ${patient.age} Yrs)`, 15, 54);
  doc.text(`Phone: ${patient.phone}`, 15, 59);
  doc.text(`City: ${patient.city}`, 15, 64);

  doc.setFont('helvetica', 'bold');
  doc.text('DOCTOR / CLINIC DETAILS', 120, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Practitioner: ${doctor.name}`, 120, 54);
  doc.text(`Specialty: ${doctor.specialty}`, 120, 59);
  doc.text(`Consultation Ref: ${consultation.id.slice(0, 8).toUpperCase()}`, 120, 64);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 70, 195, 70);

  // Diagnosis Details
  doc.setFont('helvetica', 'bold');
  doc.text('DIAGNOSIS:', 15, 78);
  doc.setFont('helvetica', 'normal');
  doc.text(consultation.diagnosis || 'General Checkup', 45, 78);

  doc.setFont('helvetica', 'bold');
  doc.text('SYMPTOMS:', 15, 84);
  doc.setFont('helvetica', 'normal');
  doc.text(consultation.symptoms || 'None recorded', 45, 84);

  // Prescribed Drugs Table
  doc.setFont('helvetica', 'bold');
  doc.text('PRESCRIBED MEDICATIONS', 15, 96);

  const drugRows = consultation.prescription.map((drug, index) => [
    index + 1,
    drug.name,
    drug.dosage,
    drug.frequency,
    drug.duration,
  ]);

  autoTable(doc, {
    startY: 100,
    head: [['#', 'Medicine Name', 'Dosage', 'Frequency', 'Duration']],
    body: drugRows,
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 15, right: 15 },
  });

  // Doctor Notes
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFont('helvetica', 'bold');
  doc.text('DOCTOR INSTRUCTIONS / CLINICAL NOTES:', 15, finalY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(consultation.notes || 'Take prescribed medicines regularly. Drink plenty of water.', 15, finalY + 6, {
    maxWidth: 180,
  });

  addBrandedFooter(doc);
  doc.save(`Prescription_${patient.name.replace(/\s+/g, '_')}_${consultation.id.slice(0, 5)}.pdf`);
}

export function generateConsultationSummaryPDF(
  consultation: Consultation,
  patient: Patient,
  doctor: Doctor
) {
  const doc = new jsPDF();
  const fakeClinic = {
    clinicName: 'Aura Clinical OS 2.0',
    clinicAddress: 'AI Diagnostic Copilot Ecosystem',
    clinicPhone: '+91 87380 30604',
  };
  addBrandedHeader(doc, 'Clinical Summary', fakeClinic);

  // Metadata block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PATIENT PROFILE', 15, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${patient.name} (${patient.gender}, ${patient.age} Yrs)`, 15, 54);
  doc.text(`Phone: ${patient.phone}`, 15, 59);
  doc.text(`Diagnostic Code: PAT-${patient.id.slice(0, 5).toUpperCase()}`, 15, 64);

  doc.setFont('helvetica', 'bold');
  doc.text('HEALTHCARE TEAM', 120, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Consultant: ${doctor.name}`, 120, 54);
  doc.text(`Department: ${doctor.specialty}`, 120, 59);
  doc.text(`Summary ID: CON-${consultation.id.slice(0, 8).toUpperCase()}`, 120, 64);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 70, 195, 70);

  // Detailed Summary
  doc.setFont('helvetica', 'bold');
  doc.text('PRIMARY SYMPTOMS:', 15, 78);
  doc.setFont('helvetica', 'normal');
  doc.text(consultation.symptoms || 'None recorded', 60, 78, { maxWidth: 130 });

  doc.setFont('helvetica', 'bold');
  doc.text('DIAGNOSIS (AI-ASSISTED):', 15, 90);
  doc.setFont('helvetica', 'normal');
  doc.text(consultation.diagnosis || 'Checking...', 60, 90, { maxWidth: 130 });

  doc.setFont('helvetica', 'bold');
  doc.text('CO-PILOT NOTES & PLAN:', 15, 102);
  doc.setFont('helvetica', 'normal');
  doc.text(consultation.notes || 'No notes', 15, 108, { maxWidth: 180 });

  if (consultation.interactionWarnings) {
    const warningY = 145;
    doc.setFillColor(254, 242, 242); // soft red bg
    doc.rect(15, warningY, 180, 20, 'F');
    doc.setDrawColor(239, 68, 68); // red border
    doc.rect(15, warningY, 180, 20);

    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text('DRUG-DRUG INTERACTION WARNINGS:', 18, warningY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(consultation.interactionWarnings, 18, warningY + 12, { maxWidth: 174 });
    doc.setTextColor(0, 0, 0);
  }

  addBrandedFooter(doc);
  doc.save(`Clinical_Summary_${patient.name.replace(/\s+/g, '_')}.pdf`);
}

export function generateReceiptPDF(
  payment: Payment,
  patient: Patient,
  doctor: Doctor,
  clinicInfo: ClinicSettings
) {
  const doc = new jsPDF();
  addBrandedHeader(doc, 'Payment Receipt', clinicInfo);

  // Metadata block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BILL TO (PATIENT)', 15, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Patient Name: ${patient.name}`, 15, 54);
  doc.text(`Contact: ${patient.phone}`, 15, 59);
  doc.text(`Location: ${patient.city}`, 15, 64);

  doc.setFont('helvetica', 'bold');
  doc.text('TRANSACTION DETAILS', 120, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt No: REC-${payment.id.toUpperCase().slice(0, 8)}`, 120, 54);
  doc.text(`Payment Gateway: ${payment.method}`, 120, 59);
  if (payment.upiRef) {
    doc.text(`UPI Ref No: ${payment.upiRef}`, 120, 64);
  }
  doc.text(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`, 120, 69);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 75, 195, 75);

  // Itemized Charges Table
  doc.setFont('helvetica', 'bold');
  doc.text('ITEMIZED CHARGES', 15, 84);

  const tableRows = [
    ['1', `OPD Consultation - ${doctor.name}`, `1`, `₹${payment.amount}.00`, `₹${payment.amount}.00`],
  ];

  autoTable(doc, {
    startY: 88,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: tableRows,
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      4: { halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Payment status callout box
  doc.setFillColor(240, 253, 244); // soft green bg
  doc.rect(15, finalY, 180, 18, 'F');
  doc.setDrawColor(34, 197, 94); // green border
  doc.rect(15, finalY, 180, 18);

  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSACTION STATUS: SUCCESSFUL / PAID', 20, finalY + 11);
  doc.setTextColor(0, 0, 0);

  // Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text(
    'Self-attested electronic transaction. Real-time verified settlement requires registered PSP gateway. This serves as patient-attested voucher.',
    15,
    finalY + 28,
    { maxWidth: 180 }
  );

  addBrandedFooter(doc);
  doc.save(`Receipt_${patient.name.replace(/\s+/g, '_')}_${payment.id.slice(0, 5)}.pdf`);
}
