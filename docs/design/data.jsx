// data.jsx — Mock data for Rick Whitman per spec.
// All timestamps are relative to April 19, 2026.

const MOCK_PATIENT = {
  id: 'p-rick',
  legalName: 'Richard J. Whitman',
  preferredName: 'Rick',
  dob: '1948-04-15',
  age: 77,
  sex: 'Male',
  heightCm: 178,
  weightKg: 82,
  mrn: 'WHITMAN-001',
  language: 'English',
  mriSafetyStatus: 'conditional_1.5T',
  codeStatus: 'full_code',
  organDonor: 'yes',
  bltActive: true,
  bltLiftDate: '2026-06-04',
  bltWeeks: 12,
  surgeryDate: '2026-03-12',
};

const MOCK_ACTIVE_DIAGNOSES = [
  { id: 'd1', name: 'Status post L1–L5 lumbar fusion + sacral instrumentation', date: '2026-03-12', severity: 'critical', enteredBy: 'Linda (from surgeon call)', source: 'family_report' },
  { id: 'd2', name: 'Two small pulmonary emboli', date: '2026-03-20', severity: 'critical', enteredBy: 'Sister (from discharge summary)', source: 'medical_record' },
  { id: 'd3', name: 'Pneumonia — on levofloxacin', date: '2026-03-20', severity: 'warning', enteredBy: 'Sister (from discharge summary)', source: 'medical_record' },
  { id: 'd4', name: 's/p bilateral total hip arthroplasty', date: '2019-08-00', severity: 'info', enteredBy: 'Rick (self-reported)', source: 'patient_history' },
  { id: 'd5', name: 'Sepsis — prior (2024)', date: '2024-07-00', severity: 'info', enteredBy: 'Sister (from hospital records)', source: 'medical_record' },
];

const MOCK_COMORBIDITIES = [
  { id: 'c1', name: 'Hypertension', controlled: true, onset: '2010' },
  { id: 'c2', name: 'Type 2 diabetes (diet-controlled)', controlled: true, onset: '2018' },
  { id: 'c3', name: 'Benign prostatic hyperplasia', controlled: true, onset: '2020' },
];

const MOCK_ALLERGIES = [
  { id: 'a1', allergen: 'Penicillin', reaction: 'Anaphylaxis', severity: 'life_threatening', type: 'medication', verifiedBy: 'Dr. Halloran (PCP)', verifiedDate: '2018-02', enteredBy: 'Rick (self-reported)' },
  { id: 'a2', allergen: 'Sulfa drugs', reaction: 'Rash', severity: 'moderate', type: 'medication', verifiedBy: 'Dr. Halloran (PCP)', verifiedDate: '2020-06', enteredBy: 'Linda' },
  { id: 'a3', allergen: 'Latex', reaction: 'Contact dermatitis', severity: 'mild', type: 'latex', verifiedBy: null, verifiedDate: null, enteredBy: 'Sister (from op report)' },
  { id: 'a4', allergen: 'Shellfish', reaction: 'Nausea', severity: 'mild', type: 'food', verifiedBy: null, verifiedDate: null, enteredBy: 'Rick (self-reported)' },
];

const MOCK_HARDWARE = [
  { type: 'Pedicle screws', count: 10, material: 'Titanium', manufacturer: 'Medtronic', model: 'CD Horizon', mri: 'conditional_1.5T_3T', levels: ['L1', 'L2', 'L3', 'L4', 'L5'], side: null },
  { type: 'Rods', count: 2, material: 'Titanium', manufacturer: 'Medtronic', model: null, length: '12 cm', mri: 'conditional_1.5T_3T' },
  { type: 'Sacral instrumentation', count: 1, material: 'Titanium', manufacturer: 'Stryker', model: 'Xia 4.5', mri: 'conditional_1.5T' },
  { type: 'Hip prosthesis — Left', count: 1, material: 'Cobalt-chromium', manufacturer: 'Zimmer', model: 'M/L Taper', mri: 'conditional_1.5T_3T', year: 2019 },
  { type: 'Hip prosthesis — Right', count: 1, material: 'Cobalt-chromium', manufacturer: 'Zimmer', model: 'M/L Taper', mri: 'conditional_1.5T_3T', year: 2019 },
];

const MOCK_MEDICATIONS = [
  { name: 'Apixaban', dose: '5 mg', freq: 'BID', lastTaken: 'Today, 8:04 AM', class: 'anticoagulant' },
  { name: 'Levofloxacin', dose: '750 mg', freq: 'Daily', lastTaken: 'Today, 9:00 AM', class: 'antibiotic' },
  { name: 'Oxycodone', dose: '5 mg', freq: 'Q4H PRN', lastTaken: 'Today, 6:30 AM', class: 'opioid' },
  { name: 'Acetaminophen', dose: '650 mg', freq: 'Q6H scheduled', lastTaken: 'Today, 8:00 AM', class: 'analgesic' },
  { name: 'Lisinopril', dose: '10 mg', freq: 'Daily', lastTaken: 'Today, 8:04 AM', class: 'ace-inhibitor' },
  { name: 'Docusate', dose: '100 mg', freq: 'BID', lastTaken: 'Today, 8:04 AM', class: 'laxative' },
];

