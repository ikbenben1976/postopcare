# Rick & Linda Care App — Technical Foundation Spec (v1.1)

**Purpose:** Cross-cutting technical architecture that informs every module. This is the foundation layer that sits beneath every module spec. Read this first; module specs reference it.

**Scope:** Stack, data model, authorization, state management, offline strategy, notifications, audit logging, security/privacy, testing, deployment, accessibility, error handling.

**Out of scope for this document:** Module-specific business logic, specific UI screens, specific workflows. Those live in per-module specs.

**Change log:**
- **v1.0 → v1.1:** Stack updated from React 18 → React 19 (stable since Dec 2024, shadcn/ui default in April 2026), Tailwind v3 → v4 (shadcn default since Jan 2026, CSS-first config), Vite 6 → 7 (Node 20.19+ requirement). Dropped PostCSS and autoprefixer from the dev stack — Tailwind v4's `@tailwindcss/vite` plugin replaces them. Deprecated `tailwindcss-animate` replaced by `tw-animate-css`. All exact version pins live in `postopcare_scaffold_reset.md`. §8 (UI Architecture) now delegates component and token specifics to `rick_care_app_module_01_design_system_contract.md` rather than defining a separate component library here.

---

## 1. Goals & Constraints

### Functional goals
- Multi-stakeholder coordination (5 human roles, differentiated access)
- Real-time-ish sync (under ~5 second propagation across devices for critical events)
- Offline-capable data entry with conflict-free sync
- Mobile-first (Linda operates on phone while recovering)
- Document storage and retrieval (discharge summaries, imaging reports)
- Push notifications (critical alerts to multiple stakeholders simultaneously)
- PDF generation (ER handoff, clinician summaries, weekly reports)
- Audit trail (every clinical data point has provenance)

### Non-functional goals
- **Maintainability over cleverness.** Ben builds this while running other ventures; Claude Code will be the primary development driver. Predictable patterns beat optimal ones.
- **Privacy-respecting.** Not formally HIPAA-compliant (household use, no Business Associate Agreements needed), but architected as if it could be. Data encryption in transit and at rest. No third-party analytics. Minimal PII leakage.
- **Low ongoing cost.** Target under $50/month infrastructure at this scale (one household, 5-10 users, modest document storage).
- **Developer-friendly for Claude Code.** TypeScript throughout, strict schemas, clear module boundaries, tests that run fast.

