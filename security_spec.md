# Security Specification & Threat Model (Aura OS 2.0)

## Data Invariants

1. **Patient Identity Integrity**: Every patient record must have a unique `id` matching its document ID. No patient record can be created without a valid string phone number and name.
2. **Appointment Integrity**: Appointments must have scheduling dates, valid timeslots, and a valid `status` in `["scheduled", "completed", "cancelled"]`.
3. **Consultation Integrity**: Consultations are clinical records and cannot be modified (immutable) once saved, to preserve medical-legal compliance.
4. **Queue Token Order**: Queue item token numbers must be positive integers, and states are strictly restricted to `["Waiting", "In Progress", "Completed", "Skipped"]`.
5. **Ambulance Tracking Safety**: Ambulance telemetry distances cannot be negative, and statuses must stay within `["Available", "On the way", "At emergency"]`.
6. **Bed Status Capacity**: Real-time bed availability counters (general, ICU, emergency) must always be non-negative.
7. **UPI Ledger Immutability**: Payment ledger receipts cannot be deleted, and payment statuses must only transition from pending to completed or failed.
8. **Administrative Isolation**: Global settings can only be accessed and updated by designated admin operators.

---

## The "Dirty Dozen" Malicious Payloads

The following payloads attempt to bypass authorization, inject corrupt values, or shortcut states.

### 1. Identity Spoofing (Patient Bypass)
Attempting to create a patient profile using a hijacked patient id but with a spoofed creator ID.
```json
{
  "id": "hijacked-id",
  "name": "Spoofed Patient",
  "phone": "9999999999",
  "city": "Chennai",
  "age": 30,
  "gender": "Male",
  "condition": "Stable",
  "createdAt": "2026-07-09T15:00:00Z"
}
```

### 2. State Shortcutting (Illegal Appointment Status)
An unauthorized client bypassing scheduling rules to mark a pending appointment as `completed` without clinical notes.
```json
{
  "id": "appointment-123",
  "status": "completed-without-notes"
}
```

### 3. Resource Poisoning (Giant Patient Name)
Attempting a "Denial of Wallet" or buffer-overflow like exploit by sending a 2MB string as the patient's name.
```json
{
  "id": "giant-name-id",
  "name": "[A string of 2,000,000 characters...]",
  "age": 25,
  "gender": "Other"
}
```

### 4. Negative Queue Token Injection
Inserting a token with a negative or floating-point token number to break queue sorting logic.
```json
{
  "id": "queue-bad",
  "tokenNumber": -15,
  "status": "Waiting"
}
```

### 5. Medical Record Modification (Consultation Tampering)
Attempting to rewrite or overwrite a historical clinical consultation note.
```json
{
  "id": "consultation-historic",
  "notes": "Patient is fully cured. Erase all prior diagnostic concerns."
}
```

### 6. Negative Bed Counters (Denial of Bed Resource)
Attempting to update free bed counts to a negative value, causing mathematical errors in the ambulance dispatcher.
```json
{
  "hospitalId": "hosp-1",
  "bedsICUFree": -50
}
```

### 7. Orphaned Appointment (Missing Patient Reference)
Creating an appointment record with a non-existent or null patient reference.
```json
{
  "id": "app-orphaned",
  "patientId": "",
  "doctorId": "doc-456"
}
```

### 8. Payment Ledger Erasure
Attempting to delete a payment transaction from the database.
```json
"DELETE /payments/txn-789"
```

### 9. Illegal Payment Status Transition
Transitioning a payment's status to a fabricated state such as `waived-by-staff` to bypass billing checks.
```json
{
  "id": "payment-999",
  "status": "waived-by-staff"
}
```

### 10. Temporal Timestamp Spoofing
Bypassing Firestore server timestamps by setting a custom client-side timestamp in the past or future.
```json
{
  "id": "patient-987",
  "createdAt": "1999-01-01T00:00:00Z"
}
```

### 11. Anonymous Write on Medical Settings
Attempting to write or rewrite Clinic settings without being logged in or as a non-verified provider.
```json
{
  "clinicName": "Aura Disrupted Clinic"
}
```

### 12. Unauthorized Location Poisoning (Negative Ambulance Distance)
Injecting a malicious distance parameter into an ambulance tracker to break tracking algorithms.
```json
{
  "id": "amb-4",
  "distanceKm": -99.4
}
```

---

## Test Runner (Theoretical Assertion Framework)

Using `@firebase/rules-unit-testing`, we assert:
- `assertFails(alice.patients.create(payload3))` (Name too large)
- `assertFails(anonymous.settings.write(payload11))` (Admin restriction)
- `assertFails(alice.consultations.update(payload5))` (Immutable medical logs)
- `assertFails(bob.payments.delete(payload8))` (Undeletable payments)
