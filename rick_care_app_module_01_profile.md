# Module 01 — Patient Profile & Clinical Context (Deep Spec v1.2)

**Status:** Phase A. Build-ready.

**Dependencies:** Technical foundation v1.1 (required — data model, auth, RLS patterns, UI stack). Coordinator Agent Instructions v1.0 (required — integration gate reviews). Module 01 Design System Contract v1.0 (required — component and tint contracts).

**Dependents:** Every other module. This is the foundational patient data layer.

**Related outline sections:** Outline v0.3 Module 1.

**Change log:**
- **v1.0 → v1.1:** Added Section 14 (Multi-Agent Build Instructions) and Section 15 (Integration Contracts).
- **v1.1 → v1.2:** Incorporated Claude Design output and Design Guidance document. ASCII wireframes (v1.1 §4.2–4.6) deleted; canonical visual design now lives in the Claude Design project and the companion Design System Contract doc. §4 restructured to reference Claude Design handoff and split screens into high-fidelity (Phase A priority) vs wireframe-fidelity tiers. §5.1 onboarding replaced with three on-ramps pattern (Fast path / After hospital / Invited) from Design Guidance §M02. §4.5 MPA framing shifted to "You decide" for Rick's view per Design Guidance §M05. Integration contracts (§15) extended with `useCareLog` write-store contract. Tech stack references updated to React 19 + Tailwind v4 + pinned versions per technical_foundation.md v1.1.

---

## 1. Purpose

The "crash card." A single canonical source of truth for who the patient is, what was done to them surgically, what's currently wrong with them, what hardware is in their body, what they're allergic to, who holds decision authority, and how to reach their care team. Optimized for:

1. **Instant ER readability.** A covering clinician, EMT, or ER doc should be able to understand Rick's current medical situation in 10–15 seconds from the ER handoff view.
2. **Single source of truth.** No other module duplicates this data — they reference it.
3. **Multi-stakeholder reconciliation.** Sister's records aggregation work lands here. Linda's day-to-day updates land here. Rick's self-reports land here. Everyone sees the same canonical record.
4. **MPA authority transparency.** Who holds Medical Power of Attorney, whether it's active, what activated it.

---

## 2. User Stories

### As Rick (patient_self)

- I can see my own complete profile: demographics, diagnoses, surgery history, hardware, allergies, providers.
- I can update my preferred name, contact preferences, and emergency contacts without Linda's involvement.
- I can see who holds my MPA and whether it's currently active (it should be inactive while I'm capacitated, and I want to confirm that).
- I can generate an ER handoff PDF for myself at any time.
- I can view but not modify clinical records entered by Linda or Sister (diagnoses, surgical records). If something's wrong, I can add a note or contact the surgeon's office.

### As Linda (primary_caregiver)

- I can view Rick's complete profile.
- I can update day-to-day profile fields: emergency contacts, photos, preferred pharmacy.
- I can log entries into Rick's clinical history (a new diagnosis, a new fall history item) when provided by a clinician.
- I can generate an ER handoff PDF in under 10 seconds — single tap, one confirmation.
- I can view the hardware inventory whenever I need to reference it (MRI safety questions, EMT questions, etc.).
- I can see at a glance whether Rick's BLT precautions are still active and when they're scheduled to lift.

### As Sister (mpa_holder / family_coordinator)

- I can view Rick's complete clinical profile.
- I can do records aggregation work: upload discharge summaries, operative reports, imaging results; reconcile diagnosis lists; update provider directory as I contact offices.
- I can see the provenance of every data point ("entered by Linda from surgeon call," "extracted from discharge summary," "added by Dr. X office").
- I can initiate an MPA activation workflow by uploading a capacity determination document (but cannot unilaterally toggle MPA active — that requires the document).
- I can generate an ER handoff PDF.
- I cannot edit entries made by Linda or Rick; I can add my own entries that reference theirs (correction workflow).

### As Ben (technical_operator)

- I can see the complete profile for technical purposes.
- I can manage role assignments (grant Sister access, grant a paid aide time-scoped access).
- I can export the complete profile as JSON for backup.
- I can view the audit log for any profile field.
- I can configure notification preferences at a system level.

### As a Helper or Paid Aide (scoped role)

- I can see only the patient demographics and current active medications relevant to my assigned shift/task.
- I cannot see full diagnosis list, full provider list, insurance, or advance directive.
- I can see emergency contacts and the "in case of emergency" ER handoff summary.

### As a Clinician (read-only, via generated handoff)

- I receive a PDF or secure link showing the complete clinical picture in a standard order: identifiers, active diagnoses, allergies, current medications, surgical history with hardware, recent vitals trend, recent events, advance directive status.
- I do not log into the app.

---

## 3. Data Model Additions

Builds on the tables defined in the technical foundation (`patients`, `surgeries`, `diagnoses`, `providers`, `patient_providers`, `pharmacies`, `documents`). Tables below are new to Module 01 or require field additions.

### 3.1 New tables

#### `allergies`

```sql
CREATE TABLE allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  allergen_type TEXT NOT NULL
    CHECK (allergen_type IN ('medication', 'food', 'environmental', 'contrast', 'latex', 'other')),
  reaction_type TEXT,
    -- e.g. 'hives', 'anaphylaxis', 'nausea', 'swelling', 'respiratory distress'
  severity TEXT NOT NULL
    CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening', 'unknown')),
  onset_date DATE,
  last_reaction_date DATE,
  verified_by_provider_id UUID REFERENCES providers(id),
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID NOT NULL,
  updated_by_user_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_allergies_patient_active ON allergies(patient_id) WHERE deleted_at IS NULL AND active = TRUE;
```

#### `insurance_policies`

```sql
CREATE TABLE insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  payer_name TEXT NOT NULL,
  policy_type TEXT
    CHECK (policy_type IN ('primary', 'secondary', 'tertiary', 'medicare', 'medicaid', 'supplemental', 'other')),
  member_id TEXT,
  group_number TEXT,
  plan_name TEXT,
  policy_holder_name TEXT,
  policy_holder_relationship TEXT,  -- 'self', 'spouse', 'dependent'
  effective_date DATE,
  termination_date DATE,
  card_front_document_id UUID REFERENCES documents(id),
  card_back_document_id UUID REFERENCES documents(id),
  prior_auth_phone TEXT,
  claims_phone TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID NOT NULL,
  updated_by_user_id UUID NOT NULL
);

CREATE INDEX idx_insurance_patient_active ON insurance_policies(patient_id) WHERE active = TRUE;
```

#### `capacity_determinations`

This is the record that enables MPA activation. A clinician documents incapacity; the app captures it here.

```sql
CREATE TABLE capacity_determinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  determined_by_provider_id UUID REFERENCES providers(id),
  determined_by_name TEXT NOT NULL,  -- in case provider isn't in our directory
  determined_by_credentials TEXT NOT NULL,  -- 'MD', 'DO', 'NP', 'PA'
  determination_date DATE NOT NULL,
  scope TEXT NOT NULL
    CHECK (scope IN ('global', 'medical_decisions', 'specific_decision', 'temporary', 'permanent')),
  scope_details TEXT,
  supporting_document_id UUID REFERENCES documents(id),  -- the signed note
  effective_from TIMESTAMPTZ NOT NULL,
  effective_until TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  revocation_document_id UUID REFERENCES documents(id),
  uploaded_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);
```

#### `fall_history`

Distinct from `fall_events` (Module 07). This captures historical falls as risk factors, not individual incidents being actively managed.

```sql
CREATE TABLE fall_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  approximate_date DATE,
  location TEXT,  -- free text: 'home', 'outdoors', 'hospital'
  circumstances TEXT,
  injury_sustained BOOLEAN,
  injury_description TEXT,
  required_medical_attention BOOLEAN,
  reported_by_user_id UUID NOT NULL,
  source TEXT,  -- 'patient_history', 'medical_record', 'family_report'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_fall_history_patient ON fall_history(patient_id, approximate_date DESC);
```

#### `comorbidities`

Conditions that aren't acute diagnoses but are ongoing medical context (diabetes, hypertension, prior conditions). Separate from `diagnoses` because those track active/acute/recently-resolved; comorbidities are chronic background.

