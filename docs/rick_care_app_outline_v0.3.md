# Rick & Linda Care Coordination App — Structural Outline (v0.3)

**Change log from v0.2:**
1. Added third primary stakeholder: **Rick's daughter (Ben's sister)**, who holds Medical Power of Attorney, has EMT/instructor background, and is taking on records/coordination. Her style (alarmist, blame-placing) is a design constraint, not a footnote.
2. Added fourth stakeholder: **Ben**, the app's builder and the family's de facto mediator. Given an explicit role so he isn't invisible in the design.
3. New design principles: **"the app is the neutral source of truth"** (for resolving disputes without personal conflict) and **"facts, not blame"** (log structure).
4. **New Module 17 — Role Clarification, Coordination & Dispute Resolution.** Explicit role definitions, escalation paths, MPA activation protocol, and evidence-based dispute resolution pattern.
5. Authorization model rewritten to reflect 4+ stakeholders with differentiated access.
6. Module 13 (Documents) expanded: discharge-summary retrieval and reconciliation workflow is now a Phase A requirement — this closes the specific gap that Linda wasn't at discharge.
7. Module 15 (Communications) updated: facts-based family updates with no room for editorial spin.

---

## Stakeholders (v0.3)

The app supports five classes of human users plus one AI/automation class. Explicitly naming them prevents the "who's this feature for?" ambiguity.

**Rick (patient).** Cognitively intact, physically recovering, values autonomy, stubborn. Holds his own clinical record; participates as a first-class user (Module 10).

**Linda (primary in-home caregiver, spouse).** Co-habitating, recovering from her own back surgery, physically limited. Runs day-to-day operations. Primary operator of the app.

**Ben's sister (Rick's daughter, MPA holder).** Not co-habitating. EMT license + former EMT instructor. Stubborn, alarmist, blame-placing style. Legal authority via Medical Power of Attorney — activates when Rick is incapacitated. Taking on records aggregation, provider coordination, and meds research.

**Ben (son, app builder, de facto family mediator).** Technical operator of the app. Not the primary caregiver, but a stakeholder. Maintains the app, resolves configuration disputes, has full visibility.

**Paid aides / home health / extended family helpers.** Task-assigned access, shift-scoped, no full clinical view.

**Clinicians (surgeon, PCP, pulmonology, PT/OT, home health RN, pharmacist).** Read-only handoff views generated on request.

This is not an ordinary "patient + caregiver" app. It is a multi-stakeholder coordination platform with mixed authority and mixed styles, operating in a high-stakes clinical window. The design has to make that work.

---

## Design philosophy (v0.3 — expanded)

From v0.2 (Rick as co-manager; data-driven escalation; Linda as clinical signal; positive framing). Added in v0.3:

**4. The app is the neutral source of truth.** When stakeholders disagree — about whether a task was done, whether a med was ordered, whether a symptom warrants escalation — the answer lives in the app, not in the argument. Discharge instructions, surgeon orders, logged events, evidence-based protocol references are all canonical sources. Disagreements get resolved against documents and data, not against each other. This is the single most important design move for a family with mixed authority and a blame-placing voice in the mix.

**5. Facts, not blame.** Every log entry is a fact without attribution-of-fault language. *Not* "Linda missed the 8 PM dose." *Yes* "8 PM dose: not logged as given." The person who performed or didn't perform an action can be captured for follow-up purposes, but the app's default views (summaries, exports, family updates, clinician handoffs) show what happened, not who to blame. Pattern recognition over personal attribution.

**6. Evidence-based dispute resolution.** For any contested clinical claim ("he should have been doing X"), the app stores: (a) what was actually ordered in discharge/office-visit documentation, (b) what current orders say, (c) a reference to current evidence-based guidelines where applicable. When a dispute arises, the app surfaces these three anchors — no one has to argue from memory.

**7. Role-scoped views.** Each stakeholder sees the slice of the app that matches their actual role. Sister sees full clinical detail and coordination tasks she owns. Linda sees day-to-day operations. Rick sees his own record and co-management track. This reduces friction by not putting everyone's hands on the same levers.

---

## Why these sources anchor the design

