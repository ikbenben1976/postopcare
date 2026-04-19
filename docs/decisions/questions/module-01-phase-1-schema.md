# Module 01 — Phase 1 Schema Questions

**Module:** 01 (Patient Profile)
**Phase:** 1 (Schema migrations)
**IA:** Implementation Agent, session `claude/care-app-module-01-7G5L6`
**Date raised:** 2026-04-19
**Status:** awaiting human decision (via CA routing)

These are the ambiguities/gaps the IA found while reading the foundation spec (v1.1), Module 01 spec (v1.2), and design system contract (v1.0). Per Module 01 §14.5, the IA does not guess on a foundational module. Each question proposes a resolution; the CA reviews, the human decides.

---

## Q1: Foundation tables do not yet exist in the repo — does Module 01 Phase 1 create them?

**Ambiguity.** Module 01 §3 says "Builds on the tables defined in the technical foundation (`patients`, `surgeries`, `diagnoses`, `providers`, `patient_providers`, `pharmacies`, `documents`)." Module 01 §3.2 uses `ALTER TABLE patients ADD COLUMN ...` phrasing, implying `patients` already exists. But `supabase/migrations/` is empty — no foundation tables have been created.

Module 01 §14.2 explicitly anticipates this: *"Verify the repo state: Does the foundation already exist (auth, base tables, RLS scaffolding)? If not, the IA's first job is foundation setup — flag this to the human before proceeding."*

**Options considered.**

1. **Module 01 Phase 1 creates both the foundation tables (patients, surgeries, diagnoses, providers, patient_providers, pharmacies, documents, users_profile, households, patient_role_assignments, audit_log) AND the Module 01-specific tables (allergies, insurance_policies, capacity_determinations, fall_history, comorbidities, emergency_contacts, care_log), scoped strictly to what Module 01 references.** Tables that Module 01 does not reference (medications, vitals, symptom_logs, fall_events, escalation_events, tasks, notifications, activity_sessions, appointments, evidence_library_entries, dispute_claims, incision_checks) are left for their owning modules' Phase 1 migrations.
2. A separate "Module 00 / Foundation" Phase 1 builds all foundation tables up-front; Module 01 Phase 1 only adds its own tables and column additions. Delays Module 01 until a new module is specified.
3. Module 01 creates every table in foundation §3, owned or not. Creates drift risk — each owning module would later have to alter-add its own columns.

**IA recommendation:** Option 1. Rationale: the module spec was written as if foundation tables existed, so merging foundation-table creation into Module 01 Phase 1 mirrors the spec's assumption while keeping the blast radius to tables Module 01 actually references. Each other module's Phase 1 will own its own tables when built. This resolves the `ALTER TABLE` phrasing by making the ALTER into CREATE … with the union of foundation + Module 01 columns, documented in the migration header.

**Impact if approved:** Phase 1 migration count grows from ~7 Module 01-only tables to ~18 tables total. Affects Phase 1 scope estimate. Naming this as "foundation + Module 01 scope" in the migration headers prevents drift vs. the foundation spec.

---

## Q2: Duplicate column definition — `patients.primary_language`

**Ambiguity.** Foundation §3 defines `patients.primary_language TEXT DEFAULT 'en'`. Module 01 §3.2 then says: `ALTER TABLE patients ADD COLUMN primary_language TEXT DEFAULT 'en';`. Same column, same default, defined in both specs.

**Options considered.**

1. Treat Module 01's line as reinforcement, not addition. Create the column exactly once (in the patients migration) with the foundation definition.
2. Treat Module 01's line as authoritative and drop it from the foundation.
3. File both and let the migration fail loudly.

**IA recommendation:** Option 1. It's a spec duplication, not a contradiction — both say the same thing. The Build Plan's patients migration creates the column once, following the foundation definition.

**Impact:** None beyond noting the duplication in the migration header.

---

## Q3: Missing column — `patients.historical_severe_conditions` (JSONB)

**Ambiguity.** Module 01 §15.2 says sepsis history is "flagged in a `historical_severe_conditions` JSONB field on patients for fast lookup." This column is **not** listed in foundation §3's `patients` definition nor in Module 01 §3.2's field additions.

**Options considered.**

1. Add `historical_severe_conditions JSONB DEFAULT '{}'` to the `patients` table in the Phase 1 migration, with a spec-deviation note in the Build Plan.
2. Store sepsis history via a regular `diagnoses` row with `active = false` and rely on queries to find it. Avoid the JSONB shortcut. Violates §15.2 directly.
3. Defer to Module 05 (Respiratory/PE/Anticoag) — the consumer — to add it later. Risks forcing another Phase 1 into altering a Module 01 table.