### Hard constraints
- Works on iPhone (Linda's and Rick's likely devices) and Android.
- Works on desktop browser (sister's likely workflow for records aggregation).
- Data export in standard formats (PDF, CSV, JSON) — user should always be able to leave.
- No single point of failure where a missed app action causes clinical harm — the app is a coordinator, not a safety-critical system. Red-flag detection and escalation still require human judgment and are backstopped by phone numbers.

---

## 2. Tech Stack Recommendation

**Recommendation: React/Vite PWA + Supabase + Vercel.**

Reasoning:

- **Frontend: React 19 + Vite 7 + TypeScript (strict).** Matches Ben's existing fluency (PlayUp, DUPR coach, Mile Hi tournament apps). Vite's DX is meaningfully better than CRA for iteration speed. TypeScript strict mode is non-negotiable given the complexity of the domain model — catches a class of errors that would otherwise only surface in testing or production. React 19 chosen over 18 because shadcn/ui defaults to it as of April 2026 and we get native Actions + useActionState for form flows (used in Module 01's onboarding). Exact pinned versions in `postopcare_scaffold_reset.md`.
- **UI: Tailwind v4 + Radix UI primitives + shadcn/ui component patterns + Lucide icons + Inter/JetBrains Mono fonts.** Tailwind is Ben's stated fluency; v4 replaces v3 with CSS-first config via `@theme` directive (no more `tailwind.config.js` for theme tokens) and the `@tailwindcss/vite` plugin (no PostCSS, no autoprefixer). Radix primitives provide accessible unstyled components (critical for WCAG AA/AAA compliance). shadcn gives a predictable copy-paste component library that Claude Code can extend. `tw-animate-css` replaces the deprecated `tailwindcss-animate`.
- **State: TanStack Query (server state) + Zustand (client UI state) + React Hook Form (forms).** Three libraries, clear division of responsibilities. No Redux — overkill for this app size.
- **Backend: Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions).** Single platform for auth, database, file storage, realtime subscriptions, and serverless functions. Cuts integration work ~70% vs. custom Rails + S3 + Pusher. Supabase's Row-Level Security (RLS) handles the complex authorization model cleanly (see section 4). PostgreSQL gives us real relational data modeling.
- **PWA layer: Vite PWA plugin + Workbox.** Service worker for offline, background sync, and push notifications. PWAs on iOS have limitations (push notification support only since iOS 16.4, and only if installed to home screen) — we'll accept this and provide SMS fallback for critical alerts (see section 7).
- **Hosting: Vercel for frontend, Supabase for backend, Cloudflare for DNS/CDN.** All have generous free tiers; total expected monthly cost at this scale is $25–40 (mostly Supabase Pro tier for daily backups, which is non-negotiable for clinical data).
- **PDF generation: react-pdf on the client** for the ER handoff and clinician summaries. No server round-trip needed for most documents. Server-side fallback via Supabase Edge Function with Puppeteer for complex layouts if we need them later.
- **Notifications: native web push (via Supabase function) + Twilio SMS fallback for critical alerts.** Twilio is ~$0.0075/SMS; household-scale volume is trivial.
- **Monitoring: Sentry (frontend errors) + Supabase logs (backend) + a simple uptime monitor.** No analytics tools — privacy posture.

### Alternatives considered and rejected

| Alternative | Why rejected |
|---|---|
| Rails API (since Ben has one) | Adds a whole backend to maintain; Supabase gives us the same capabilities without ops overhead. The existing Rails app serves a different product; no integration benefit. |
| Firebase | Works fine, but NoSQL is a poor fit for this domain — we have real relations (meds → administrations → patients → households). Also locks us into Google ecosystem. |
| Next.js full-stack | Good option, but introduces SSR complexity we don't need (the app is auth-gated from the first screen). Vite PWA is simpler. |
| Native iOS/Android apps | Genuinely better for push notifications on iOS, but 3-5x the development effort. Reevaluate in Phase D if push reliability becomes a clinical issue. |
| No backend (local-only + iCloud/Drive sync) | Fails the multi-stakeholder requirement. Sister isn't co-habitating. |

### Open architectural decisions (flagging for Ben)

1. **Self-hosted Supabase vs. cloud?** Supabase cloud is operationally easier; self-hosted gives full data control. Default recommendation: Supabase cloud, US region. Revisit if sister's MPA + privacy concerns escalate.
2. **Do we want an API layer between client and Supabase?** Current recommendation is no — use Supabase's client SDK directly with RLS policies doing the authorization enforcement. An API layer adds maintenance but gives us more control over data shaping. Default: direct Supabase with RLS; add API layer only if we hit limitations.
3. **Rails integration?** Ben's existing Rails site is unrelated; no integration planned. Revisit if there's a reason to share user accounts.

---

## 3. Data Model

PostgreSQL schema. All tables have `id` (UUID), `created_at`, `updated_at`, `created_by_user_id`, `updated_by_user_id`. Soft-delete via `deleted_at` on most tables (never hard-delete clinical data).

### Core identity tables

```sql
-- Authenticated users (managed by Supabase Auth)
-- We extend auth.users with a profiles table

users_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  phone TEXT,  -- for SMS fallback notifications
  phone_verified BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'America/Denver',
  avatar_url TEXT,
  notification_preferences JSONB DEFAULT '{}',
  -- e.g. { "critical_via": ["push", "sms"], "routine_via": ["push"] }
)

-- A household is the top-level grouping.
-- For this app, there's one household (Rick+Linda), but modeling it
-- properly means the app could serve other families later.
households (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,  -- "Rick & Linda's household"
  created_by_user_id UUID NOT NULL,
)

-- Patients are people being cared for. Rick is the primary.
-- Linda is also a patient (her back surgery). Modeling this explicitly
-- lets the app track her vitals, meds, etc. without hacks.
patients (
  id UUID PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id),
  user_id UUID REFERENCES users_profile(user_id),  -- nullable; not every patient is a user
  legal_name TEXT NOT NULL,
  preferred_name TEXT,
  date_of_birth DATE NOT NULL,
  biological_sex TEXT,  -- for dosing calcs, etc.
  height_cm NUMERIC,
  baseline_weight_kg NUMERIC,
  primary_language TEXT DEFAULT 'en',
  advance_directive_location TEXT,  -- free text
  mpa_holder_user_id UUID REFERENCES users_profile(user_id),
  mpa_holder_legal_name TEXT,  -- in case holder isn't a user
  mpa_holder_phone TEXT,
  mpa_active BOOLEAN DEFAULT FALSE,
  mpa_activated_at TIMESTAMPTZ,
  mpa_activated_by_clinician_note_id UUID,  -- link to documents
  is_primary_patient BOOLEAN DEFAULT FALSE,  -- Rick=true, Linda=false
)

-- Role assignments tie users to patients with specific access scopes.
-- This is THE authorization table.
patient_role_assignments (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  user_id UUID NOT NULL REFERENCES users_profile(user_id),
  role TEXT NOT NULL,
  -- enum: 'patient_self', 'primary_caregiver', 'mpa_holder',
  --       'family_coordinator', 'technical_operator', 'helper',
  --       'paid_aide', 'clinician_readonly'
  granted_by_user_id UUID NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL,
  scope JSONB,  -- optional: task-scoped, time-scoped access for helpers/aides
  revoked_at TIMESTAMPTZ,
)
```

### Clinical data tables

```sql
-- Surgery records (Rick has fusion; Linda has her own back surgery)
surgeries (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  procedure_name TEXT NOT NULL,
  surgery_date DATE NOT NULL,
  surgeon_provider_id UUID REFERENCES providers(id),
  surgical_center TEXT,
  levels_fused TEXT,  -- free text: "L1-L5 plus sacral instrumentation"
  hardware_inventory JSONB,  -- structured list
  blt_precautions_duration_weeks INTEGER,  -- surgeon-specified
  brace_required BOOLEAN,
  brace_type TEXT,
  operative_report_document_id UUID REFERENCES documents(id),
  discharge_summary_document_id UUID REFERENCES documents(id),
  notes TEXT,
)

-- Diagnoses beyond surgery (PE, pneumonia, sepsis history, etc.)
diagnoses (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  diagnosis_name TEXT NOT NULL,
  icd10_code TEXT,
  diagnosed_date DATE,
  diagnosing_provider_id UUID REFERENCES providers(id),
  active BOOLEAN DEFAULT TRUE,
  resolution_date DATE,
  notes TEXT,
  supporting_document_ids UUID[],  -- imaging reports, cultures, etc.
)

-- Medications (master list)
medications (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  drug_name TEXT NOT NULL,  -- generic preferred
  brand_name TEXT,
  dose TEXT NOT NULL,  -- "10 mg" etc.
  route TEXT NOT NULL,  -- 'oral', 'subcutaneous', 'topical', etc.
  frequency_code TEXT NOT NULL,  -- 'BID', 'TID', 'Q4H', 'PRN', 'Q6H', etc.
  schedule_times TIME[],  -- normalized clock times: ['08:00', '20:00']
  purpose TEXT,  -- 'pain', 'anticoagulant', 'antibiotic', 'stool_softener'
  prescriber_provider_id UUID REFERENCES providers(id),
  start_date DATE,
  planned_end_date DATE,  -- for antibiotics, anticoag courses
  actual_end_date DATE,
  administration_type TEXT DEFAULT 'self',  -- 'self', 'assisted', 'supervised'
  high_risk_flags TEXT[],  -- ['anticoagulant', 'opioid', 'fall_risk', 'narrow_therapeutic']
  interaction_notes TEXT,
  pharmacy_id UUID REFERENCES pharmacies(id),
  rx_number TEXT,
  last_refill_date DATE,
  refills_remaining INTEGER,
  discontinued BOOLEAN DEFAULT FALSE,
  discontinued_reason TEXT,
)

-- Medication administrations (each dose given — MAR-style)
medication_administrations (
  id UUID PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES medications(id),
  scheduled_for TIMESTAMPTZ,  -- null for PRN
  given_at TIMESTAMPTZ,
  given_by_user_id UUID REFERENCES users_profile(user_id),
  status TEXT NOT NULL,  -- 'given', 'missed', 'held', 'refused', 'given_late', 'prn_given'
  notes TEXT,
  prn_reason TEXT,  -- why PRN was given, if status='prn_given'
  pain_before_numeric INTEGER CHECK (pain_before_numeric BETWEEN 0 AND 10),
  pain_after_numeric INTEGER CHECK (pain_after_numeric BETWEEN 0 AND 10),
)

-- Vitals (flexible table for many types)
vitals (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  vital_type TEXT NOT NULL,
  -- enum: 'blood_pressure', 'heart_rate', 'temperature', 'spo2',
  --       'respiratory_rate', 'weight', 'orthostatic_bp', 'pain_numeric',
  --       'pain_functional', 'bristol_stool', 'mental_status_check',
  --       'incentive_spirometry_volume', 'sputum_observation',
  --       'sleep_quality'
  measurement_taken_at TIMESTAMPTZ NOT NULL,
  taken_by_user_id UUID NOT NULL REFERENCES users_profile(user_id),
  numeric_value NUMERIC,  -- single value
  numeric_values JSONB,  -- multi-value: { "systolic": 128, "diastolic": 78 }
  text_value TEXT,  -- for qualitative (sputum color, mental status)
  unit TEXT,
  position TEXT,  -- for orthostatic: 'supine', 'sitting', 'standing'
  device_used TEXT,  -- free text
  notes TEXT,
)

-- Symptom logs (what's happening beyond vitals)
symptom_logs (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  logged_at TIMESTAMPTZ NOT NULL,
  logged_by_user_id UUID NOT NULL REFERENCES users_profile(user_id),
  symptom_category TEXT NOT NULL,
  -- enum: 'neuro', 'pulmonary', 'cardiac', 'gi', 'gu', 'musculoskeletal',
  --       'skin_incision', 'bleeding', 'pain', 'mood', 'sleep', 'other'
  description TEXT NOT NULL,
  severity TEXT,  -- 'mild', 'moderate', 'severe'
  duration_minutes INTEGER,
  resolved BOOLEAN,
  escalation_event_id UUID REFERENCES escalation_events(id),
)

-- Incision check (special case — photos + structured)
incision_checks (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  checked_at TIMESTAMPTZ NOT NULL,
  checked_by_user_id UUID NOT NULL REFERENCES users_profile(user_id),
  drainage_present BOOLEAN,
  drainage_color TEXT,
  drainage_volume TEXT,  -- 'none', 'scant', 'small', 'moderate', 'large'
  redness_extent_cm NUMERIC,
  warmth_present BOOLEAN,
  approximated BOOLEAN,
  odor_present BOOLEAN,
  photo_document_ids UUID[],
  concerns TEXT,
)

-- Fall events
fall_events (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  fell_at TIMESTAMPTZ NOT NULL,
  logged_by_user_id UUID NOT NULL,
  location TEXT,
  witnessed_by TEXT[],
  loss_of_consciousness BOOLEAN,
  head_strike BOOLEAN,
  injury_present BOOLEAN,
  injury_description TEXT,
  preceding_activity TEXT,
  preceding_symptoms TEXT,
  last_vitals_snapshot JSONB,  -- auto-captured at event time
  active_medications_snapshot JSONB,  -- auto-captured
  emergency_response TEXT,  -- '911', 'urgent_care', 'surgeon_office', 'watch'
  outcome_notes TEXT,
  escalation_event_id UUID REFERENCES escalation_events(id),
)

-- Escalation events (red-flag engine outputs)
escalation_events (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  triggered_at TIMESTAMPTZ NOT NULL,
  triggered_by_user_id UUID,
  triggered_by_rule TEXT,  -- which rule/threshold fired
  trigger_data JSONB,  -- snapshot of what triggered it
  tier TEXT NOT NULL,  -- '911', 'surgeon_today', 'watch'
  recommended_action TEXT,
  action_taken TEXT,
  action_taken_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  outcome TEXT,
  stakeholders_notified UUID[],
)

-- Walking / activity sessions
activity_sessions (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  activity_type TEXT NOT NULL,  -- 'walk', 'pt_exercise', 'spirometry', 'transfer'
  started_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  distance_feet INTEGER,  -- for walks
  assistive_device TEXT,
  perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10),
  symptoms_during TEXT,
  symptoms_after TEXT,
  completed_by_user_id UUID,
  assisted_by_user_id UUID,
)
```

### Care team tables

```sql
providers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  credentials TEXT,  -- "MD", "NP", "DO", "PT"
  specialty TEXT,
  practice_name TEXT,
  phone TEXT,
  after_hours_phone TEXT,
  fax TEXT,
  email TEXT,
  portal_url TEXT,
  address TEXT,
  notes TEXT,
)

patient_providers (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  role TEXT NOT NULL,  -- 'surgeon', 'pcp', 'pulmonology', 'hematology', etc.
  active BOOLEAN DEFAULT TRUE,
  started_date DATE,
)

pharmacies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
)

appointments (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  location TEXT,
  purpose TEXT,
  prep_notes TEXT,
  outcome_notes TEXT,
  new_orders TEXT,
  follow_up_required BOOLEAN,
  attended_by_user_ids UUID[],
  completed BOOLEAN DEFAULT FALSE,
)
```

### Documents & evidence

```sql
documents (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  document_type TEXT NOT NULL,
  -- 'discharge_summary', 'operative_report', 'imaging_report', 'lab_result',
  -- 'insurance_card', 'advance_directive', 'prescription', 'prior_auth',
  -- 'photo_incision', 'photo_other', 'pt_ot_order', 'home_health_order',
  -- 'clinician_note', 'capacity_determination', 'other'
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,  -- Supabase Storage path
  mime_type TEXT,
  size_bytes INTEGER,
  source_date DATE,  -- when the document was originally generated
  uploaded_by_user_id UUID NOT NULL,
  tags TEXT[],
  reconciled BOOLEAN DEFAULT FALSE,
  reconciliation_notes TEXT,
)

-- Evidence library (guidelines, protocols, references for dispute resolution)
evidence_library_entries (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,  -- 'ERAS 2021', 'CDC STEADI', 'JHM 2022', etc.
  url TEXT,
  summary TEXT,  -- plain-language summary of what the source says
  applies_to_topics TEXT[],  -- tags like 'incentive_spirometry', 'fall_prevention'
  strength_of_evidence TEXT,  -- 'strong', 'moderate', 'mixed', 'weak'
)

-- Disputes / claims log (Module 17c)
dispute_claims (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  raised_by_user_id UUID NOT NULL,
  raised_at TIMESTAMPTZ NOT NULL,
  claim_text TEXT NOT NULL,
  topic_tags TEXT[],
  related_evidence_ids UUID[],
  related_document_ids UUID[],
  resolution_text TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by_user_id UUID,
  action_taken TEXT,  -- 'verified_with_provider', 'updated_care_plan', 'no_action_needed'
)
```

### Tasks & coordination

```sql
tasks (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT,
  -- 'medication_admin', 'vital_check', 'wound_care', 'appointment_prep',
  -- 'document_request', 'provider_call', 'equipment_order', 'general'
  assigned_to_user_id UUID REFERENCES users_profile(user_id),
  assigned_to_role TEXT,  -- if not user-specific, assign to a role
  due_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal',  -- 'critical', 'high', 'normal', 'low'
  lift_required BOOLEAN DEFAULT FALSE,  -- flags Linda-unsafe tasks
  completed_at TIMESTAMPTZ,
  completed_by_user_id UUID,
  completion_notes TEXT,
  source_module TEXT,  -- which module generated this task
)
```

### Audit & notifications

```sql
audit_log (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  actor_user_id UUID,
  action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'view_document', 'export_pdf'
  entity_type TEXT NOT NULL,  -- 'medication', 'vital', 'document', etc.
  entity_id UUID,
  before_snapshot JSONB,
  after_snapshot JSONB,
  ip_address INET,
  user_agent TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
)

notifications (
  id UUID PRIMARY KEY,
  recipient_user_id UUID NOT NULL REFERENCES users_profile(user_id),
  patient_id UUID REFERENCES patients(id),
  notification_type TEXT NOT NULL,  -- 'critical_alert', 'task_due', 'event_logged', 'dispute_raised'
  title TEXT NOT NULL,
  body TEXT,
  deep_link TEXT,  -- in-app route
  delivery_channels TEXT[],  -- ['push', 'sms', 'email']
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
)
```

### Design notes on the data model

- **Soft-delete everywhere.** Clinical data is never hard-deleted. `deleted_at` timestamp, filtered in default queries.
- **JSONB for semi-structured data.** Hardware inventory, vital multi-values, trigger data. Fast to iterate without migrations.
- **UUIDs as primary keys throughout.** Avoids ID collision if we ever need to merge data. Also makes it harder to enumerate clinical records.
- **Timestamps in `TIMESTAMPTZ` (timezone-aware).** Critical because stakeholders are in different time zones (sister not co-habitating).
- **Patient-centric, not user-centric.** Every clinical table references `patient_id`. Users are actors; patients are subjects.
- **Audit everything that matters.** The audit log is queryable but not exposed in default views. Sister can see "who entered this med" when she's reconciling, but the default medication view shows the med, not the person.

---

## 4. Authentication & Authorization

### Authentication
- **Supabase Auth with email + password** as primary. Magic link option for passwordless login.
- **Multi-factor authentication** (TOTP) recommended for all clinical-access accounts (Rick, Linda, Sister, Ben). Optional for helpers/aides.
- **Session timeout:** 30 days for trusted devices with "remember me"; 24 hours otherwise. Sensitive actions (medication changes, document deletions, MPA activation) require re-authentication if session is older than 15 minutes — implemented via Supabase's `re-authenticate()` method.
- **Account recovery:** email-based with additional verification (security question stored at account creation) for Rick, Linda, Sister. Ben is the technical-operator backstop if someone loses access.

### Authorization model

Implemented via Supabase Row-Level Security (RLS) policies. Every table has RLS enabled; no direct table access without a policy permitting it.

**The authorization question for any query is:** "Does this user have an active, non-revoked `patient_role_assignment` for the patient_id being accessed, AND does their role permit this action?"

Role capability matrix (from v0.3 outline Module 17, implemented here):

```
Role                   | Read Clinical | Write Own Entries | Write Others' | Delete | Activate MPA
-----------------------|---------------|-------------------|---------------|--------|-------------
patient_self           | own record    | yes               | no            | own    | no
primary_caregiver      | full          | yes               | no*           | own    | no
mpa_holder             | full          | yes               | no*           | own    | no (clinician)
family_coordinator     | full          | yes               | no*           | own    | no
technical_operator     | full          | yes (config)      | no*           | own    | no
helper                 | task-scoped   | assigned tasks    | no            | own    | no
paid_aide              | shift-scoped  | assigned tasks    | no            | own    | no
clinician_readonly     | generated view| no                | no            | no     | no
```

*"No write to others' entries" is the core of "facts, not blame." Anyone can add their own observation; no one can edit someone else's log. Corrections happen via new entries that reference the original.

**MPA activation** is a special workflow, not a role permission change. MPA is activated by uploading a `capacity_determination` document (signed by a clinician) and toggling `patients.mpa_active = TRUE`. RLS policies do NOT grant sister expanded write permission via MPA activation; she always has read+own-write. MPA activates decision authority in the real world (signing consent forms, directing clinicians), which the app records but doesn't enforce.

### RLS policy pattern (example)

```sql
-- On the medications table:
CREATE POLICY "Users can read medications for patients they have roles for"
ON medications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patient_role_assignments pra
    WHERE pra.patient_id = medications.patient_id
      AND pra.user_id = auth.uid()
      AND pra.revoked_at IS NULL
      AND pra.role IN (
        'patient_self', 'primary_caregiver', 'mpa_holder',
        'family_coordinator', 'technical_operator'
      )
  )
);

CREATE POLICY "Helpers only see meds for assigned tasks"
ON medications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patient_role_assignments pra
    JOIN tasks t ON t.patient_id = pra.patient_id
    WHERE pra.patient_id = medications.patient_id
      AND pra.user_id = auth.uid()
      AND pra.role IN ('helper', 'paid_aide')
      AND t.assigned_to_user_id = auth.uid()
      AND t.completed_at IS NULL
      AND t.task_type = 'medication_admin'
      -- The task must reference this medication
      AND (t.description ILIKE '%' || medications.drug_name || '%')
  )
);

-- Medication writes: self or primary_caregiver or mpa_holder
CREATE POLICY "Limited users can log medication administrations"
ON medication_administrations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patient_role_assignments pra
    JOIN medications m ON m.id = medication_administrations.medication_id
    WHERE pra.patient_id = m.patient_id
      AND pra.user_id = auth.uid()
      AND pra.role IN ('patient_self', 'primary_caregiver', 'mpa_holder', 'helper', 'paid_aide')
  )
);
```

Full RLS policies for every table are a separate artifact (auto-generated from the role matrix, to be produced in the per-module specs).

---

## 5. State Management & Offline Strategy

### Client-side architecture

- **TanStack Query** owns all server-fetched state. Cache invalidation on mutations is explicit and per-entity. Stale-while-revalidate pattern with 30-second default stale time; critical data (active medications, escalation events) has 5-second stale time and realtime subscriptions.
- **Zustand** owns ephemeral client state: current wizard step, UI modal stacks, form drafts not yet persisted, active timer state (spirometry countdown, transfer-in-progress).
- **React Hook Form** owns form state with Zod schema validation. Form schemas are shared with backend validation (single source of truth).
- **Supabase Realtime** subscribes to changes for current-patient data — when sister adds a document, Linda's app updates within 2-3 seconds.

### Offline strategy

This matters because Linda may be at the hospital with Rick where WiFi is spotty, in the bathroom at 3 AM logging a symptom, or in a car en route to an appointment. Offline data entry is a safety feature.

- **Service worker caches the app shell + last-viewed data.** App loads and is interactive offline.
- **Outbox pattern for writes.** Every mutation goes through a local queue (IndexedDB). If online, it syncs immediately. If offline, it queues. On reconnection, the queue drains in order.
- **Conflict resolution:** last-write-wins by default, with server timestamp as the tiebreaker. Medication administrations are append-only (never updated), so conflicts are impossible. For mutable entities (tasks, medications), conflicts are rare because stakeholders rarely edit the same record simultaneously. When they occur, we keep both versions and surface a "these two edits conflicted" UI in Module 17.
- **Hard constraint on offline writes:** cannot create a new escalation event offline. Red-flag escalations require real-time stakeholder notification, which requires connectivity. Offline red-flag detection surfaces a "you need to be online to escalate — or call 911 / the surgeon's office directly" screen with phone numbers prominent.
- **Background sync** via Workbox's `backgroundSync` plugin when the app is closed but the phone is online.

### Caching strategy

- App shell: cached aggressively, updated on new deploys.
- User's own patient data: cached with TTL of 5 minutes when online, unlimited when offline.
- Documents: downloaded on first view, cached locally. Sensitive documents (e.g., operative reports) are encrypted at rest in the cache.
- Images (incision photos): cached for 7 days, then evicted.

---

## 6. Audit & Logging

Audit is a first-class concern for this app, for three reasons: (1) clinical data regulatory-adjacency, (2) multi-stakeholder blame-resistance requires reliable provenance, (3) post-incident review of escalation events needs clean records.

### What gets audited

Every mutation to a clinical table. The `audit_log` table captures `before_snapshot` and `after_snapshot` as JSONB for anything non-append-only. For append-only tables (administrations, vitals, symptom_logs), the log captures the creation event.

Also audited:
- Document views (who opened which document, when)
- PDF exports (who generated the ER handoff, when)
- Role assignments (grants and revocations)
- MPA activations and deactivations
- Authentication events (login, logout, failed attempts)

### How audit is surfaced

- **Default UI views do NOT show audit information.** This is the "facts, not blame" principle in the UI layer.
- **Explicit audit view** exists at `/patient/{id}/audit` — accessible to `primary_caregiver`, `mpa_holder`, `technical_operator`. Shows a timeline of changes with actor attribution. Framed neutrally.
- **Reconciliation workflows surface audit.** When sister is reconciling the medication list, she can see "this entry came from the discharge summary, this one was added by Linda on [date] per surgeon phone call on [date]." Useful context, not finger-pointing.

### Log retention

- Audit logs: retained indefinitely. Small volume at household scale.
- Authentication logs: 90 days.
- Error logs (Sentry): 30 days.

---

## 7. Notification System

### Delivery channels

1. **Web push** (Push API via service worker). Works on Android and iOS 16.4+ *if the PWA is installed to home screen*. This is the primary channel.
2. **SMS via Twilio** for critical alerts as a fallback if push isn't delivered within 60 seconds (delivery confirmation via Twilio webhook). Cost ~$0.0075 per SMS; negligible at household volume.
3. **Email** for non-urgent digests (daily summary, weekly report for appointments).
4. **In-app badge and notification inbox** always; delivered channels are in addition to in-app.

### Notification priority tiers

| Tier | Examples | Delivery |
|---|---|---|
| Critical | Red-flag escalation (any tier), fall event, MPA activation, sepsis cluster | Push + SMS fallback, to all configured recipients simultaneously, vibrate/sound override silent mode where possible |
| High | Missed critical medication (>30 min past due for anticoag/antibiotic), scheduled orthostatic BP not taken, new message from provider | Push, inbox |
| Routine | Scheduled medication due, walking reminder, appointment tomorrow | Push (silent), inbox |
| Digest | Weekly summary, nightly recap | Email (opt-in) |

### Notification routing rules

Configured per-stakeholder in user profile. Defaults:

- **Rick receives:** all his own scheduled medications, all escalation events concerning him, his own appointments. NOT helper-tier task reminders (that's Linda's queue).
- **Linda receives:** all routine and above. Her own medications separately. All critical events.
- **Sister receives:** critical events only by default (she's not co-habitating). Documents arriving, appointment outcomes, escalation events. Configurable up to high or routine if she wants.
- **Ben receives:** critical events + system/technical alerts. Low volume.

The "all of us" rule from design principle 3: critical events go to Rick, Linda, and Sister simultaneously. No "Linda filters first" — that reintroduces blame dynamics.

### Quiet hours

- Routine notifications respect quiet hours (22:00–07:00 per user).
- High notifications break quiet hours.
- Critical notifications always deliver immediately.

### Implementation

- **Supabase Edge Function** `notify` receives a notification spec, writes to `notifications` table, and dispatches to configured channels.
- **Twilio** via Edge Function for SMS.
- **Web push** via the `web-push` npm library in an Edge Function, with VAPID keys stored in Supabase secrets.
- **Service worker** handles push receipt, routes to notification UI.

---

## 8. UI Architecture

### Design system

- **Tailwind v4** with CSS-first configuration via `@theme` directive in `src/styles/globals.css`. All tokens (colors, typography, spacing, radii, shadows, category tints, semantic state colors) are declared as CSS variables and mapped to Tailwind utilities via `@theme inline`. No `tailwind.config.js` for theme extension; only for file globs if needed. The `@tailwindcss/vite` plugin is the build mechanism.
- **shadcn/ui components** as the base library. Copy-paste into the repo, modify per the project design system.
- **Radix UI primitives** for accessible unstyled components where shadcn doesn't cover (date pickers, complex menus).
- **Lucide icons** for iconography — clean, consistent, open-source. Canonical icon-to-domain mapping lives in the Design System Contract doc.
- **Inter** (sans) and **JetBrains Mono** (for vitals, timestamps, phone numbers, MRN) — self-hosted in production per privacy posture.

**Full design token and component specification** lives in `rick_care_app_module_01_design_system_contract.md`. That document is authoritative for: category tints (7 pastel domain colors), semantic state colors (critical / warning / ok / info), type scale classes, canonical components (HeroCard, CategoryCard, TimelineItem, VitalsTile, AllergyRow, Sheet, ScreenHeader, RecoveryRing, SectionLabel, TimestampedEntry, MPAStatusIndicator, etc.), alert taxonomy (3 tiers), Rick-specific view rules (plain language, AAA contrast, 56px min button), and role-based nav divergence (`NAV_CONFIGS` pattern). This technical foundation doc does not duplicate those specs.

### Responsive strategy

- **Mobile-first.** All screens work on a 375px-wide iPhone.
- **Tablet breakpoint (768px):** two-column layouts where useful (dashboard, appointments).
- **Desktop (1024px+):** multi-column dashboards, especially valuable for Sister's records aggregation view.

### Component hierarchy

```
app
├── layouts/
│   ├── AuthLayout (for login/signup)
│   └── AppLayout (authenticated, with nav)
├── pages/
│   ├── Dashboard (role-specific home)
│   ├── Medications
│   ├── Vitals
│   ├── Symptoms
│   ├── Appointments
│   ├── Documents
│   ├── CareTeam
│   ├── Tasks
│   ├── ERHandoff
│   └── Settings
├── features/ (per-module business logic)
│   ├── medications/
│   ├── vitals/
│   ├── escalations/
│   ├── falls/
│   ├── respiratory/
│   ├── documents/
│   ├── disputes/
│   └── roles/
└── components/ (shared UI)
    ├── ui/ (shadcn components)
    ├── PatientSwitcher
    ├── StakeholderAvatar
    ├── TimestampedEntry
    ├── VitalCard
    ├── RedFlagBadge
    └── ...
```

### Key UI patterns (defined once, used everywhere)

- **TimestampedEntry:** Any data point shows *what* and *when*, but not *who* by default. Tap to expand shows actor. This is the "facts, not blame" UI pattern.
- **StakeholderView toggle:** Where appropriate, toggle between "my view" and "shared view" (for Rick and Linda comparing self-reports vs. observations).
- **TrafficLight gate:** Green/yellow/red indicator on activities requiring clinical clearance. Tapping the gate shows the criteria.
- **EvidenceAnchor:** Inline reference to evidence library items. When discussing a claim, the app shows "according to [source]: [plain summary]" with a "read more" link.
- **ActionConfirmation:** Destructive or escalation actions require explicit confirmation with a typed keyword for the highest-risk ones ("type ACTIVATE to confirm MPA activation").
- **OfflineIndicator:** Persistent banner when offline with a queue count ("3 entries waiting to sync").

### Accessibility (non-negotiable)

- WCAG 2.1 AA compliance target.
- Large tap targets (minimum 44px).
- Color is never the sole information channel (icons + text + color).
- Screen reader tested with VoiceOver (iOS) and TalkBack (Android).
- Dynamic type support — respects iOS/Android font size settings.
- Sufficient contrast ratios (verified via automated tooling in CI).
- Dark mode (for 3 AM bathroom checks).

---

## 9. Security & Privacy

### Data at rest

- Supabase encrypts the database at rest (AES-256).
- Storage bucket for documents: server-side encryption enabled.
- Sensitive local cache (documents, images): encrypted via Web Crypto API before IndexedDB storage.

### Data in transit

- TLS 1.3 end-to-end (enforced by Supabase and Vercel).
- HSTS headers; no mixed content.

### Secrets management

- No secrets in the client. Supabase anon key is fine in client (RLS enforces authorization server-side).
- Service role key only in Edge Functions, via Supabase secrets.
- Twilio credentials in Supabase secrets.
- VAPID keys for push in Supabase secrets.

### PII handling

- Minimal PII in logs (no full names or medical details in Sentry error messages — use IDs).
- Audit log sanitization: before sending audit events to any external system, strip PII.
- No third-party analytics.
- No external fonts (self-host Inter and a system font fallback).

### Data lifecycle

- Users can export all their data (JSON + PDFs of documents) at any time via Settings.
- Account deletion: soft-delete with 30-day retention, then hard-delete.
- Patient data: never hard-deleted (clinical record). Archived if patient is deceased, with appropriate access controls.

### Third-party access

- Supabase (data processor)
- Vercel (hosting only; no data access)
- Twilio (phone numbers and SMS content only)
- Sentry (sanitized error logs only)
- Cloudflare (CDN only; no data access)

No other third parties. No ad networks. No analytics. No AI APIs hitting user data without explicit user-initiated action.

### Not HIPAA-compliant (intentionally)

For household use, HIPAA compliance is not required (HIPAA applies to covered entities: providers, payers, clearinghouses). If this app were ever offered to other households commercially, we'd need BAAs with Supabase, Twilio, Vercel, and Sentry. Noting here so we don't design our way into a compliance cliff if scope changes.

---

## 10. Testing Strategy

Tests are first-class given the clinical context. Correctness matters more than coverage percentage.

### Test layers

1. **Unit tests (Vitest):** business logic, schema validation, utility functions. Fast, run on every commit.
2. **Component tests (Vitest + Testing Library):** UI components in isolation. Focus on behavior, not implementation.
3. **Integration tests (Vitest + Supabase local):** data layer interactions, RLS policy verification. Run against a local Supabase instance.
4. **E2E tests (Playwright):** critical user journeys end-to-end. Run on deploy previews.

### Critical E2E scenarios (non-negotiable)

- Medication administration workflow (scheduled dose given, missed, PRN) with correct audit entries.
- Red-flag escalation triggering (create conditions that trip each tier, verify correct notification routing).
- Fall event logging with full context capture and notification to all stakeholders.
- ER handoff PDF generation with all required fields.
- Role assignment and RLS enforcement (user without role cannot access, user with role can).
- MPA activation workflow and audit entry.
- Offline medication logging with successful sync.
- Document upload, reconciliation, and dispute workflow.

### RLS policy testing

Every RLS policy has a corresponding test that verifies:
- Authorized roles can perform the action.
- Unauthorized roles cannot.
- Revoked role assignments deny access immediately.

### Performance targets

- Dashboard first-paint under 2 seconds on 4G.
- Medication administration logging: under 500ms from tap to persisted (with optimistic UI).
- Document upload: progress indicator; no timeout for files under 25MB.

### Test data

- Fixture data for each test scenario (Rick profile, Linda profile, sister profile, etc.).
- Reset between tests via Supabase migration rollback in local runs.

---

## 11. Deployment & DevOps

### Environments

- **Local:** Docker Compose with local Supabase (via `supabase start`).
- **Staging:** Vercel preview deployments on every PR, with a shared staging Supabase project.
- **Production:** Vercel main branch, production Supabase project, custom domain.

### CI/CD

- **GitHub Actions** on every PR:
  - Typecheck (`tsc --noEmit`)
  - Lint (ESLint + Prettier check)
  - Unit + component tests
  - RLS policy tests against local Supabase
  - Build check
- **On merge to main:**
  - All of the above plus E2E tests
  - Deploy to Vercel production
  - Apply Supabase migrations via `supabase db push`

### Migrations

- All schema changes via Supabase migrations (timestamped SQL files in `supabase/migrations/`).
- Migrations are reviewed in PR.
- Rollback plan for every migration (included in the PR description).

### Monitoring

- **Sentry** for frontend errors. Alerts if error rate spikes.
- **Supabase Logs** for backend issues.
- **Uptime monitoring** via a free tool (UptimeRobot or similar). Alerts if the app is down.
- **Database backups:** Supabase Pro tier daily automated backups, retained 7 days. Point-in-time recovery available.

### Cost envelope

- Vercel: free (well within free tier)
- Supabase: Pro tier $25/mo (needed for daily backups, better limits)
- Twilio: ~$5/mo expected
- Domain: ~$15/year
- Total: ~$35/mo

---

## 12. Error Handling

### Principles

- **Fail loudly in development, gracefully in production.**
- **Never silently swallow a clinical data write failure.** If a medication administration can't be recorded, the user sees a clear message AND the attempt is queued for retry.
- **Never show a stack trace to a user.** Sentry captures the real error; the user sees a friendly message with an error ID they can share.
- **No data loss.** Forms auto-save drafts locally. Navigation away mid-form warns.

### Common error scenarios

| Scenario | Handling |
|---|---|
| Network offline during write | Queue via outbox; show "saved locally, will sync" indicator |
| Auth token expired mid-session | Silent refresh; if refresh fails, redirect to login preserving the form state |
| Push notification permission denied | Fall back to SMS for this user; show a banner offering to retry permission |
| Document upload failure | Partial upload resumable; if not resumable, clear error with retry button |
| RLS policy denies access unexpectedly | Show "You don't have access to this. If this is unexpected, [link to Ben]" |
| Supabase rate limit hit | Exponential backoff; user sees "syncing..." not an error |
| Escalation notification fails to deliver | Automatic SMS fallback + critical in-app banner to user who triggered ("Your escalation notification may not have reached all recipients — please call directly") |

---

## 13. Development Workflow (for Ben and Claude Code)

### Repository structure

```
/
├── docs/
│   ├── outline_v0.3.md          (the product spec)
│   ├── technical_foundation.md  (this document)
│   ├── modules/
│   │   ├── 01_profile.md
│   │   ├── 02_medications.md
│   │   └── ...
│   └── decisions/               (ADRs)
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── functions/
│       ├── notify/
│       ├── escalate/
│       └── generate-er-handoff/
├── src/
│   ├── app/
│   ├── features/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── types/
├── tests/
│   ├── unit/
│   ├── component/
│   ├── integration/
│   └── e2e/
├── .github/workflows/
└── package.json
```

### Conventions

- **TypeScript strict mode.** No `any` without a comment explaining why.
- **Zod schemas** for every API boundary and form.
- **Named exports, not default exports** (better refactoring support, clearer imports).
- **File naming:** `kebab-case.ts` for files, `PascalCase` for components inside.
- **Commit messages:** conventional commits (`feat:`, `fix:`, `chore:`, etc.).
- **PR size target:** under 500 lines changed. Larger changes split into stacked PRs.

### Working with Claude Code

Each module spec (produced next) is a Claude Code reference document. The pattern:

1. Spec defines purpose, data model additions, user stories, screens, workflows, acceptance criteria.
2. Claude Code generates migrations, types, components, tests in that order.
3. Each module ships as its own stacked PR.
4. Acceptance criteria from the spec become the E2E tests.

---

## 14. Open Technical Questions (flagging for Ben)

1. **Do we want native iOS/Android apps eventually?** PWA covers Phase A–C well. iOS push reliability may push us to native in Phase D if the family is having notification issues.
2. **Clinician read-only access: how?** Secure link with time-limited token is cleanest for non-user clinicians. Do we want accounts for the surgeon's office, or is PDF handoff sufficient? Default: PDF handoff only in Phase A; revisit if surgeon's office wants live access.
3. **Voice input?** Linda might benefit from "log pain 4, took Eliquis at 8" dictation. Web Speech API is free and works. Recommend as Phase B enhancement.
4. **AI-assisted features?** Several could help: automatic symptom categorization, discharge summary parsing into the med list, pattern detection in trends. Each has a privacy cost. Recommend: NONE in Phase A. Evaluate in Phase C with explicit data-handling controls.
5. **Payment for paid aides?** Out of scope for now; if needed later, Stripe Connect is the pattern.
6. **Integration with hospital EHR (MyChart)?** Not Phase A. If sister really wants it, FHIR APIs exist but integration is substantial. Defer to Phase D or later.

---

## 15. Glossary (for consistent terminology in module specs)

| Term | Meaning |
|---|---|
| Household | Top-level grouping (Rick + Linda's home) |
| Patient | Person being cared for (Rick primary, Linda secondary) |
| Stakeholder | Any human user with a role |
| Caregiver | Role label for Linda specifically |
| Coordinator | Role label for Sister specifically |
| MPA | Medical Power of Attorney; decision authority when patient is incapacitated |
| BLT | Bending, Lifting, Twisting (post-fusion precautions) |
| MAR | Medication Administration Record |
| PRN | "Pro re nata" — as needed; not scheduled |
| SSI | Surgical Site Infection |
| VTE | Venous Thromboembolism (covers DVT + PE) |
| DOAC | Direct Oral Anticoagulant |
| PE | Pulmonary Embolism |
| CTEPD | Chronic Thromboembolic Pulmonary Disease |
| STEADI | CDC's Stopping Elderly Accidents, Deaths, and Injuries framework |
| ERAS | Enhanced Recovery After Surgery |
| NAON | National Association of Orthopaedic Nurses |
| AHRQ | Agency for Healthcare Research and Quality |
| PSNet | AHRQ's Patient Safety Network |
| Red-flag tier | Escalation level (911, surgeon-today, watch) |
| Dispute claim | A contested clinical claim logged in Module 17c |
| Evidence library | Pre-populated set of clinical guideline references |
| Audit log | Tamper-resistant record of every data mutation |
| Outbox | Client-side queue for offline writes |
| RLS | Row-Level Security (PostgreSQL authorization) |

---

## Next documents to produce

In order:

1. **Module 01 — Patient Profile & Clinical Context** (deep spec)
2. **Module 02 — Medication Management** (deep spec)
3. **Module 13 — Document Vault & Discharge Reconciliation** (deep spec — Phase A priority)
4. **Module 03 — Vitals & Symptom Log** (deep spec)
5. **Module 04 — Red-Flag Escalation Engine** (deep spec)
6. **Module 05 — Respiratory, PE & Anticoagulation** (deep spec)
7. **Module 17 — Role Clarification & Dispute Resolution** (deep spec)
8. **Module 07 — Fall Prevention** (deep spec)
9. **Module 15 — Communication Hub & ER Handoff** (deep spec)
10. **Module 10 — Rick's Co-Management Track** (deep spec)

Phase A complete at module 10. Modules 06, 08, 09, 11, 12, 14, 16 follow in subsequent phases with lighter specs initially.