Prior anchors retained (ERAS 2021, NAON 2022, CDC STEADI, AHRQ MATCH, AHRQ PSNet, 2026 AHA/ACC PE guideline, CHEST 2021 VTE, SDM frameworks).

Added in v0.3:

- **JCO Oncology Practice (2025) — Three-Talk Shared Decision-Making model with family caregiver extension.** Specifically addresses how to structure multi-party care conversations where the patient, family caregivers, and clinicians all have input — without any party dominating. The "Team Talk / Option Talk / Decision Talk" structure influences Module 17's dispute-resolution pattern. ([ascopubs.org](https://ascopubs.org/doi/10.1200/OP-25-00340))
- **Wolff & Roter — "Hidden in Plain Sight: Medical Visit Companions as a Resource for Vulnerable Older Adults" (Arch Intern Med, 2008)** — foundational study on how family companions influence older-adult medical decisions, both positively (autonomy-enhancing) and negatively (autonomy-undermining). Directly shapes the "facts, not blame" posture.
- **Journal of Hospital Medicine (2022) — "Things We Do for No Reason: Routine Postoperative Incentive Spirometry."** Included specifically to anchor the evidence-based stance that routine IS is not universally indicated — the kind of reference point the app uses when a stakeholder claims "this should have been done." Pragmatic use: keep references like this in the app's evidence library so disputes have a neutral arbiter. ([Wiley](https://shmpublications.onlinelibrary.wiley.com/doi/10.1002/jhm.12898))

---

## Rick's risk profile (unchanged from v0.2)

Multi-level lumbar fusion + sacral-pelvic hardware, third spine surgery; two small pulmonary emboli on anticoagulation; active pneumonia on antibiotics; history of septic infections; history of falls (plus the recent post-discharge event); Rick's autonomy preference.

New in v0.3 (stakeholder-structural, not clinical): **Linda was not present for discharge instructions.** This creates a known information gap that the app must remediate — not a fact to argue about, a gap to close.

---

## Modules 1–16 — carried forward from v0.2

All contents retained. Specific updates in v0.3:

### Module 1 (Profile) — additions
- Advance directive location and **explicit MPA holder field** with contact info.
- "Power of Attorney activated / not activated" flag — defaults to "not activated" (Rick is capacitated). Activation requires a clinician's documented determination of incapacity; the app won't auto-activate.

### Module 2 (Medications) — additions
- **"Last change made by / source"** field on every medication — not for blame, for audit. When sister pulls together the master list and reconciles, the history shows "prescribed by Dr. X on [date]," "reconciled by pharmacist on [date]," "new dose entered by Linda on [date] per surgeon's office call." Protects against later "where did this come from?" disputes.
- **Self-administration vs. assisted-administration flag per med.** Rick was self-administering before discharge; this is part of what the sister is upset about. The app should make self-administration explicit — which meds Rick handles himself, which need Linda's hand-off, which need direct supervision. This isn't a capacity judgment, it's a division of labor.

### Module 4 (Red-flag escalation) — additions
- **Escalation rationale log.** When a symptom is routed to 911 / surgeon / watch, the criteria that triggered the routing are captured. Protects against "you overreacted" and "you underreacted" disputes.
- **Post-event review.** After any escalation event (actual or called-off), a structured review captures what happened, what was decided, what was the outcome. Not blame — pattern data.