const MOCK_PROVIDERS = [
  { id: 'pr1', name: 'Dr. Marcus Kim', role: 'Spine surgeon', phone: '(617) 555-0142', org: 'Brigham Spine Center' },
  { id: 'pr2', name: 'Dr. Sarah Halloran', role: 'Primary care', phone: '(617) 555-0188', org: 'Cambridge Health' },
  { id: 'pr3', name: 'Dr. Priya Rao', role: 'Pulmonology', phone: '(617) 555-0211', org: 'Mass General' },
  { id: 'pr4', name: 'Dr. James O\'Neill', role: 'Orthopedics (hips)', phone: '(617) 555-0199', org: 'New England Orthopedic' },
];

const MOCK_EMERGENCY_CONTACTS = [
  { id: 'e1', name: 'Linda Whitman', relationship: 'Spouse', phone: '(617) 555-0102', priority: 1, linkedUser: true, lastContacted: '2 hrs ago' },
  { id: 'e2', name: 'Amy Whitman-Kerr', relationship: 'Daughter (MPA holder)', phone: '(508) 555-0147', priority: 2, linkedUser: true },
  { id: 'e3', name: 'Ben Whitman', relationship: 'Son', phone: '(415) 555-0173', priority: 3, linkedUser: true, lastContacted: 'Yesterday' },
];

const MOCK_VITALS_HISTORY = [
  { date: 'Apr 13', bp: '124/78', hr: 88, spo2: 96, temp: 98.6, pain: 5 },
  { date: 'Apr 14', bp: '130/80', hr: 90, spo2: 95, temp: 99.1, pain: 5 },
  { date: 'Apr 15', bp: '128/78', hr: 91, spo2: 94, temp: 99.4, pain: 4 },
  { date: 'Apr 16', bp: '132/82', hr: 89, spo2: 94, temp: 99.8, pain: 4 },
  { date: 'Apr 17', bp: '129/79', hr: 92, spo2: 93, temp: 100.0, pain: 3 },
  { date: 'Apr 18', bp: '131/80', hr: 93, spo2: 93, temp: 100.4, pain: 4 },
  { date: 'Apr 19', bp: '128/78', hr: 92, spo2: 93, temp: 100.2, pain: 4 },
];

const MOCK_FALL_HISTORY = [
  { id: 'f1', date: '2026-03-19', location: 'Home — living room', circumstances: 'Tripped on rug, caught by Linda; brief foot weakness resolved ~30 min.', injury: false, required_attention: false, leadsTo: 'PE diagnosed next day' },
  { id: 'f2', date: '2025-11-02', location: 'Home — bathroom', circumstances: 'Nighttime, no injury.', injury: false, required_attention: false },
  { id: 'f3', date: '2024-06-14', location: 'Outdoors', circumstances: 'Uneven sidewalk, scraped hands.', injury: true, required_attention: false },
];

const MOCK_VITALS_LAST = {
  bp: '128/78', hr: 92, temp: '100.2°F', spo2: 93, rr: 20, pain: '4/10',
  orthostatic: '132/80 → 118/72 → 110/70 (−22 mmHg standing)',
  takenAt: 'Today, 7:12 AM',
};

const MOCK_MPA = {
  status: 'inactive',                    // inactive | active | expired
  holderName: 'Amy Whitman-Kerr',
  holderRelationship: 'Daughter',
  holderPhone: '(508) 555-0147',
  holderEmail: 'amy.wk@example.com',
  poaDocument: 'Durable POA (signed 2022)',
  activationHistory: [
    { id: 'ah1', date: '2024-07-14', event: 'Activated', clinician: 'Dr. R. Patel, MD', reason: 'Sepsis — ICU admission', note: 'Rick intubated; capacity determination signed at 2:18 PM.' },
    { id: 'ah2', date: '2024-07-22', event: 'Deactivated', clinician: 'Dr. R. Patel, MD', reason: 'Capacity regained', note: 'Rick extubated, alert and oriented ×3. Signed release at 9:04 AM.' },
  ],
};

// Stakeholders for view switcher
const STAKEHOLDERS = [
  { id: 'linda',  name: 'Linda',  role: 'Primary caregiver',  scope: 'full',    color: 'accent' },
  { id: 'rick',   name: 'Rick',   role: 'Patient (self)',     scope: 'full_self',    color: 'ok' },
  { id: 'amy', name: 'Amy', role: 'MPA holder / Family coord.', scope: 'full', color: 'info' },
  { id: 'ben',    name: 'Ben',    role: 'Technical operator', scope: 'full',    color: 'info' },
  { id: 'aide',   name: 'Aide',   role: 'Paid aide (scoped)', scope: 'scoped',  color: 'neutral' },
];

Object.assign(window, {
  MOCK_PATIENT, MOCK_ACTIVE_DIAGNOSES, MOCK_COMORBIDITIES, MOCK_ALLERGIES,
  MOCK_HARDWARE, MOCK_MEDICATIONS, MOCK_PROVIDERS, MOCK_EMERGENCY_CONTACTS,
  MOCK_FALL_HISTORY, MOCK_VITALS_LAST, MOCK_VITALS_HISTORY, MOCK_MPA, STAKEHOLDERS,
});