**IA recommendation:** Option 1. The contract in §15.2 is explicit and consumed by Modules 04, 05, 15. Adding it in Module 01 Phase 1 upholds the contract. Log as a deviation from §3.2 (field addition not enumerated there).

**Impact:** One extra column in the patients migration. Requires a deviation record in `docs/decisions/deviations/`.

---

## Q4: Missing column — `diagnoses.diagnosis_category`

**Ambiguity.** Module 01 §15.2 says: *"PE: contains the string 'pulmonary embolism' or 'PE' with diagnosis_category = 'pulmonary'"*. The foundation `diagnoses` table has no `diagnosis_category` column.

**Options considered.**

1. Add `diagnosis_category TEXT` to `diagnoses` in Module 01 Phase 1 (enum-checked: 'pulmonary', 'cardiac', 'neuro', 'gi', 'gu', 'musculoskeletal', 'infectious', 'hematologic', 'metabolic', 'other').
2. Derive category from free-text `diagnosis_name` at query time. Brittle; the contract explicitly reads a category field.
3. Defer to Module 04 / 05 Phase 1 — they're the consumers. Creates cross-module alter drift on a Module 01-owned table.

**IA recommendation:** Option 1. Categories are load-bearing for red-flag routing (Module 04) and respiratory triage (Module 05). Belongs on the base table. Log as a deviation.

**Impact:** One extra column + CHECK constraint in `diagnoses`. Deviation record needed.

---

## Q5: `care_log` table (§15.7) — no SQL schema given

**Ambiguity.** Module 01 §15.7 specifies the TypeScript contract for `useCareLog` and declares "Module 01 owns this store; every other module consumes it." Module 01 §12 step 1 says "Includes the `care_log` table (see §15.7) which Module 01 owns." But no `CREATE TABLE care_log` appears in §3.

**IA proposes this schema (needs CA + human approval):**

```sql
CREATE TABLE care_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL
    CHECK (kind IN ('med','vitals','checkin','fall','symptom','record_edit','document','mpa')),
  by_user_id UUID NOT NULL REFERENCES users_profile(user_id),
  -- column name `by_user_id`; TypeScript contract exposes as `by` (mapped in the Zod layer)
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  patient_id UUID NOT NULL REFERENCES patients(id),
  household_id UUID NOT NULL REFERENCES households(id),
  corrects_id UUID REFERENCES care_log(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_care_log_patient_ts ON care_log(patient_id, ts DESC);
CREATE INDEX idx_care_log_patient_kind_ts ON care_log(patient_id, kind, ts DESC);
-- Realtime publication opt-in handled via `supabase/realtime.sql` (Phase 3 wires Realtime).
```

Append-only enforcement: no `UPDATE` or `DELETE` RLS policies. An `UPDATE`/`DELETE`-blocking trigger as belt-and-braces.