```sql
CREATE TABLE comorbidities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  condition_name TEXT NOT NULL,
  icd10_code TEXT,
  onset_approximate TEXT,  -- "childhood", "2015", "5 years ago"
  controlled BOOLEAN,
  managing_provider_id UUID REFERENCES providers(id),
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID NOT NULL,
  updated_by_user_id UUID NOT NULL
);
```

#### `emergency_contacts`

Who to call in an emergency, in what order.

```sql
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,  -- 'spouse', 'daughter', 'son', 'friend', 'neighbor', 'POA holder'
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  email TEXT,
  priority_order INTEGER NOT NULL,  -- 1 = call first
  notes TEXT,
  -- NB: Can point to an existing app user (Linda, Sister) but not required.
  linked_user_id UUID REFERENCES users_profile(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID NOT NULL
);

CREATE UNIQUE INDEX idx_emergency_contacts_priority ON emergency_contacts(patient_id, priority_order);
```

### 3.2 Field additions to existing tables

#### `patients` (additions)

```sql
ALTER TABLE patients ADD COLUMN preferred_pharmacy_id UUID REFERENCES pharmacies(id);
ALTER TABLE patients ADD COLUMN primary_language TEXT DEFAULT 'en';
ALTER TABLE patients ADD COLUMN religious_considerations TEXT;  -- 'no blood products', 'no pork gelatin capsules', etc.
ALTER TABLE patients ADD COLUMN mri_safety_status TEXT
  CHECK (mri_safety_status IN ('mri_safe', 'mri_conditional', 'mri_unsafe', 'unknown'));
ALTER TABLE patients ADD COLUMN mri_safety_notes TEXT;
-- Derived from hardware_inventory but stored explicitly for ER speed
ALTER TABLE patients ADD COLUMN organ_donor_status TEXT
  CHECK (organ_donor_status IN ('yes', 'no', 'unknown'));
ALTER TABLE patients ADD COLUMN code_status TEXT
  CHECK (code_status IN ('full_code', 'dnr', 'dni', 'dnr_dni', 'comfort_only', 'unknown'));
ALTER TABLE patients ADD COLUMN code_status_document_id UUID REFERENCES documents(id);
```

#### `surgeries` (additions to foundation schema)

```sql
-- hardware_inventory JSONB schema (not a column change, but specifying structure)
-- Example structure:
-- {
--   "implants": [
--     {
--       "type": "pedicle_screws",
--       "count": 10,
--       "material": "titanium",
--       "manufacturer": "Medtronic",
--       "model": "CD Horizon",
--       "mri_compatible": "conditional_1.5T_3T",
--       "levels": ["L1", "L2", "L3", "L4", "L5"]
--     },
--     {
--       "type": "rods",
--       "count": 2,
--       "material": "titanium",
--       "manufacturer": "Medtronic",
--       "length_cm": 12
--     },
--     {
--       "type": "sacral_instrumentation",
--       "manufacturer": "Stryker",
--       "model": "X",
--       "mri_compatible": "conditional_1.5T"
--     },
--     {
--       "type": "hip_prosthesis",
--       "side": "left",
--       "manufacturer": "Zimmer",
--       "model": "Y",
--       "material": "cobalt_chromium",
--       "year_implanted": 2019
--     }
--   ],
--   "notes": "Sacral hardware tied to bilateral hip prostheses for stability"
-- }
```

No schema change; the JSONB column was already in the foundation. This section documents the canonical structure so forms and PDFs parse consistently.

### 3.3 Indexes

```sql
CREATE INDEX idx_patients_household ON patients(household_id);
CREATE INDEX idx_patients_primary ON patients(household_id) WHERE is_primary_patient = TRUE;
CREATE INDEX idx_surgeries_patient_date ON surgeries(patient_id, surgery_date DESC);
CREATE INDEX idx_diagnoses_patient_active ON diagnoses(patient_id) WHERE active = TRUE;
CREATE INDEX idx_comorbidities_patient_active ON comorbidities(patient_id) WHERE active = TRUE;
CREATE INDEX idx_patient_providers_role ON patient_providers(patient_id, role) WHERE active = TRUE;
```

### 3.4 RLS policies (examples — full set generated per role matrix)

```sql
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Full-access roles can read allergies"
ON allergies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patient_role_assignments pra
    WHERE pra.patient_id = allergies.patient_id
      AND pra.user_id = auth.uid()
      AND pra.revoked_at IS NULL
      AND pra.role IN (
        'patient_self', 'primary_caregiver', 'mpa_holder',
        'family_coordinator', 'technical_operator'
      )
  )
);

CREATE POLICY "Helpers can read allergies for patients they assist"
ON allergies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patient_role_assignments pra
    WHERE pra.patient_id = allergies.patient_id
      AND pra.user_id = auth.uid()
      AND pra.revoked_at IS NULL
      AND pra.role IN ('helper', 'paid_aide')
  )
);
-- Allergies are always visible to helpers (safety-critical)
-- unlike e.g. insurance which they should not see.

CREATE POLICY "Full-access roles can insert allergies"
ON allergies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patient_role_assignments pra
    WHERE pra.patient_id = allergies.patient_id
      AND pra.user_id = auth.uid()
      AND pra.revoked_at IS NULL
      AND pra.role IN (
        'patient_self', 'primary_caregiver', 'mpa_holder',
        'family_coordinator', 'technical_operator'
      )
  )
);

CREATE POLICY "Only the creator can update their allergy entries"
ON allergies FOR UPDATE
USING (created_by_user_id = auth.uid());
-- Embodies "no editing others' entries" principle.
-- Corrections go through a new entry with a reference to the original.
```

Similar policies for every table. Generated from the role capability matrix in the foundation doc.

---

## 4. Screens & UI

### 4.1 Screen inventory

| Screen | Route | Primary user | Purpose |
|---|---|---|---|
| Profile home | `/patient/{id}` | All roles | Dashboard overview |
| Demographics editor | `/patient/{id}/demographics` | Rick, Linda, Sister | Name, DOB, contact info |
| Surgery list | `/patient/{id}/surgeries` | All clinical roles | List of all surgeries |
| Surgery detail | `/patient/{id}/surgeries/{sid}` | All clinical roles | Specific surgery + hardware |
| Hardware inventory | `/patient/{id}/surgeries/{sid}/hardware` | All clinical roles | Drill-down on implants |
| Diagnoses | `/patient/{id}/diagnoses` | All clinical roles | Active + resolved |
| Comorbidities | `/patient/{id}/comorbidities` | All clinical roles | Chronic background |
| Allergies | `/patient/{id}/allergies` | All roles incl. helpers | Safety-critical |
| Providers | `/patient/{id}/providers` | All clinical roles | Care team directory |
| Pharmacies | `/patient/{id}/pharmacies` | Linda, Sister | Preferred + alternates |
| Insurance | `/patient/{id}/insurance` | Linda, Sister | Cards, prior-auth numbers |
| Emergency contacts | `/patient/{id}/emergency-contacts` | All roles | Who to call |
| Advance directive | `/patient/{id}/advance-directive` | Rick, Linda, Sister | POA, code status, directive |
| MPA status | `/patient/{id}/mpa` | Sister, Ben, Rick | Activation status + history |
| Fall history | `/patient/{id}/fall-history` | All clinical roles | Historical falls |
| ER handoff | `/patient/{id}/er-handoff` | All roles | Generate PDF |

### 4.2 Screen designs — authoritative source

**Canonical visual design, screen layouts, interactions, and component specifications live in the Claude Design project "Rick Care App — Production Design System"** (claude.ai/design). The design was produced in April 2026 after the v1.1 wireframes and supersedes the ASCII wireframes that previously lived in this section.

What this means for the Implementation Agent:
- The Claude Design project is the source of truth for pixel-level layout, spacing, color tokens, typography, and component behavior.
- The handoff bundle generated from Claude Design (see Design Workflow Guide v2.0 §6) is what Claude Code consumes at Phase 5. The IA does not re-interpret or guess — it follows the handoff bundle.
- If the design changes mid-build, the IA updates via the handoff deviation flow (see §14.5 and Design Workflow Guide §6.4).