### Module 13 (Document Vault) — expanded and moved to Phase A
- **Discharge summary retrieval workflow** (now a task, not an assumption):
  - The patient has a legal right to the discharge summary. Task: request it from the hospital in writing (HIPAA-compliant request form template provided by the app).
  - Once received, upload to vault.
  - Reconciliation pass: compare every medication in the summary to the current med list; compare every ordered intervention (spirometry, brace, wound care, PT referrals, follow-up appointments) to what's actually happening at home; generate a gap report.
  - Any gaps are handled as follow-up tasks (call the surgeon's office, not as failures).
- **Operative report**, imaging, home health orders, PT/OT orders, any specialty consult notes — all uploaded and reconciled.
- This workflow closes the "Linda wasn't at discharge" gap *without making it about Linda*.

### Module 15 (Communications) — additions
- **Family update template** is strictly factual: vitals, meds taken, tasks completed, any events, next 24 hours. No "how's he doing" narrative, no editorializing. If sister or anyone else wants to add their own commentary in their own message, fine — but the app-generated update is facts.
- **Inter-family message log.** When stakeholders message about Rick's care (text, call notes), it can be logged in the app so everyone has the same record. Optional — some families won't want this.

---

## Module 17 — Role Clarification, Coordination & Dispute Resolution *(NEW)*

**Purpose:** Make the "who owns what" explicit so daily care doesn't keep colliding with capability claims. This module is the app acting as a family mediator.

### 17a — Role definitions (documented in the app)

| Role | Owns (default) | Authority | Boundaries |
|---|---|---|---|
| Rick | Self-reports, self-administered meds, self-initiated walks, his own provider communication | Own care decisions while capacitated | Red-flag thresholds still apply; objective gates on high-risk activities |
| Linda | Day-to-day care coordination, medication administration (when assisted), household operations, primary in-home observer | Day-to-day operational decisions within Rick's care plan | Not expected to do physical transfers unassisted given her own recovery |
| Sister (MPA) | Records aggregation, provider coordination calls, insurance/authorizations, external research, specialty appointments | **MPA decision authority ONLY when Rick is incapacitated** (documented by clinician). Otherwise: coordination contributor. | Does not override Rick's decisions while capacitated; does not override Linda's operational decisions within the care plan; does not edit others' logs |
| Ben | App configuration, technical operations, mediator on disputes, visibility across all roles | Technical / configuration decisions | Not the primary caregiver |
| Helpers / aides | Assigned tasks | Task-scoped | Time-limited access |
| Clinicians | Treatment plan | Clinical orders | Read-only outside their encounters |

These roles are visible to every stakeholder. Any stakeholder can request a role adjustment; changes are logged.

### 17b — MPA activation protocol

- Default state: **MPA inactive.** Rick is capacitated and makes his own decisions.
- Activation: requires a clinician (MD/DO/NP) documented determination of incapacity, uploaded to the app, with date and scope (is this permanent, temporary, for this admission, for this decision?). Activation is not a button sister presses — it's a clinical determination captured in the app.
- When active: sister has decision authority for the scope documented. All activation events are logged.
- Deactivation: when capacity is restored, a clinician notes it, the app marks MPA inactive again.
- The app does NOT allow sister to unilaterally activate MPA. This is the guardrail against the scenario where an alarmist caregiver invokes authority that isn't legally hers at that moment.

### 17c — Evidence-based dispute resolution (the "neutral arbiter" feature)

The app stores:

- **Actual discharge instructions** (from Module 13) — the canonical record of what was ordered at discharge.
- **Current orders** — what the surgeon, PCP, pulmonologist, hematologist are currently directing.
- **Evidence library** — references to the clinical guidelines the app is built around (ERAS 2021, NAON 2022, STEADI, AHA/ACC PE 2026, CHEST 2021 VTE, JHM 2022 on IS, etc.) with a plain-language summary of what each says.

When a dispute arises ("he should have been doing X"), the workflow is:

1. Capture the claim in the app (what is being asserted, by whom, about whom).
2. The app surfaces: (a) what was ordered at discharge / currently, (b) what the evidence library says, (c) what's logged as actually happening.
3. If there's a gap — either between orders and reality, or between the claim and the evidence — it gets routed as a follow-up task: call the surgeon's office for clarification, or update the care plan.
4. **The dispute is closed against documents, not against people.** The app doesn't record "sister was wrong" or "Linda missed this" — it records the clarification outcome.

This is the specific feature that protects Linda from being reflexively blamed and protects Rick from being over-treated based on well-meaning but imprecise claims.

### 17d — Communication-and-conflict norms (captured in the app as a one-time family agreement)

The app's onboarding includes a one-time family conversation, captured as a short document that everyone can refer back to:

- How do we want to be notified of changes? (Everyone together? Linda first? Sister first? Depends on the change?)
- How do we handle disagreements about care decisions? (Default path: consult the app's evidence and orders; if still unresolved, call the surgeon's office.)
- Who speaks to providers, for what purposes? (Linda for day-to-day; sister for records/specialty; Rick for anything he wants to speak to directly; Ben as needed.)
- What are we NOT going to do? (Litigate past decisions in front of EMTs; blame each other in front of Rick; make unilateral changes to the care plan without notice.)

This is voluntary and can be edited. It's the family's social contract, stored in the app so everyone has the same reference.

### 17e — Escalation paths

Visible to everyone:

- **Clinical emergency** (911 tier) → 911, then notify all stakeholders simultaneously via the app.
- **Clinical urgent** (surgeon-today tier) → call surgeon's office, log the call, notify all stakeholders.
- **Care plan change** (med change, new symptom cluster, new order) → logged in app, notified to all stakeholders, reconciled against prior plan.
- **Family dispute** about care → logged in app with the evidence-based dispute resolution flow (17c).
- **Administrative** (insurance, DME, scheduling) → sister owns by default; Linda can delegate up.

### 17f — What this module does NOT do

- It does not adjudicate between family members — the app is a neutral source of truth, not a judge.
- It does not override the MPA when it's active — legal authority is legal authority.
- It does not prevent family members from disagreeing — only from disagreeing based on memory or blame instead of documents.
- It does not replace family conversations — it supplements them with shared facts.

**Why this module:** JCO Three-Talk SDM model with family caregiver extension (2025); Wolff & Roter on medical visit companions as autonomy-enhancing or autonomy-undermining; AHRQ on structured caregiver engagement reducing post-discharge harm; pragmatic family-systems approach to multi-stakeholder chronic care coordination.

---

## Cross-cutting design requirements *(v0.3 updated)*

1. **Multi-stakeholder context awareness.** Rick's profile, Linda's profile, Sister's role, Ben's role, helpers' assignments — all modeled explicitly. The app is not a two-person tool.

2. **Authorization model (v0.3):**

   | Role | Read | Write | Delete | Provider contact | Override |
   |---|---|---|---|---|---|
   | Rick | Full own record | Own self-reports, own inputs | Own inputs only | Yes, initiates own | N/A (capacitated) |
   | Linda | Full Rick + own | Own log entries, Rick's med administration, household tasks | Own entries only | Yes, for day-to-day | No override authority |
   | Sister | Full Rick + documents + coordination | Her own coordination entries, document uploads, provider call notes | Her own entries only | Yes, for coordination/specialty | **Only when MPA activated** |
   | Ben | Full visibility | Configuration, role definitions, app settings | System-level | Generally not | Technical only, not clinical |
   | Helpers | Scoped to assigned tasks | Task completion | None | None | None |
   | Clinicians | Generated handoff views | External to app | None | External | N/A |

3. **"All of us" critical notifications.** Critical alerts fire to Rick, Linda, and Sister simultaneously (configurable in onboarding). Non-critical alerts go to whoever owns the workflow.

4. **Audit trail on everything.** Every entry has a timestamp and a source. This is for pattern analysis and for protection — if sister claims "Linda didn't do X," the log shows what was and wasn't done, and when, with timestamps that aren't negotiable.

5. **Evidence library is first-class.** Not a hidden FAQ — a surfaceable reference with plain-language summaries, accessible whenever a dispute arises. Pre-populated with the guidelines cited in this spec.

6. **Offline-capable data entry** (retained).
7. **Accessibility** (retained).
8. **HIPAA posture** (retained).
9. **Data portability** (retained).
10. **No diagnosis** (retained).
11. **Positive-framing defaults** (retained).
12. **No blame attribution in default views** (new — see Design Principle 5).

---

## Suggested build order *(updated for v0.3)*

**Phase A (build first — 0–14 days):**
- Module 1 (Profile including MPA holder, sepsis history, PE, pneumonia)
- Module 2 (Medications with administration-type flag and change-source audit)
- Module 3 (Vitals with respiratory and sepsis screen)
- Module 4 (Red-flag escalation with rationale log)
- Module 5 (Respiratory, PE, Anticoagulation)
- **Module 13 (Document vault) — discharge summary retrieval and reconciliation moved up. This is the single most important gap-closer for the current family dynamic.**
- Module 15 (ER Handoff PDF)
- Module 17 (Role Clarification — at minimum the role definitions table, MPA flag, and evidence library skeleton)
- Module 7 (Fall prevention)
- Module 10 (Rick's co-management — at minimum a read-only view; full interactivity in Phase B)

**Phase B (2–4 weeks):**
- Module 6 (Mobility)
- Module 8 (Care team expanded)
- Module 9 (Linda's caregiver ops)
- Module 10 (full interactive version)
- Module 11 (Home environment)
- Module 17 (full dispute-resolution workflow)

**Phase C (recovery, weeks 4–8):**
- Module 12 (Nutrition / bowel)
- Module 14 (Phase tracker)
- Module 15 (full communications hub with family update templates)

**Phase D (optimization, weeks 8+):**
- Module 16 (Analytics)
- Module 17 (e.g., the family communication norms document if not already captured)

---

## The specific "spirometer dispute" worked through the app (illustrative)

To make Module 17c concrete, here's how the app handles the claim "he should have been using incentive spirometry after discharge":

1. **Claim captured:** "Sister asserts Rick should have been using incentive spirometry post-discharge."
2. **App surfaces three anchors:**
   - *What was ordered at discharge:* [pending — this is exactly what Module 13's discharge summary retrieval is for]
   - *Current orders:* Pulmonology likely has IS as part of the pneumonia treatment plan; capture drug-specific order
   - *Evidence library:* "Post-lumbar-fusion routine incentive spirometry — common recommendation (multiple orthopedic practices) but evidence for preventing pulmonary complications is mixed (Journal of Hospital Medicine 2022 systematic argument against routine use; Cochrane 2014 insufficient evidence for upper abdominal; real-world adherence among spine surgery patients averages 3.5 uses/hour, Orthopedics 2012)"
3. **Gap identification:** If the discharge summary shows IS was ordered and wasn't being done, that's a gap (remediated, not blamed). If IS wasn't ordered, the evidence note softens the claim to "reasonable but not obligatory" — and regardless, IS is indicated now for the pneumonia and is already in Module 5.
4. **Resolution:** The app doesn't say "Linda was right" or "sister was right." It documents what was ordered, what the evidence says, and what's happening now. The dispute becomes a task ("verify discharge orders; ensure IS is happening now for pneumonia") rather than an argument.

This is what the app does a hundred times, across every disputable claim. The neutrality is the feature.

---

## References *(v0.3 additions marked ★★)*

All references from v0.1 and v0.2 retained.

- ★★ **Larsen T, et al. Things We Do for No Reason™: Routine use of postoperative incentive spirometry to reduce postoperative pulmonary complications. J Hosp Med. 2022;17:1010-1013.** https://shmpublications.onlinelibrary.wiley.com/doi/10.1002/jhm.12898
- ★★ **do Nascimento P Jr. et al. Incentive spirometry for prevention of postoperative pulmonary complications in upper abdominal surgery. Cochrane Database Syst Rev. 2014.** — the Cochrane review finding insufficient evidence for IS.
- ★★ **Eltorai AE et al. Postoperative incentive spirometry use. Orthopedics. 2012.** — spine surgery IS adherence data.
- ★★ **Gaudin A et al. Spine Surgery Patients' Perceptions of Postoperative Pulmonary Complications. 2023.** — patient perspectives on IS adherence.
- ★★ **Wolff JL, Roter DL. Hidden in plain sight: medical visit companions as a resource for vulnerable older adults. Arch Intern Med. 2008;168(13):1409–15.** — foundational on caregiver companion dynamics.
- ★★ **JCO Oncology Practice — Shared Decision Making Can—and Should—Actively Involve Family Caregivers (2025).** https://ascopubs.org/doi/10.1200/OP-25-00340
- ★★ **Clayman ML, Roter D, Wissow LS, Bandeen-Roche K. Autonomy-related behaviors of patient companions and their effect on decision-making activity in geriatric primary care visits. Soc Sci Med. 2005;60(7):1583–91.** — on how companion behaviors enhance or undermine patient autonomy.