`kind = 'mpa'`: RLS on SELECT limits to full-access roles (`patient_self`, `primary_caregiver`, `mpa_holder`, `family_coordinator`, `technical_operator`). Non-mpa kinds visible to all non-revoked role holders for that patient (helpers/aides included only where their task scope permits — but for Phase 1 we default helpers to read non-sensitive kinds; tightening may happen in a later module's phase).

**Alternative considered:** name the column `by` (quoted identifier). Works but every query becomes `"by"` and the DX suffers. Rejected.

**IA recommendation:** ship the schema above in Phase 1 with a deviation record noting that §15.7's TS `by` maps to DB `by_user_id`.

**Impact:** Establishes the load-bearing foundation table for every subsequent module's writes. Tightly scoped; straightforward to extend.

---

## Q6: `patients.mri_safety_status` — trigger on `surgeries.hardware_inventory` changes

**Ambiguity.** §6.5 declares the derivation rule; §15.5 says "derivation logic lives in Module 01 as a PostgreSQL trigger on `surgeries.hardware_inventory` changes." The CA's Phase 1 gate checklist (coordinator spec §4.2) explicitly tests this trigger. What it does NOT specify: whether this is a `BEFORE INSERT OR UPDATE OF hardware_inventory` row-level trigger, or a deferred trigger, and whether it blocks the write when all implants have `unknown` MRI compat.

**IA proposal.** Implement as `AFTER INSERT OR UPDATE OF hardware_inventory ON surgeries FOR EACH ROW EXECUTE FUNCTION patients_recompute_mri_safety()`. The function:
1. Aggregates every implant's `mri_compatible` across all non-deleted surgeries for the patient.
2. Applies the "most restrictive wins" rule from §6.5: `mri_unsafe` > `conditional_1.5T` > `conditional_1.5T_3T` > `mri_safe`; `unknown` propagates only if no other rating exists (i.e., the patient's status is `unknown` when we genuinely don't know, not when we know one is safe and another is unknown — I'm deviating slightly from §6.5's literal text; see flag below).
3. Writes the result to `patients.mri_safety_status`.
4. Does not block the write.

**Flag on §6.5 literal text.** §6.5 says "If any is `unknown`, patient is `unknown`." Strict read: one unknown implant overrides five known-safe implants. Clinically this seems wrong — an `mri_unsafe` implant should outrank an `unknown`. The IA proposes the ordering above (unsafe > conditional > safe, unknown only when nothing else is ranked). **This is a clinical safety question and should be escalated per coordinator §6.3.**

**IA recommendation:** Implement the conservative ordering (unsafe > conditional-1.5T > conditional-1.5T_3T > safe > unknown). Human decision required.

**Impact:** If the human chooses strict §6.5, the trigger function changes one line. Logged as a clinical-safety flag.

---

## Q7: Guard `patients.mpa_active` against direct UPDATE

**Ambiguity.** §6.2 says: *"No user can directly UPDATE `mpa_active` — only the activation/deactivation Edge Functions can."* RLS policies can restrict UPDATE by role, but the activation function (running as an authenticated user, not service role) would itself be subject to the same UPDATE policy.

**Options considered.**

1. Set `mpa_active` / `mpa_activated_at` / `mpa_activated_by_clinician_note_id` UPDATE to service-role-only via RLS; Edge Functions use the service role key. Requires the activation path to go through a server-side function (consistent with §15.4's `/api/mpa/activate`).
2. Block `mpa_active` column updates via a `BEFORE UPDATE` trigger that raises unless a session-local GUC (e.g. `app.activating_mpa = 'true'`) is set; the Edge Function sets the GUC before calling UPDATE.
3. Allow direct UPDATE by full-access roles and trust the client. Violates §6.2. Rejected.

**IA recommendation:** Option 1. The Edge Function is the only code path that should write these columns; service-role scoping gives a clean DB-level guarantee. Matches §15.4 contract.

**Impact:** Phase 1 writes the RLS policies (service-role only on those three columns). Phase 3 (data access) wires the Edge Function. Phase 6 (workflows) exercises it end-to-end.

---

## Q8: Missing `deleted_at` / `updated_by_user_id` / `updated_at` on some Module 01 tables

**Ambiguity.** Foundation §3 says: *"All tables have `id` (UUID), `created_at`, `updated_at`, `created_by_user_id`, `updated_by_user_id`. Soft-delete via `deleted_at` on most tables (never hard-delete clinical data)."*

Module 01 §3.1 table definitions:
- `allergies` — has all four audit cols ✓
- `insurance_policies` — missing `deleted_at`
- `capacity_determinations` — missing `updated_at`, `updated_by_user_id`, `deleted_at`; has only `uploaded_by_user_id` + `created_at`
- `fall_history` — missing `updated_at`, `updated_by_user_id`, `deleted_at`; has `reported_by_user_id` + `created_at`
- `comorbidities` — missing `deleted_at`
- `emergency_contacts` — has `created_at`/`updated_at`/`created_by_user_id`; missing `updated_by_user_id` and `deleted_at`

**Options considered.**

1. Add the missing audit columns uniformly across all Module 01 clinical tables to comply with foundation §3.
2. Follow the Module 01 §3.1 text exactly and leave the holes.
3. Add some (e.g. `deleted_at` everywhere for soft-delete) but not all (`updated_by_user_id` on `capacity_determinations` is arguably wrong — those records shouldn't be edited).

**IA recommendation:** Option 3, applied as follows:
- Add `deleted_at TIMESTAMPTZ` to every Module 01 clinical table (foundation mandate).
- Add `updated_at` + `updated_by_user_id` to `comorbidities`, `insurance_policies`, `fall_history`, `emergency_contacts`.
- **Leave `capacity_determinations` as immutable** — the `revoked`/`revoked_at`/`revocation_document_id` pattern replaces UPDATE; any "edit" produces a superseding row. This matches the spirit of a signed clinical document.
- Add `updated_at`/`updated_by_user_id` on `capacity_determinations` anyway for the record-of-revocation use, since the revocation fields are writes.

**Impact:** Small column additions. Log as a deviation from Module 01 §3.1 literal text with rationale "Foundation §3 convention."

---

## Q9: `emergency_contacts.priority_order` — UNIQUE index vs. practical reordering

**Ambiguity.** Module 01 §3.1: `CREATE UNIQUE INDEX idx_emergency_contacts_priority ON emergency_contacts(patient_id, priority_order);`. §7 says `priority_order: 1 or greater, unique per patient`. Reordering contacts (drag-and-drop in UI) inevitably produces intermediate states where two rows have the same priority.

**Options considered.**

1. Make the UNIQUE constraint DEFERRABLE INITIALLY DEFERRED; the client writes all reordered rows in one transaction and the constraint checks at commit.
2. Drop the UNIQUE constraint; use a regular index for ordering lookups. Enforce uniqueness in the application layer.
3. Implement reorder as a server-side function that picks non-colliding priorities (e.g., use float ordering).

**IA recommendation:** Option 1. Keeps the invariant that no two contacts for a patient share priority. DEFERRABLE handles the drag-and-drop case cleanly.

**Impact:** Single-keyword change in the CREATE INDEX → actually requires a UNIQUE CONSTRAINT (not INDEX) for DEFERRABLE. Migration phrasing change only.

---

## Q10: RLS for helpers/aides on `allergies` — scope

**Ambiguity.** Module 01 §3.4 shows:

```sql
CREATE POLICY "Helpers can read allergies for patients they assist"
ON allergies FOR SELECT
USING (
  EXISTS (SELECT 1 FROM patient_role_assignments pra
          WHERE pra.patient_id = allergies.patient_id
            AND pra.user_id = auth.uid()
            AND pra.revoked_at IS NULL
            AND pra.role IN ('helper', 'paid_aide'))
);
-- Allergies are always visible to helpers (safety-critical)
-- unlike e.g. insurance which they should not see.
```

This grants read access for any active helper/aide role, not task-scoped. Foundation §4 shows helpers' med visibility is *task-scoped* (tied to an active `tasks` row). Is the intended policy:

1. **Helpers/aides see allergies whenever they have any active scoped role for the patient** (spec §3.4 literal) — safety-critical override. Recommendation in the comment.
2. **Helpers/aides see allergies only within an active task window** (consistent with the foundation's med pattern).

**IA recommendation:** Option 1, matching the spec exactly and the safety rationale in the comment. Allergy awareness is baseline-safe for anyone assisting the patient. Log nothing — this is the spec's explicit intent.

**Impact:** None beyond following the spec.

---

## Q11: Atomic MPA activation across multiple tables

**Ambiguity.** §5.4 step 6 lists the atomic transaction: insert `capacity_determinations`, set three `patients` columns, insert audit_log entries, send notifications. Phase 1 owns the schema shape, not the transaction orchestration (that's Phase 3 / 6), **but** the RLS patterns and the Edge Function scaffolding for `/api/mpa/activate` (§15.4) influence the Phase 1 migration (Q7 above).

**IA plan.** Phase 1 produces:
- Schema for `capacity_determinations` and the `patients` MPA columns.
- RLS policies that restrict `patients` MPA-column updates to service role (per Q7).
- A migration that installs a SECURITY DEFINER function `public.activate_mpa(patient_id, capacity_determination_id)` that runs the atomic transaction inside PostgreSQL (not requiring an Edge Function round-trip). Edge Function in Phase 3 wraps this PL/pgSQL.

**IA recommendation:** Adopt this. Keeps the atomicity guarantee in SQL; the Edge Function becomes a thin HTTP wrapper.

**Impact:** One extra function migration in Phase 1. Notifications are sent from Phase 3 wiring, not inside the SQL transaction (notifications are not Module 01's domain).

---

## Q12: Audit trigger — generic or per-table?

**Ambiguity.** Foundation §6 says every mutation to a clinical table writes to `audit_log` with `before_snapshot` / `after_snapshot` JSONB. Module 01 §6.7 reiterates. No prescription for implementation.

**IA proposal.** One generic trigger function `public.write_audit_log()` attached to every Module 01 clinical table for INSERT, UPDATE, DELETE. Function reads the target table name from `TG_TABLE_NAME`, builds the JSONB snapshots from `OLD`/`NEW`, resolves `actor_user_id` from `auth.uid()`, and writes the row.

**IA recommendation:** Adopt. Per-table triggers are tedious and drift-prone.

**Impact:** One function + N trigger declarations (lightweight). Append-only tables (care_log) do not get the audit trigger — the care_log IS the audit for its kinds, and double-logging creates noise.

---

## Summary of what the IA is NOT guessing

For each question above, the IA has made a recommendation but will not implement until:
- CA reviews the Build Plan (including these questions)
- Human (Ben) approves or redirects

Particular items needing explicit human decision:
- **Q6** (MRI safety ordering — clinical safety implication)
- **Q3, Q4, Q5, Q8** (deviations from literal §3 text, even though consistent with other sections)
- **Q7** (MPA guard mechanism)

Items the IA will treat as resolved once the CA agrees (no human needed):
- Q1, Q2, Q9, Q10, Q11, Q12 — procedural / naming / drift-closing.