**Durable design contracts** (the information-hierarchy, tone, alert tiering, and component contracts that must hold even if the Claude Design project is lost) are codified in the companion document **`rick_care_app_module_01_design_system_contract.md`**. That contract covers:
- Category tints (the pastel spine of the visual language)
- Semantic state colors (critical/warning/ok/info) and when each is earned
- Shared component contracts (HeroCard, CategoryCard, TimelineItem, VitalsTile, MedCard, AllergyRow, Sheet, RecoveryRing, SectionLabel, ScreenHeader)
- The `useCareLog` universal write store contract
- Alert taxonomy (three tiers, not a spectrum)
- Rick-specific view rules (plain language, 56px min button height, AAA contrast, patient view is not a trimmed caregiver view)
- Handoff variants (ER, surgeon follow-up, aide shift brief, rehab admission)

The contract document is the IA's daily reference; the Claude Design handoff bundle is the IA's per-screen build reference.

### 4.3 Priority screens for Phase A

Not all screens in the §4.1 inventory ship at the same fidelity. For Phase A:

**High-fidelity (pixel-accurate to Claude Design handoff):**
- Today (the landing surface when logged in, not Profile home — design moved the daily-use surface here)
- Profile home (the records dashboard — what was §4.2 in v1.1)
- Surgery detail with hardware inventory
- Allergies (with the life-threatening elevation pattern)
- MPA status
- ER handoff generator + PDF preview

**Wireframe-fidelity (information hierarchy validated, visual polish can iterate post-launch):**
- Demographics editor
- Diagnoses list
- Comorbidities
- Providers
- Pharmacies
- Insurance
- Emergency contacts
- Advance directive
- Fall history

The split is pragmatic: the first group is what Linda, Rick, Amy, and an ER clinician actually touch daily or under stress; the second group is records-keeping surfaces that can be functional-but-plain in Phase A without affecting outcomes.

### 4.4 Reusable components (shared with other modules)

Component contracts are defined in full in `rick_care_app_module_01_design_system_contract.md` §3. Summary list for cross-reference:

| Component | Module 01 screens | Also used by |
|---|---|---|
| `HeroCard` | Today, Profile home | Module 10 (Rick's view), Module 02 onboarding (pre-recovery variant) |
| `CategoryCard` | Profile home, Records | Every module — the canonical domain tile |
| `TimelineItem` | Today ("Today's plan") | Module 03 (alerts queue), Module 10 (Rick's primary action) |
| `VitalsTile` | Today, ER handoff | Module 03 (vitals screen), Module 05 (respiratory trend) |
| `AllergyRow` | Allergies, Today (life-threatening section) | Module 02 (med-add flow validation) |
| `MedCard` | (Module 02) | Cross-module med references |
| `Sheet` (bottom-sheet modal) | All logging forms | Every module with a write affordance |
| `ScreenHeader` | Every inner screen | Every inner screen in every module |
| `RecoveryRing` | HeroCard | Module 10 (patient view), progress-related UIs |
| `SectionLabel` | Every screen | Every screen |
| `ActivityFeed` row | Today | Module 03 (alert delivery), Module 17 (audit trail) |
| `ERHandoffButton` / `ERPDFPreview` | ER handoff screen | Module 06 handoff variants extend `ERPDFPreview` |
| `AllergyDetailSheet` (generalizes to `RecordDetailSheet`) | Allergies | Module 04 (Amy's verify/edit loop) |
| `MPAStatusIndicator` | Profile home, MPA status, app header | Module 17 (role clarification), ER handoff |
| `HardwareDisplay` | Surgery detail, ER handoff | Module 15 (ER handoff aggregation) |
| `TimestampedEntry` (facts-not-blame default) | Every record-detail view | Every module that displays who-entered info |
| `OfflineIndicator` | Global header | Global |
| `useCareLog` store hook | Every write path | Every module with write affordances |

Full contracts (props, variants, accessibility requirements, behavior rules) are in the Design System Contract doc.

---

## 5. Workflows

### 5.1 Initial household + patient setup (onboarding)

**Entry point:** First login after account creation.

**Framing principle (from Design Guidance §M02):** Onboarding is not a forms app. It is the module that either earns a year of use or loses the household in twenty minutes. The first screen after install does not ask Linda to type; it asks her who she is caring for, and gives her a scannable choice of on-ramps.

**Three on-ramps, not one:**

**On-ramp A — Fast path (target: 90 seconds).** For when Linda needs something on the fridge by tonight.
- Household name (optional; default "The {LastName} household")
- Primary patient: preferred name, age, photo (optional)
- Top allergy (or explicit "no known allergies")
- Top 3 medications (med name + dose, no frequency required at this stage)
- One emergency contact (name + phone)

At the end, the user sees a preview of what Rick's ER-handoff-style "fridge magnet" looks like with the data they just entered. "This is the version of Rick you just built" — closes the loop between input and value.

Missing fields (DOB for age precision, insurance, providers, full diagnosis list, hardware, advance directive) are not blocking. They populate progressive prompts on the Profile home over the subsequent week.

**On-ramp B — After a hospital visit.** For when Linda is setting up the app with a discharge summary in hand.
- Household + primary patient basics (name, preferred name, age)
- "Do you have a discharge summary PDF?" → document upload
- The app runs OCR + structured extraction on the PDF (Phase A: manual review of extracted candidates; Phase B: AI-assisted extraction with explicit user review)
- For each candidate (diagnoses, medications, allergies, hardware, providers): the user sees a review row with Accept / Edit / Reject
- Never auto-accept; never force manual form entry when a document is available

This is the highest-value on-ramp for Rick's actual situation. Ben setting the app up after Rick's March discharge would start here.

**On-ramp C — Invited by another family member.** For when Amy or Ben has already set up the record; Linda just accepts an invite.
- Linda gets an email/SMS invite with a link
- Tap the link → account creation (magic link or password) → immediately lands on a populated profile
- A one-screen welcome shows what she'll see and what she can do, in plain language from Rick's perspective: *"You'll be able to: read everything, log Rick's vitals and medications, generate ER handoffs. You'll be able to edit day-to-day entries (emergency contacts, pharmacy). You won't be able to activate his Medical POA — that requires a clinician."*

**Selection screen:**

Before committing to an on-ramp, the user sees a choice screen:
- "Setting up quickly?" → On-ramp A
- "Just came home from the hospital?" → On-ramp B
- "Got an invite?" → On-ramp C

The choice is framed around the user's situation, not the app's data model.

**Common post-onboarding flow (all on-ramps):**

Regardless of on-ramp, the user lands on Profile home with:
- A populated record (sparse for A, richer for B, complete for C)
- A "Next steps" prompt card on the home screen showing progressive enhancement opportunities (e.g., "Add Rick's surgeon's phone number" or "Upload the operative report to complete hardware info")
- No nagging: the prompt card is dismissable per-prompt

**Data captured at MVP-profile level** (must exist by end of any on-ramp for the app to be useful):
- Household name (auto-generated OK)
- Primary patient: preferred name + approximate age
- At least one emergency contact (name + phone)
- At least one of: top allergy, or explicit "no known allergies"
- At least one of: one medication, or explicit "no current medications"

**Not required at onboarding** (prompted later via progressive enhancement):
- Legal name, DOB, biological sex (full demographics)
- Surgery and hardware detail
- Full comorbidity list
- Insurance
- Provider directory
- MPA holder info
- Advance directive
- Fall history

**Validation:**
- Preferred name: 1–100 characters
- Age: 0–120 (integer; full DOB collected later)
- Phone: validated format
- Email invites: valid format; cannot invite the same email twice
- Medication name: min 1 character, max 200 (free text; structured validation happens in Module 02)

**Edge cases:**
- User backs out mid-flow → draft saved locally (IndexedDB), resumable on next login
- User closes browser mid-upload (on-ramp B) → document saved; extraction resumes when user returns
- Duplicate email invite (on-ramp C) → error; offer to resend existing invite instead
- User tries to create a second primary patient in same household → error: "A household can have only one primary patient. Add secondary patient instead."
- On-ramp B document upload fails (unreadable PDF, OCR timeout) → fallback to on-ramp A flow with a note retained: "Extraction failed — try again later or fill in manually"
- On-ramp C: invite token expired → clear error + option to request a new invite

**Invitation UX (for on-ramp C senders, and for adding family post-onboarding):**

A single "Invite someone" sheet with a role picker:
- **Primary caregiver** (Linda's role — day-to-day logging)
- **MPA holder / Family coordinator** (Amy's role — records steward, MPA authority)
- **Family** (view + add-own-entries, no MPA authority)
- **Paid aide** (scoped, shift-based)
- **Patient** (Rick himself)

For each role, the sheet shows what the invitee will be able to do, in plain language from Rick's perspective (example for MPA holder: *"Amy will be able to: read everything, add and verify records, receive ER alerts, upload documents. Amy will not be able to: log Rick's daily vitals or medications."*). This matches Design Guidance §M02 on role selection.

**On-ramp B extraction priorities (ordered by clinical impact):**

When parsing a discharge summary, extract in this order (highest-value first):
1. Allergies (especially life-threatening)
2. Active medications with dose/frequency
3. Surgical hardware with MRI compatibility
4. Active diagnoses
5. Emergency contacts from the demographics page
6. Surgeon and PCP from the provider list
7. Advance directive / code status statement
8. Remainder

If extraction is only partially successful, the priority ordering ensures the most important fields are populated first.

### 5.2 Adding a surgery post-onboarding

**Entry:** From `/patient/{id}/surgeries` → "Add surgery"

**Flow:**
1. Procedure name (free text, with autocomplete suggestions for common lumbar fusion variants).
2. Surgery date.
3. Surgeon (pick from providers, or add new provider inline).
4. Surgical center.
5. Levels fused (free text with structured helper).
6. BLT precautions duration (weeks) — **required**, with note about confirming with surgeon.
7. Brace required? Yes/No → if yes, brace type.
8. Hardware inventory — can be deferred ("I'll add this when I have the op report").
9. Upload op report or discharge summary (optional; can be done later via Document Vault).
10. Save.

**Validation:**
- Surgery date: cannot be in the future; cannot be more than 1 year in the past (sanity check, with override for historical entry).
- BLT precautions duration: 0–52 weeks.

**Edge cases:**
- Surgery entered without hardware: allowed, but a "Hardware inventory incomplete" reminder appears on profile home.
- Surgery with no surgeon in directory: inline "Add new provider" flow.

### 5.3 Adding hardware to a surgery

Deserves its own flow because hardware data is structured JSONB and error-prone.

**Flow:**

Step 1: "How do you want to enter this?"
- Option A: "I have the operative report" → document upload, manual extraction, form pre-fill (Phase A: manual; Phase D+: possibly AI-assisted extraction with explicit user review).
- Option B: "I know the details" → structured form.
- Option C: "I have minimal info" → freeform notes field, structured fields filled where possible.

Step 2: For each implant, capture:
- Type (dropdown: pedicle_screws, rods, cage, sacral_instrumentation, hip_prosthesis, knee_prosthesis, plate, other)
- Count (where applicable)
- Material (dropdown: titanium, titanium_alloy, cobalt_chromium, stainless_steel, ceramic, polyethylene, other, unknown)
- Manufacturer (free text with common-brand autocomplete)
- Model (free text)
- Levels (for spinal hardware)
- Side (for hip/knee)
- Year implanted (for prior implants like existing hip replacements)
- MRI compatibility (dropdown: mri_safe, conditional_1.5T, conditional_1.5T_3T, mri_unsafe, unknown)

Step 3: Review — renders the structured display. User confirms.

Step 4: Save → updates `surgeries.hardware_inventory` AND derives `patients.mri_safety_status` from the most restrictive implant status.

**Edge cases:**
- Prior hip replacement from 2019 (pre-app) — entered as a separate "surgery" record with date = 2019, OR as an entry in current surgery's hardware_inventory with `year_implanted: 2019` field. Default: separate surgery record.
- MRI compatibility unknown → derived `mri_safety_status = 'unknown'` and a flag to research later.
- User adds conflicting entries (e.g., two "left hip prosthesis" entries) → warning, but not blocked (could be revision surgery).

### 5.4 MPA activation

**Entry:** Sister notices Rick is confused, or during an ER event, or the surgeon determines incapacity.

**Flow:**

1. Sister navigates to MPA status screen → "Upload capacity determination."
2. Screen explains requirements: document must be signed by an MD/DO/NP/PA; must state patient is incapacitated; should state scope (global vs. specific) and duration (temporary vs. until reversed).
3. Upload document to Document Vault (tagged as `capacity_determination`).
4. Fill in form:
   - Determining clinician name and credentials.
   - Determination date.
   - Scope (dropdown).
   - Effective from/until.
   - Notes.
5. Review step.
6. Confirm → atomic transaction:
   - Insert `capacity_determinations` row.
   - Set `patients.mpa_active = TRUE`.
   - Set `patients.mpa_activated_at = NOW()`.
   - Set `patients.mpa_activated_by_clinician_note_id` to the capacity determination ID.
   - Insert `audit_log` entries for all three.
   - Send notifications to all stakeholders (Rick, Linda, Sister, Ben).
7. Home screen MPA indicator flips from green "inactive" to orange "active."

**Guardrails:**
- Cannot activate without the document upload.
- Cannot backdate the effective_from beyond 30 days without a warning.
- Other family members see a notification: "MPA has been activated by Sister. Supporting document: [link]. If you believe this was in error, contact [surgeon's office] or [app admin=Ben]."

**Deactivation:**
- Similar workflow but simpler: clinician notes capacity restored, document uploaded, MPA flipped back to inactive.

### 5.5 Generating the ER handoff PDF

**Entry:** Any of:
- Profile home "Generate ER PDF" button
- Fall event workflow (Module 07) auto-offers handoff
- Escalation workflow (Module 04) offers handoff
- Settings → Emergency preparedness → "Preview ER handoff"

**Flow:**

1. Review step shows what will be included (see section 4.6).
2. User taps "Generate PDF."
3. Client-side `react-pdf` generates the document. Data fetched in a single transaction from:
   - patients, surgeries, diagnoses, allergies, comorbidities, emergency_contacts, capacity_determinations
   - active medications (from Module 02)
   - last 7 days of vitals (from Module 03)
   - last 7 days of symptom_logs (from Module 03)
   - all active providers (from Module 08)
4. PDF renders in about 1–2 seconds.
5. Share sheet opens (native OS).

**PDF structure (one page, if possible):**

```
┌──────────────────────────────────────────────┐
│  Rick Whitman          DOB 04/15/1948 (77)  │
│  [emergency contact phones]                  │
│  [MPA status]                                │
├──────────────────────────────────────────────┤
│  ⚠ ALLERGIES                                │
│  Penicillin (anaphylaxis)                    │
│  Sulfa (rash)                                │
├──────────────────────────────────────────────┤
│  ACTIVE DIAGNOSES                            │
│  • Status post L1-L5 fusion + sacral        │
│    instrumentation (03/12/2026)              │
│  • Two small pulmonary emboli (03/20/2026)  │
│  • Pneumonia (03/20/2026, on antibiotics)   │
│  • s/p bilateral total hip arthroplasty      │
│    (2019)                                    │
│  • Sepsis history (details attached)         │
├──────────────────────────────────────────────┤
│  CURRENT MEDICATIONS                         │
│  • Apixaban 5 mg BID — last: 8:04 AM today  │
│  • Levofloxacin 750 mg daily — last: 9:00   │
│  • Oxycodone 5 mg Q4H PRN — last: 6:30 AM   │
│  • [full list]                               │
├──────────────────────────────────────────────┤
│  SURGICAL HARDWARE                           │
│  • Pedicle screws L1-L5 (10, titanium)      │
│  • Rods (2, titanium)                        │
│  • Sacral instrumentation (Stryker, cond.   │
│    1.5T MRI)                                 │
│  • Bilateral hip prostheses (Zimmer, CoCr,  │
│    2019)                                     │
│  MRI: conditional 1.5T only                  │
├──────────────────────────────────────────────┤
│  RECENT VITALS (last 24 hours)              │
│  BP 128/78, HR 92, Temp 100.2°F, SpO2 93%,  │
│  RR 20, Pain 4/10                            │
│                                              │
│  ORTHOSTATIC (morning): 132/80 → 118/72 →   │
│  110/70 (−22 mmHg standing drop)            │
├──────────────────────────────────────────────┤
│  RECENT EVENTS                               │
│  • 03/19/2026: Fall at home, no LOC,         │
│    foot weakness resolved over 30 min.       │
│    PE diagnosed next day.                    │
├──────────────────────────────────────────────┤
│  PROVIDERS                                   │
│  Surgeon: Dr. [X] — [phone]                  │
│  PCP: Dr. [Y] — [phone]                      │
│  Pulm: Dr. [Z] — [phone]                     │
├──────────────────────────────────────────────┤
│  CODE STATUS: Full code                      │
│  ADVANCE DIRECTIVE: On file, durable POA     │
│  MPA: [Sister's name] — [phone]              │
│       Currently INACTIVE                     │
├──────────────────────────────────────────────┤
│  Generated: 04/19/2026 3:14 PM              │
│  Source: Rick & Linda Care Coordination App │
└──────────────────────────────────────────────┘
```

One page if possible — the ER doc will look at it for 15 seconds.

**Edge cases:**
- If the PDF would exceed one page, prioritize allergies + hardware + meds on page 1; push historical context to page 2.
- If offline, still works — all data is cached.
- If PDF generation fails, fall back to a plain-text email version.

### 5.6 Diagnosis reconciliation

**Entry:** Sister uploads discharge summary to Document Vault → system flags "Discharge summary received. Review diagnoses?"

**Flow:**

1. Split-screen view: current diagnosis list on left, diagnoses mentioned in discharge summary on right (manually extracted by Sister — Phase A has no AI extraction).
2. For each discharge diagnosis, Sister can:
   - Match to existing (links them)
   - Add as new
   - Mark as duplicate/already captured
3. Any currently-active diagnosis not mentioned in the discharge summary is flagged: "Still active? Resolved?"
4. Reconciliation is saved with a timestamp and the source document ID.

This workflow closes the "Linda wasn't at discharge" gap structurally — every diagnosis has a documented source.

---

## 6. Business Rules

### 6.1 Household and patient constraints

- Each household has exactly one primary patient at a time.
- A household can have up to two patients total (primary + secondary). Rick is primary; Linda could be added as secondary if she wants her own back-surgery recovery tracked here.
- A patient must have at least one provider (the surgeon or PCP) before any clinical events can be logged.

### 6.2 MPA rules

- `mpa_active` defaults to FALSE at patient creation.
- `mpa_active` can only be flipped to TRUE via the activation workflow (requires a `capacity_determinations` row with a document attached).
- `mpa_active` can be flipped to FALSE either via the deactivation workflow or by `effective_until` timestamp passing.
- No user can directly UPDATE `mpa_active` — only the activation/deactivation Edge Functions can.
- MPA activation triggers notifications to all stakeholders with full-access roles.

### 6.3 Allergy rules

- Life-threatening allergies are always displayed prominently (header of ER handoff, top of dashboard).
- When a medication is added (Module 02), the system checks the drug name (and drug class where mapped) against active allergies and warns.
- Allergies are never auto-deactivated. Explicit user action required.

### 6.4 BLT precautions

- Surgery record requires `blt_precautions_duration_weeks`.
- Derived field: `blt_lift_date = surgery_date + blt_precautions_duration_weeks * 7 days`.
- Precautions are "active" until the derived lift date AND until a surgeon-clearance note is uploaded (a surgeon must affirmatively lift them — the date alone is an estimate).
- Dashboard shows "BLT active until ~[date], pending MD clearance" to reinforce that the date is an estimate.

### 6.5 Hardware and MRI safety

- `patients.mri_safety_status` is derived automatically from the hardware inventory: the most restrictive compatibility across all implants wins.
- If any implant is `mri_unsafe`, patient is `mri_unsafe`.
- If any is `conditional_1.5T`, patient is at best `conditional_1.5T`.
- If all are `mri_safe`, patient is `mri_safe`.
- If any is `unknown`, patient is `unknown`.
- This surfaces on the ER handoff to warn imaging teams.

### 6.6 Code status

- Defaults to `unknown` if not explicitly captured.
- A code status change (e.g., from full_code to DNR) requires a supporting document (MOLST/POLST, advance directive revision) — same pattern as MPA.

### 6.7 Audit

- Every mutation on any Module 01 table writes to `audit_log`.
- Profile views of specific documents (advance directive, capacity determination, insurance card) are audited.
- Demographics views are not audited (too noisy; no clinical value).

---

## 7. Validation Rules

Comprehensive list. All enforced client-side (Zod schemas) AND server-side (PostgreSQL constraints, triggers where needed).

### Patient
- `legal_name`: 1–100 chars, no all-whitespace.
- `preferred_name`: 0–50 chars.
- `date_of_birth`: between 1900-01-01 and today.
- `biological_sex`: enum.
- `height_cm`: 30–250.
- `baseline_weight_kg`: 1–300.
- `primary_language`: valid ISO 639-1 code.

### Surgery
- `procedure_name`: 3–200 chars.
- `surgery_date`: between 1950-01-01 and today + 180 days (schedule-ahead allowed).
- `blt_precautions_duration_weeks`: 0–52.
- `hardware_inventory`: valid per JSONB schema (Zod schema defined).

### Allergy
- `allergen`: 1–100 chars.
- `severity`: enum, required.
- `allergen_type`: enum, required.

### Capacity determination
- `determined_by_credentials`: must be one of MD/DO/NP/PA.
- `supporting_document_id`: required, must exist.
- `effective_from`: not more than 30 days in the past (with override flag for historical entry).

### Emergency contact
- `name`: 1–100 chars.
- `phone_primary`: validated E.164 format.
- `priority_order`: 1 or greater, unique per patient.

### Insurance
- `payer_name`: 1–100 chars.
- `member_id`: 1–50 chars, required.
- Card documents are optional but recommended.

---

## 8. Edge Cases & Error States

### 8.1 Missing data

| Scenario | Handling |
|---|---|
| Patient has no surgeon assigned | ER handoff still generates; "Surgeon: not on file" displayed |
| Surgery without hardware details | Profile home surfaces "Hardware inventory incomplete" reminder |
| No allergies recorded | Display "No known allergies" — distinguishes from "not yet captured" |
| No emergency contacts | Onboarding requires at least one; post-onboarding deletion of last one is blocked |
| No MPA holder on file | Allowed; ER handoff shows "Not on file" |
| No code status | Displays "Not documented" and prompts user to capture |

### 8.2 Data conflicts

| Scenario | Handling |
|---|---|
| Two users enter conflicting allergy info | Both entries stored; later entry is primary; earlier shown as "previously reported by [user]" |
| Sister edits an entry Linda created | Sister CANNOT edit it (RLS denies); she creates a new entry with a `references_entry_id` pointing to Linda's. Display shows both. |
| Diagnosis listed as active in app but resolved per discharge summary | Reconciliation workflow surfaces mismatch; user confirms resolution |
| Hardware inventory conflicts with operative report | Op report wins; reconciliation prompt |

### 8.3 MPA edge cases

| Scenario | Handling |
|---|---|
| Sister tries to activate MPA without capacity determination | Blocked; UI explains what's needed |
| Rick is unconscious; no capacity determination exists yet | ER workflow: "Sister, you should activate MPA. To do so, get a capacity determination from the treating physician and upload it here. In the meantime, the ER team has documented capacity themselves." |
| Capacity determination scope is "temporary" and expires | Automatic deactivation when `effective_until` passes; notification to all stakeholders |
| Rick wakes up and is capacitated again but MPA is still active | Deactivation workflow; any stakeholder can flag for deactivation; requires a clinician note |

### 8.4 Privacy edge cases

| Scenario | Handling |
|---|---|
| Paid aide accidentally sees advance directive | Blocked by RLS; direct URL access returns 403 |
| ER handoff is shared with unintended party | PDF itself has no more than patient-authorized data; user education in the share flow ("This PDF contains medical info; share only with providers") |
| Rick wants to hide a specific diagnosis from Sister | Not supported in Phase A. Rick has full read; he cannot selectively hide. Flag as product decision for Phase B if needed. |

---

## 9. Integration Points

### Reads from this module

- Module 02 (Medications): patient demographics, allergies, active diagnoses for interaction/contraindication checks.
- Module 03 (Vitals): patient baseline values (height, weight for dosing calcs).
- Module 04 (Red-Flag Escalation): active diagnoses, fall history count, MPA status.
- Module 05 (Respiratory/PE/Anticoag): active diagnoses (PE, pneumonia, sepsis history).
- Module 07 (Fall Prevention): fall history count, BLT active status.
- Module 08 (Care Team): full provider list.
- Module 10 (Rick's Co-Management): patient demographics, MPA status.
- Module 13 (Document Vault): surgeries reference document IDs; reconciliation writes back.
- Module 14 (Phase Tracker): surgery date, BLT precaution duration.
- Module 15 (ER Handoff): everything.
- Module 17 (Role Clarification): patient identity, MPA holder, MPA active state.

### Writes from other modules

- Module 04: on escalation event → may add a diagnosis with provenance "from escalation [id]".
- Module 13: on document reconciliation → may add/update diagnoses, surgeries, providers, pharmacies.
- Module 07: on fall event → may add fall_history entry.

---

## 10. Acceptance Criteria

Format: `AC-01-XXX: [Given] ... [When] ... [Then] ...`

### Core profile

- **AC-01-001:** Given a new household, when a primary patient is created with legal name + DOB + biological sex, then the patient record persists with all fields.
- **AC-01-002:** Given a primary patient exists, when another user attempts to create a second primary patient in the same household, then the operation is rejected with a clear error.
- **AC-01-003:** Given a patient record, when the profile home is rendered, then active diagnoses, allergies (severity-sorted), and BLT status are all visible within the first viewport on a 375px screen.

### Surgery and hardware

- **AC-01-010:** Given a surgery is entered with hardware inventory containing one MRI-unsafe implant, then `patients.mri_safety_status` auto-updates to `mri_unsafe`.
- **AC-01-011:** Given multiple implants with mixed MRI ratings, then the most restrictive status is applied to the patient.
- **AC-01-012:** Given a surgery with BLT duration of 12 weeks and surgery_date of 03/12/2026, then the dashboard shows `blt_lift_date` as 06/04/2026 with "pending MD clearance."
- **AC-01-013:** Given a surgery record, when hardware inventory is entered via the structured form, then the JSONB is valid per the hardware schema.

### Allergies

- **AC-01-020:** Given an allergy with severity `life_threatening`, when the ER handoff PDF is generated, then the allergy appears in the top section with a warning icon.
- **AC-01-021:** Given an active allergy to penicillin, when Module 02 attempts to add penicillin as a medication, then a warning is shown before save.
- **AC-01-022:** Given a patient with no allergies recorded, the UI shows "No known allergies" (not blank) to distinguish from uncaptured state.

### MPA

- **AC-01-030:** Given a patient exists, `mpa_active` defaults to FALSE at creation.
- **AC-01-031:** Given Sister attempts to toggle `mpa_active` without uploading a capacity determination, the operation is rejected.
- **AC-01-032:** Given a capacity determination is uploaded with a signed clinician note, Sister can activate MPA and all stakeholders receive a notification.
- **AC-01-033:** Given MPA has been activated with `effective_until` set to a past timestamp, then on next check the system auto-deactivates and logs the event.
- **AC-01-034:** Given MPA is active, the dashboard indicator is orange and visible to all stakeholders.

### ER handoff

- **AC-01-040:** Given a patient with complete profile data, when ER handoff is generated, the PDF fits on one page.
- **AC-01-041:** Given the app is offline, ER handoff generation still succeeds using cached data.
- **AC-01-042:** Given an ER handoff is generated, the audit log records the event with actor, timestamp, and patient.
- **AC-01-043:** Given insurance toggle is off (default), the generated PDF contains no insurance details.
- **AC-01-044:** Given a life-threatening allergy exists, it appears in the PDF within the first 1/3 of the first page.

### Role enforcement

- **AC-01-050:** Given Linda has `primary_caregiver` role, she can read full profile; she can insert/update her own entries but not edit Sister's.
- **AC-01-051:** Given a paid aide has shift-scoped access, they can see patient name, emergency contacts, and allergies; attempts to access insurance or advance directive return 403.
- **AC-01-052:** Given Rick's role is `patient_self`, he can see all his own clinical data but can only edit his own entries.

### Audit

- **AC-01-060:** Given any mutation on any Module 01 table, an `audit_log` entry is created with before/after snapshots.
- **AC-01-061:** Given a user views the advance directive document, an audit entry is created.
- **AC-01-062:** Given the audit view is rendered, entries display timestamp, actor, entity, and action type; sensitive field values are redacted.

### Onboarding

- **AC-01-070:** Given a fresh account, onboarding requires household name + primary patient basics + at least one emergency contact + allergy acknowledgment.
- **AC-01-071:** Given a user abandons onboarding mid-flow, progress persists in IndexedDB and resumes on next load.
- **AC-01-072:** Given onboarding completes, the user lands on the profile home with "Next steps" prompts for deferred sections.

---

## 11. Open Questions

1. **Allergy drug-class mapping.** For medication-allergy cross-checking (AC-01-021), do we need to map drug classes (all beta-lactams when penicillin is the allergy)? Phase A recommendation: free-text name match only, with surgeon-office confirmation for add. Phase B: drug class mapping via RxNorm or similar.

2. **Secondary patient (Linda's own record).** Should we support Linda as a secondary patient in the same household from day one, or defer? Phase A recommendation: support secondary patient data model and role (she's already in the design), but UI for her profile can be lighter in Phase A (basic demographics, her own meds, her own back-surgery record) and expand in Phase B.

3. **Onboarding AI assist.** Should Phase A include AI-assisted data entry (paste discharge summary, app extracts)? Given the privacy posture and the cost of getting it wrong, Phase A recommendation: NO AI. All manual entry. Revisit in Phase C with explicit controls and review workflow.

4. **Photo of patient.** Helpful for aides and ER context? Currently in the data model as `avatar_url` on `users_profile`, not on `patients`. Recommend: add `photo_document_id` to `patients` for a patient photo separate from user avatar.

5. **"Second opinion" handling.** What if the patient is seeing multiple surgeons for the same condition, with conflicting recommendations? Data model accommodates multiple providers; UI does not yet explicitly surface conflicts. Deferred to a later phase.

6. **Historical surgery detail level.** Rick has bilateral hip replacements from 2019. How much detail do we capture? Phase A recommendation: enough to populate MRI safety and hardware inventory; detailed op report is optional.

---

## 12. Delivery Notes for Claude Code

**Stack (pinned per `technical_foundation.md` v1.1):** React 19 + Vite 7 + TypeScript strict + Tailwind v4 (via `@tailwindcss/vite`) + shadcn/ui + Radix + Lucide. Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions). TanStack Query + Zustand + React Hook Form + Zod. Vitest + Playwright. No PostCSS in the dev stack; `tw-animate-css` replaces the deprecated `tailwindcss-animate`. Exact version pins are in `postopcare_scaffold_reset.md`.

**Suggested build order:**

1. **Schema migrations first.** All tables, indexes, enums, RLS policies. One migration per table for reviewability. Includes the `care_log` table (see §15.7) which Module 01 owns.
2. **TypeScript types** generated from the schema (via `supabase gen types`).
3. **Zod schemas** for forms, mirroring the validation rules section.
4. **Data access layer** — TanStack Query hooks for CRUD operations on each entity. Includes the `useCareLog` store hook (§15.7) — this is load-bearing across every module, so it must be solid before any write-affordance code is written.
5. **Shared components and design tokens** — implement per `rick_care_app_module_01_design_system_contract.md`. Category tints as CSS variables in `globals.css`; shadcn components copied in and themed; canonical components (HeroCard, CategoryCard, TimelineItem, VitalsTile, AllergyRow, Sheet, ScreenHeader, RecoveryRing, SectionLabel) built and tested.
6. **Screens per Claude Design handoff bundle.** High-fidelity priorities first (Today → Profile home → Surgery detail → Allergies → MPA status → ER handoff). Wireframe-fidelity screens can be implemented with functional-but-plain layouts for Phase A.
7. **ER handoff** last, because it aggregates everything.
8. **Workflows** (onboarding three on-ramps, MPA activation, diagnosis reconciliation) after screens exist.

**Each step should ship with:**
- Unit tests for validation logic
- Component tests for new UI components (matching the Design System Contract specs)
- Integration tests for RLS enforcement across all five stakeholder roles
- E2E tests for the acceptance criteria covering that slice
- Storybook stories for components (if using Storybook — recommended but optional)

**Estimated effort (Claude Code-assisted):** Phase A portion of Module 01 — about 2–3 weeks of focused evening work, assuming 10 hours/week.

---

## 13. References

- Outline v0.3 (product spec)
- Technical Foundation v1.0
- Coordinator Agent Instructions v1.0
- NAON Spinal Fusion Best Practice Guideline (2022) — for clinical field defaults
- AHA/ACC 2026 PE Guideline — for diagnosis data model (CTEPD, etc.)
- AHRQ MATCH Toolkit — for reconciliation patterns

---

## 14. Multi-Agent Build Instructions

This module will be built by an **Implementation Agent (IA)** working with a **Coordinator Agent (CA)** under human oversight (Ben). This section tells the IA how to operate.

### 14.1 Agent roles in this build

- **Implementation Agent (IA):** The agent Ben hands this spec to (typically Claude Code in a local repo, or a scoped conversation with the same). Writes migrations, types, components, tests, and wiring. Owns code output. This is you, if you're reading this as an IA.
- **Coordinator Agent (CA):** A separate agent running with the Coordinator Agent Instructions document as its system prompt. Reviews plans before build, reviews output at gates, detects drift from the foundation and prior modules, arbitrates disputes between IAs working on different modules. Does NOT write code.
- **Human (Ben):** Final authority. Approves plans, approves gates, resolves escalations that CA can't arbitrate. Does not micromanage.

The IA and CA operate adversarially by design, in the spirit of TDD-with-review: the IA proposes, the CA challenges, the human decides. Neither agent is subordinate to the other; they have different jobs.

### 14.2 Mandatory pre-work (before writing any code)

Before producing a single migration or component, the IA must:

1. **Read in full:** Outline v0.3, Technical Foundation v1.0, this Module 01 spec, the Coordinator Agent Instructions.
2. **Verify the repo state:** Does the foundation already exist (auth, base tables, RLS scaffolding)? If not, the IA's first job is foundation setup — flag this to the human before proceeding.
3. **Produce a Build Plan document** at `docs/build-plans/module-01-plan.md`. Structure:
   - Ordered list of deliverable slices (migrations, types, components, screens, workflows, tests)
   - For each slice: estimated LOC, dependencies on other slices, test count target
   - Open questions the IA has about this spec (quote the ambiguous text, propose a resolution)
   - Assumptions the IA is making that aren't explicit in the spec
   - Deviations from this spec the IA proposes, with justification
4. **Submit the Build Plan to the CA for gate review.** Do not proceed to code until the CA has reviewed and the human has approved.

**If the IA finds ambiguity or missing information, the IA writes a question to `docs/decisions/module-01-questions.md` and flags the human. The IA does NOT guess.** Guessing on a foundational module corrupts every downstream module.

### 14.3 Build phases and gates

Module 01 builds in seven phases. The CA gates between each.

| Phase | Deliverable | CA Gate Focus | Human gate? |
|---|---|---|---|
| 1. Schema migrations | SQL migrations for all tables in §3 plus `care_log` (§15.7), one file per table | Naming conventions, RLS enabled on every table, FK integrity, audit triggers | No (CA-only if clean) |
| 2. Types & schemas | TS types (via `supabase gen types`), Zod schemas for all forms and API boundaries, typed `CareLogDetail` extensions per kind | Type fidelity to schema, Zod validation matches §7 validation rules | No |
| 3. Data access layer | TanStack Query hooks for CRUD on each entity, `useCareLog` store hook, optimistic updates, Realtime subscriptions, RLS-aware error handling | Query keys consistent, invalidation correct, `useCareLog` contract (§15.7) fully honored | No |
| 4. Design tokens & shared components | Category tints as CSS variables, shadcn/ui theming, canonical components per `rick_care_app_module_01_design_system_contract.md` (HeroCard, CategoryCard, TimelineItem, VitalsTile, AllergyRow, Sheet, ScreenHeader, RecoveryRing, SectionLabel, TimestampedEntry, MPAStatusIndicator) | Match Design System Contract precisely; component accessibility (WCAG AA for caregiver views, AAA for Rick's view); Storybook coverage if enabled | No |
| 5. Screens (via Claude Design handoff) | Priority high-fidelity screens + wireframe-fidelity screens per §4.3; every screen correct under all 5 stakeholder views | Matches Claude Design handoff bundle; role-based divergence correct; no component duplication; responsive 375px / 1024px / 1280px | **Yes (design handoff sign-off — see §14.6)** |
| 6. Workflows | Three on-ramps onboarding (§5.1), MPA activation, diagnosis reconciliation, ER handoff generation, record verify/edit loop | Workflow logic matches §5 step-by-step, edge cases from §8 handled, `useCareLog` entries correct for every mutation | **Yes** |
| 7. Tests | All acceptance criteria from §10 covered by E2E tests; unit + integration tests for all logic; RLS policy tests across all 5 roles | AC-to-test mapping, test independence, RLS policy tests pass for all role combinations, `useCareLog` attribution verified on every write path | **Yes (final sign-off)** |

At each gate, the IA must present to the CA:
- What was built
- Test results (all passing)
- Any deviations from the Build Plan
- Any new questions or assumptions
- The proposed next phase

### 14.4 Definition of Done for Module 01

All of the following must be true:

- [ ] Every table in §3 exists with the exact schema specified (no additional columns not called out in the spec; no missing columns)
- [ ] RLS enabled on every table; policies match the role capability matrix in the foundation
- [ ] All TypeScript types generated and no `any` types introduced
- [ ] All Zod schemas match §7 validation rules
- [ ] All screens in §4.1 render on both 375px mobile and 1280px desktop viewports
- [ ] All workflows in §5 complete successfully with the inputs specified
- [ ] All acceptance criteria in §10 have corresponding passing tests (each AC maps to at least one test; tests name the AC ID in a comment or test title)
- [ ] Offline write queue works for all mutations in this module
- [ ] Audit log entries exist for all mutations and for sensitive document views
- [ ] No console errors, no TypeScript errors, no failing tests
- [ ] CA has signed off
- [ ] Human has approved

### 14.5 How the IA handles ambiguity and disagreement

**When the spec is unclear:** write the question to `docs/decisions/module-01-questions.md` using the template:

```markdown
## Q{N}: [short topic]

**Ambiguity:** [quote or paraphrase the ambiguous spec text]

**Options considered:**
1. [option 1] — implication: ...
2. [option 2] — implication: ...

**IA recommendation:** [option N], because [reasoning]

**Status:** awaiting human decision
```

The CA reviews questions; the human decides. The decision is recorded, and the spec is updated if the decision materially changes the module.

**When the IA disagrees with the spec:** The IA may propose a change. Same document format, different header (`Proposed deviation`). The CA weighs the proposal against the foundation, the product spec, and downstream module implications. If the CA and IA disagree, the human arbitrates.

**What the IA does NOT do:**
- Silently deviate from the spec
- Assume a change in one spec section propagates to others without flagging
- Modify the technical foundation without CA review and human approval
- Delete or refactor code from other modules without CA approval

### 14.6 Dependencies on design artifacts

Module 01 screens require design approval before Phase 5 (Screens). The design work is done in **Claude Design** (claude.ai/design), which produces:

- A design system (colors, typography, spacing, components) persisted in the Claude Design project
- High-fidelity screens for the priority 5 screens (profile home, surgery detail, allergies, MPA status, ER handoff), wireframe-fidelity for the rest
- An interactive prototype with mock data and stakeholder-switcher
- **A Claude Code handoff bundle** that the IA receives with a single instruction

The Design Workflow Guide (v2.0) describes the sessions. The human approves the design in Claude Design, then generates the handoff bundle and passes it to the IA.

If Claude Design is unavailable for any reason, the fallback is the v1.0 manual workflow producing a design package committed to `docs/design/` — see Design Workflow Guide §9.

If the design approval is not yet complete, the IA can proceed through Phases 1–4 (which are presentation-agnostic) and halt at the Phase 4/5 gate until design is approved.

### 14.7 Context management for long builds

Module 01 will likely exceed a single Claude Code context window. The IA's practices:

- **Commit often.** Every slice should be a reviewable commit with a clear message.
- **Use the repo as persistent memory.** Decisions documents, build plan progress, test results — all in `docs/`.
- **Before context boundary:** produce a `handoff.md` summarizing what's done, what's next, open questions. Any new IA session starts by reading this.
- **Coordinator Agent session is separate.** The CA runs in its own conversation; it is not part of the IA's context.

---

## 15. Integration Contracts (what Module 01 promises to other modules)

Module 01 is the foundation that every other module reads from. These contracts are the external-facing API of the module; they must not change without coordinator review and updates to dependent modules.

### 15.1 Patient identity contract (consumed by every module)

Every other module accesses a patient through:

```typescript
type Patient = {
  id: string;  // UUID, stable, never changes
  household_id: string;
  legal_name: string;
  preferred_name: string | null;
  date_of_birth: string;  // ISO date
  biological_sex: 'male' | 'female' | 'intersex' | 'unknown';
  height_cm: number | null;
  baseline_weight_kg: number | null;
  is_primary_patient: boolean;
  mri_safety_status: 'mri_safe' | 'mri_conditional' | 'mri_unsafe' | 'unknown';
  code_status: 'full_code' | 'dnr' | 'dni' | 'dnr_dni' | 'comfort_only' | 'unknown';
  mpa_active: boolean;
  mpa_holder_user_id: string | null;
  mpa_holder_legal_name: string | null;
};
```

This shape is stable. Fields may be added; existing fields' types must not change.

### 15.2 Diagnosis contract (consumed by Modules 04, 05, 15)

Module 04 (Red-flag) and Module 05 (Respiratory/PE/Anticoag) read active diagnoses by tag:

```typescript
// Provided utility
function getActiveDiagnoses(patientId: string): Promise<Diagnosis[]>;
function hasActiveDiagnosis(patientId: string, matcher: string | RegExp): Promise<boolean>;

// Diagnosis shape:
type Diagnosis = {
  id: string;
  diagnosis_name: string;  // canonical, free text
  icd10_code: string | null;
  diagnosed_date: string | null;
  active: boolean;
  resolution_date: string | null;
};
```

**Diagnosis naming conventions** (Module 01 enforces; downstream modules rely on):
- PE: contains the string "pulmonary embolism" or "PE" with diagnosis_category = 'pulmonary'
- Pneumonia: contains "pneumonia"
- Sepsis history: stored with `active = false, resolution_date = past_date` but flagged in a `historical_severe_conditions` JSONB field on patients for fast lookup
- Fall history: separate table (`fall_history`), not `diagnoses`

### 15.3 Allergy contract (consumed by Module 02)

Module 02 (Medications) checks every new medication against allergies. The check function lives here:

```typescript
function checkMedicationAgainstAllergies(
  patientId: string,
  drugName: string,
  drugClass?: string
): Promise<{ matchingAllergies: Allergy[]; severity: AllergySeverity }>;
```

Phase A implementation: free-text name match only. Phase B: drug class mapping.

### 15.4 MPA status contract (consumed by Module 17)

Module 17 (Role Clarification) displays MPA status but does NOT toggle it. The toggle Edge Function lives in Module 01:

```typescript
// Module 01 Edge Function
POST /api/mpa/activate
  body: { patient_id, capacity_determination_id }
  returns: { success, new_state }

POST /api/mpa/deactivate
  body: { patient_id, reason, supporting_document_id? }
  returns: { success, new_state }
```

Module 17 calls these functions but does not implement MPA state directly.

### 15.5 Hardware/MRI safety contract (consumed by Module 15 ER handoff)

Module 15 reads `patients.mri_safety_status` as a derived, always-current field. The derivation logic lives in Module 01 as a PostgreSQL trigger on `surgeries.hardware_inventory` changes. Module 15 does not recompute.

### 15.6 ER Handoff contract

The ER handoff PDF generator is a Module 01 component (`ERHandoffGenerator`) that accepts a patient_id and produces a PDF. It pulls data from every relevant module through typed query functions, NOT by reading tables directly. Each module that contributes data to the ER handoff exposes a typed `getERHandoffData(patientId)` function.

Contributing modules:
- Module 02: current medications + last-taken timestamps
- Module 03: recent vitals (last 24 hours) + recent symptoms (last 7 days)
- Module 04: recent escalation events (last 7 days)
- Module 07: recent fall events (last 30 days)
- Module 08: active providers

Module 01 owns the composition and the PDF rendering; modules own their data contributions.

### 15.7 useCareLog universal write-store contract (consumed by every module with write affordances)

Every write in the app — med taken, vitals logged, check-in completed, fall logged, symptom reported, allergy added, diagnosis edited, document uploaded, MPA activated — flows through a single attribution-aware store hook. Module 01 owns this store; every other module consumes it.

```typescript
// Module 01 exposes:
function useCareLog(): {
  log: CareLogEntry[];           // ordered newest-first
  append: (entry: CareLogAppendInput) => Promise<CareLogEntry>;
  lastOf: (kind: CareLogKind, matcher?: Partial<CareLogDetail>) => CareLogEntry | null;
  subscribe: (kind: CareLogKind, cb: (entry: CareLogEntry) => void) => () => void;
};

type CareLogKind =
  | 'med'          // medication action: taken, skipped, refused
  | 'vitals'       // BP, HR, SpO2, temp, RR, pain
  | 'checkin'      // 30-second patient-felt check-in
  | 'fall'         // fall event logged
  | 'symptom'      // symptom reported
  | 'record_edit'  // allergy / diagnosis / provider / hardware added or modified
  | 'document'    // document uploaded or attached
  | 'mpa';         // MPA activated or deactivated (sensitive; tighter RLS)

type CareLogEntry = {
  id: string;          // UUID
  kind: CareLogKind;
  by: string;          // actor user_id; resolved to stakeholder role + display name on read
  ts: string;          // ISO timestamp
  detail: Record<string, unknown>;  // kind-specific; typed per kind in Module 02–17 extensions
  patient_id: string;
  household_id: string;
};
```

**Invariants the IA must preserve:**
- Every write in every module appends a `CareLogEntry`. No silent writes.
- Attribution is required. An entry without a `by` user_id is invalid.
- Entries are append-only. Corrections require a new entry with a `corrects` detail field; never in-place edits.
- Real-time subscriptions route through Supabase Realtime; UI auto-refreshes within 500ms on new entries.
- The store is the foundation of Module 07 (Activity feed), Module 17 (Audit trail), and Module 03 (Alerts — which reads the log to detect missed-dose / overdue conditions).

**Why this lives in Module 01:** the data-access pattern is load-bearing across the app and must be defined before Module 02 (Medications) starts writing. The IA implements the base hook and `care_log` table in Module 01 Phase 3 (Data Access Layer). Extending modules add typed `detail` schemas per `kind`.

### 15.8 Design system contract (consumed by every module)

Every module renders through the shared component contracts and design tokens defined in `rick_care_app_module_01_design_system_contract.md`. Module 01 does not own the components at runtime — shadcn/ui primitives and the Tailwind v4 theme own them — but it owns the *contract*: what components exist, what tokens are canonical, what the alert tiers are, what the category tints mean. No module invents new tints, new component patterns, or new alert tiers without a contract change per §15.10.

### 15.9 Stakeholder switcher + role-based view contract (consumed by every module)

The app supports a "View as" stakeholder switcher in development/demo mode and role-based view divergence in production. Every screen in every module must render correctly under five distinct roles (Linda, Rick, Amy, Ben, paid aide). Module 01 defines the role enum and the nav configuration pattern:

```typescript
type Stakeholder = 'linda' | 'rick' | 'amy' | 'ben' | 'aide';

// Per-role nav configuration — the canonical pattern for role-based divergence
// (from Design Guidance §M07)
const NAV_CONFIGS: Record<Stakeholder, NavConfig> = { /* ... */ };
```

Downstream modules extend `NAV_CONFIGS` with their own tabs/routes. No module bypasses the role system to show content for a user who shouldn't see it — enforcement is both at the UI level (conditional rendering) and the RLS level (database-enforced).

### 15.10 Breaking change policy

If any contract in §15 needs to change, the IA:
1. Raises a proposed change in `docs/decisions/contract-changes.md`
2. The CA evaluates impact on all dependent modules
3. If other modules are already built, the IA proposes a migration plan
4. Human approves before change is implemented
5. All dependent modules update in the same PR or in a coordinated stack

No silent contract changes. Ever.
