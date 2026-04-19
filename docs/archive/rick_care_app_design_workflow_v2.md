# Design Workflow Guide — Rick & Linda Care App (v2.0)

**Purpose:** How to use **Claude Design** (claude.ai/design) to produce a design system + component library + screen prototypes + Claude Code handoff bundle for Module 01, before any production code is written.

**Who this is for:** Ben, as the operator running the design work.

**Change log v1.0 → v2.0:** Complete rewrite. v1.0 proposed a hand-rolled workflow using regular Claude conversations with React artifacts, because I (embarrassingly) didn't know Claude Design existed. Claude Design launched April 17, 2026 and is the correct tool for this workflow. This guide now uses Claude Design as the primary tool with a fallback-to-conversational workflow documented at the end.

**Why this matters for the build:** The Implementation Agent needs a visual reference it can trust. Claude Design's handoff bundle to Claude Code solves the "how does the design get into the build?" problem natively — you don't re-implement the prototype, you hand it over.

**Time estimate:** 3–5 hours of Claude Design work for Module 01, vs. the 6–8 hours v1.0 estimated. The design-system-from-codebase feature and native handoff cut iteration overhead significantly.

---

## 1. What Claude Design Does (and Why It Matters Here)

From the Anthropic launch announcement (Apr 17, 2026) and coverage:

- **Design system generation during onboarding.** Point Claude Design at your codebase and design files; it builds a design system (colors, typography, components) that every subsequent project uses automatically. This is the load-bearing feature for this app — once we have a design system, every Module's screens inherit it.
- **Import from anywhere.** Text prompts, images, DOCX/PPTX/XLSX, codebase, web capture. We'll use text prompts + our spec markdown files.
- **Refinement controls.** Inline commenting on specific elements, direct text editing, custom adjustment sliders that Claude generates (not hand-written code edits). This is materially better than the "tell Claude what to change in prose" pattern v1.0 proposed.
- **Organization-scoped sharing.** Relevant if you want your sister to review the design before approval. Not required but available.
- **Export formats.** Canva, PDF, PPTX, standalone HTML, or a folder. For our purposes, the key export is:
- **Claude Code handoff bundle.** "When a design is ready to build, Claude packages everything into a handoff bundle that you can pass to Claude Code with a single instruction." This replaces the entire "commit artifacts to repo, hope build agent references them correctly" dance I had in v1.0.

**Availability:** Included with Claude Pro, Max, Team, and Enterprise plans, with its own weekly limits separate from chat or Claude Code. Enterprise: off by default, admin-enabled.

---

## 2. Setup (One-Time)

### 2.1 Access Claude Design

Go to **claude.ai/design**. Verify your subscription grants access. If you're on Pro, you should have it; if on Team/Enterprise, an admin may need to enable it in Organization settings.

Note: Claude Design usage is metered separately from chat/Claude Code and has its own weekly limits. Per early user reports, a design system + one full prototype with iterations can consume a meaningful portion of a weekly allowance — budget accordingly, or expect to dip into extra-usage pricing.

### 2.2 Assemble input materials for onboarding

Claude Design's onboarding reads your codebase and design files to build the design system. At this stage of the Rick Care App we don't have a codebase yet — but we have richer material than a codebase: we have the full spec set. Claude Design also accepts DOCX/PPTX/XLSX and text uploads.

Prepare these files for upload during onboarding:

- `outline_v0.3.md` — product spec with design principles section
- `technical_foundation.md` — section 8 (UI Architecture) and the explicit stack choices (Tailwind, shadcn/ui, Radix, Lucide, Inter font)
- `module_01_profile.md` v1.1 — specifically §4 (Screens & UI) and §4.7 (shared components)
- Any brand-level preferences you have: if you've decided on color direction (e.g., "clinical-but-warm, avoid Apple-Health-blue"), write a one-page brand brief

If you don't have a brand brief, write one now — 5 minutes, one page, covering:
- **Tone:** e.g., "calm, competent, respectful. Not cheerful. Not hospital-sterile."
- **Audience:** "Linda at 3 AM. Rick in his recliner. Sister on a desktop reconciling records. Ben on a laptop reviewing."
- **Avoid:** "Anything that infantilizes Rick. Anything that uses red for non-critical states. Anything that requires precise finger targeting."
- **References (optional):** screenshots or URLs of apps that get the tone right (and wrong).

This brief will meaningfully shape the design system Claude Design produces.

---

## 3. Onboarding: Build the Design System

This is the first and most leveraged session. The design system produced here governs every subsequent project.

### 3.1 Start a new Claude Design project

Name it: **Rick Care App — Production Design System**

### 3.2 Onboarding prompt

Upload the files from §2.2. Then provide this description:

> "I'm building a multi-stakeholder clinical care coordination app for a family managing complex post-surgical care. The app has five distinct user roles (patient, primary caregiver, MPA-holder daughter, technical operator, and helpers) with differentiated views. Core design principles (detailed in the uploaded outline):
>
> 1. **Facts-not-blame UI.** Default views show what and when, not who. Actor attribution is opt-in via tap-to-expand, not shown by default.
> 2. **Autonomy-preserving for the patient.** The patient is a first-class user, not a subject. His view should feel collaborative, not surveilled.
> 3. **Positive framing.** Lead with wins (what was accomplished), not debts (what's overdue).
> 4. **Accessibility is non-negotiable.** WCAG 2.1 AA minimum. Dynamic type support. Large tap targets (44px min). Color never the sole information channel.
> 5. **Mobile-first, desktop-capable.** Primary operator is on a phone at 3 AM. Secondary operator (daughter) is on a desktop doing records work.
>
> Stack is locked: React + Vite + Tailwind CSS + shadcn/ui component patterns + Radix primitives + Lucide icons + Inter typeface with system fallback.
>
> Build a design system that:
> - Provides a semantic color palette (critical, warning, ok, neutral, info) with light and dark modes, WCAG AA contrast verified
> - Defines a type scale that works on 375px mobile through 1280px desktop
> - Defines spacing, border-radius, shadow, and motion tokens
> - Maps Lucide icons to the app's domain concepts: medication, vitals (by type), allergy, fall event, escalation tier, MPA status, incision check, provider, pharmacy, document, spirometry, walking session
> - Provides the shared component patterns listed in the module_01 spec §4.7: ActiveConditionsCard, AllergyBadge (with severity variants including life-threatening), HardwareDisplay, MPAStatusIndicator, ProviderContactCard, TimestampedEntry (the facts-not-blame component), ERHandoffButton, OfflineIndicator, ActionConfirmation (with typed-keyword variant for high-risk actions), TrafficLight gate indicator
>
> Tone: calm, competent, respectful. Not cheerful. Not hospital-sterile. Design should feel like a serious tool that trusts its users.
>
> Produce the design system. Show me each component in every state. I'll refine with you before we move to screens."

### 3.3 Review and refine the design system

When Claude Design produces the first pass, use its inline commenting and adjustment sliders to refine. Specific things to verify:

- **Life-threatening allergy badge** must be distinct enough to catch attention on a cluttered dashboard. Use the slider to tune visual weight if available; inline comment if not.
- **Critical color** must not be used for non-critical states. Reserve for 911-tier escalations, life-threatening allergies, active MPA status.
- **TimestampedEntry** default state must not show attribution. Tapping/expanding reveals it. Verify this default is correct.
- **MPAStatusIndicator inactive state** should look reassuring, not alarming. Green or neutral. Rick being capacitated is good news.
- **TrafficLight gate** should be clearly distinguishable from warning/critical states. It's informational ("not yet cleared"), not alarming.

Iterate until the system is solid. This is the most important session — every later session inherits it.

### 3.4 Save the design system

Claude Design persists the design system to your project automatically. Once you're satisfied, name the project state clearly (e.g., "Design System v1.0 — approved") so you can reference it.

---

## 4. Session 2: Module 01 Screens

With the design system in place, produce the Module 01 screens. Much faster than v1.0's approach because component decisions are already made.

### 4.1 Prompt

> "Using the approved design system, produce the screens for Module 01 (Patient Profile & Clinical Context). Reference the uploaded module_01_profile.md §4 for the full screen list and §5 for workflows.
>
> Prioritize these five screens for high-fidelity prototyping (the rest can be wireframe-fidelity):
>
> 1. **Profile home** (the dashboard) — mobile 375px primary, desktop 1024px secondary. This is the most-viewed screen; it has to be right. Reference §4.2 for the layout sketch.
> 2. **Surgery detail with hardware inventory** — mobile, showing the full hardware list with MRI compatibility flags per implant. Reference §4.3.
> 3. **Allergies screen** — mobile, demonstrating the severity hierarchy (life-threatening at top, in red) and the 'verified by' provenance pattern. Reference §4.4.
> 4. **MPA status screen** — mobile, showing the inactive state (Rick is capacitated, green, reassuring) and the activation upload workflow entry point. Reference §4.5.
> 5. **ER handoff generator** — mobile, showing the review-before-generate pattern and the single-page PDF preview. Reference §4.6.
>
> For the remaining screens (demographics editor, diagnoses, comorbidities, providers, pharmacies, insurance, emergency contacts, advance directive, fall history), produce wireframe-fidelity — enough to validate information hierarchy.
>
> Use realistic mock data reflecting Rick's situation: L1-L5 fusion with sacral hardware, bilateral hip replacements (2019), two small pulmonary emboli on apixaban, pneumonia on levofloxacin, sepsis history, fall history, MPA held by his daughter (inactive), BLT precautions active through ~June 2026. Allergies: penicillin (anaphylaxis, life-threatening), sulfa (rash, moderate), latex (contact dermatitis, mild)."

### 4.2 Iteration — what to verify

Test each screen as each stakeholder:

- **As Linda at 3 AM:** Is the profile home legible? Can she find 'generate ER handoff' without hunting? Do active conditions surface above the fold at 375px?
- **As Rick checking his own status:** Does the MPA status screen feel respectful? Does it explicitly show "you're the decision-maker"? Does his own view of his profile feel like his, not something about him?
- **As Sister reconciling records:** Is the 'verified by' provenance visible on allergies and diagnoses? When she taps TimestampedEntry, does the actor info appear cleanly?
- **As an ER doc scanning the handoff:** Do allergies jump out? Is hardware + MRI safety in the first third of the page? Is the anticoagulant (with last-taken time) impossible to miss?

Use Claude Design's inline commenting and sliders for refinement. For structural issues (wrong information hierarchy, missing content), iterate with prose.

### 4.3 Sign-off

Use Claude Design's share feature to get a review link. Walk through every screen and flow. If you want Sister or another family member to weigh in, share the link with view-only access.

Once approved, note the project state as "Module 01 Screens v1.0 — approved."

---

## 5. Session 3: Module 01 Interactive Prototype

The prototype is a clickable walkthrough of Module 01's primary user flows. This is what the Coordinator Agent's Phase 5 gate checks for.

### 5.1 Prompt

> "Using the approved design system and Module 01 screens, produce an interactive prototype that walks through the primary user flows of Module 01. This should be clickable with mock data.
>
> Flows to implement:
>
> 1. **Landing as Linda → view Rick's profile home** → tap into active conditions, see details
> 2. **Tap into Surgery detail** → view hardware → interact with the MRI compatibility tooltip per implant
> 3. **Tap Allergies → add a new allergy** → form validation, severity selection, save, see it appear in the correct severity section
> 4. **Tap MPA status → inactive state → tap 'Upload capacity determination'** → mock document upload → mock capacity determination form → confirmation screen → MPA indicator flips to active, notification state appears (mocked)
> 5. **Generate ER PDF** → review screen → generate → preview the one-page PDF
> 6. **Stakeholder switcher (toggle at top)**: switch to Rick's view → see his profile from his perspective (same data, slightly different affordances: he can view all, edit only his own entries). Switch to Sister's view → see the audit trail / provenance affordances surface.
>
> The prototype should feel real enough to validate the experience. Not production code — a design sandbox with mock state.
>
> Make the stakeholder switcher prominent so testing each role is fast."

### 5.2 Test the prototype

Click through every flow in each stakeholder role. Specifically try to break it:

- Hit back buttons in the middle of the MPA activation. Does it handle mid-flow cancellation gracefully?
- Tap 'Generate ER PDF' without an allergy on file. Does it still work? Does the PDF say "No known allergies"?
- Switch to Rick's view mid-flow. Does his view constrain editing appropriately without feeling punishing?
- Resize to 1024px desktop. Do layouts reflow usefully or just stretch?

Iterate.

### 5.3 Share for validation

Share the prototype link with anyone whose judgment you trust on this. Strong candidates:
- Linda (if she's willing and able during her own recovery)
- Your sister (yes, despite the dynamics — getting her input on the records affordances and the MPA workflow before build is genuinely useful, and involving her in approval reduces later pushback)
- A clinician friend if you have one

Collect their feedback. Iterate.

### 5.4 Sign-off

Once approved, note the project state: "Module 01 Prototype v1.0 — approved for build."

---

## 6. Handoff to Claude Code

This is where Claude Design earns its keep. In v1.0 of this guide, I had an awkward manual process: export artifacts, commit to repo, add to project knowledge, hope Claude Code references them correctly. Claude Design replaces all of that with a single handoff bundle.

### 6.1 Create the handoff bundle

In Claude Design's interface, use **Handoff to Claude Code**. From the product description: "When a design is ready to build, Claude packages everything into a handoff bundle that you can pass to Claude Code with a single instruction."

The bundle includes:
- Design system tokens (colors, typography, spacing, components)
- Screen specifications
- Interactive prototype reference
- Design intent notes (the why behind decisions)

### 6.2 Pass to Claude Code

Claude Code receives the bundle with a single instruction. The specific invocation per Claude Design's handoff flow, combined with our multi-agent build requirements from Module 01 §14:

> "Implement Module 01 Phase 5 (Screens) using this design handoff bundle as the visual and interaction specification. Before beginning, submit a Phase 5 Build Plan to the Coordinator Agent for review. The Build Plan should specify: which screens will be implemented in what order, any deviations from the handoff bundle and their rationale, and how the screens will be wired to the data access layer from Phases 1–3. Do not begin implementation until the Coordinator Agent signs off."

### 6.3 Coordinator gate

The Coordinator Agent's Phase 5 gate (per Coordinator Agent Instructions §4.2) now checks for:

- Claude Design handoff bundle present and accessible to the Implementation Agent
- Ben's sign-off recorded on the design (noted in `docs/decisions/module-01-design-signoff.md`)
- Implementation Agent's Phase 5 Build Plan submitted and reviewed

No manual reconciliation between a prototype artifact and production code — Claude Code consumes the bundle natively.

### 6.4 When Claude Code needs to deviate

If during build Claude Code finds the design impossible to implement exactly (e.g., a spacing choice conflicts with a responsive breakpoint, or a component state requires backend data that doesn't exist), it raises a deviation proposal via the standard flow (Module 01 §14.5). You revisit in Claude Design briefly, update, re-generate the handoff for the affected piece.

This is materially faster than v1.0's "go back, update the React artifact, re-export, update project knowledge" loop.

---

## 7. Design Sign-off Document

Even with Claude Design's native handoff, produce a sign-off document for the Coordinator Agent's gate check and for your own records:

```markdown
# Module 01 Design Sign-off

**Date:** YYYY-MM-DD
**Reviewer:** Ben
**Tool:** Claude Design
**Project state:** [name/URL of Claude Design project]
**Approved artifacts (in Claude Design project):**
- Design System v1.0
- Module 01 Screens v1.0
- Module 01 Prototype v1.0
- Claude Code handoff bundle (generated YYYY-MM-DD)

**Design system decisions worth noting:**
- [Any specific choices you want preserved: e.g., "Critical red reserved for 911-tier and life-threatening allergies only"]
- [Any deviations from the Module 01 ASCII wireframes in §4]

**Validation:**
- [ ] Tested as Linda at 3 AM (mobile, dark mode): pass
- [ ] Tested as Rick (patient view, autonomy check): pass
- [ ] Tested as Sister (desktop, records reconciliation): pass
- [ ] ER handoff PDF reviewed: one page, allergies and hardware visible in top third
- [ ] Accessibility check (contrast, tap targets, dynamic type): pass

**Open items (not blocking):**
- [any polish items deferred to a later iteration]

**Handback to Implementation Agent:**
Use the Claude Design handoff bundle linked above. Submit Phase 5 Build Plan to Coordinator for review before implementation begins.

— Ben
```

Commit this file to `docs/decisions/module-01-design-signoff.md`.

---

## 8. Later Modules

The design system built in Module 01's design work is reusable for every subsequent module. For modules 02, 03, 04, etc.:

- **If the module introduces new components:** one Claude Design session to add them to the design system, extending the existing system rather than starting over. Estimated time: 30–60 minutes.
- **If the module is purely new screens composed of existing components:** one Claude Design session to produce screens + prototype. Estimated time: 1–2 hours.
- **If the module is patient-facing (Module 10, Rick's Co-Management):** dedicated session even if the components exist, because autonomy-preserving design deserves its own review. Estimated time: 2 hours.

Claude Design's design system persistence means you don't repeat the foundational work. That's the biggest win over the v1.0 hand-rolled approach.

---

## 9. Fallback: If Claude Design Is Unavailable

If for any reason Claude Design access isn't working (rolling rollout, Enterprise admin hasn't enabled it, research preview has an outage), the v1.0 manual workflow still functions. The four-session plan in v1.0 (Principles → Component Library → Screen Wireframes → Clickable Prototype using React artifacts in regular Claude chat) produces equivalent artifacts, just with more manual handoff to Claude Code.

If you have to fall back:
- Use the system prompt from v1.0 §3 in a regular Claude conversation
- Produce React artifacts (the `Artifacts` feature in normal chat)
- Manually export and commit to the repo
- Reference them in the Claude Code build conversation's project knowledge

This path is slower and the handoff is manual, but it's functional.

---

## 10. Time Budget (Revised from v1.0)

| Session | v1.0 estimate | v2.0 estimate (Claude Design) |
|---|---|---|
| Design system / principles | 60–90 min | 45–75 min (faster: Claude Design builds it from docs) |
| Component library | 90–120 min | 30–45 min (faster: generated with design system) |
| Screen wireframes | 90–120 min | 60–90 min (faster: inherits system) |
| Interactive prototype | 120–180 min | 90–120 min (faster: prototype is native to the tool) |
| **Total** | **6–8 hours** | **3.5–5.5 hours** |

Plus ~30 minutes for review/sign-off paperwork, which is the same either way.

---

## 11. Notes on Usage Limits

Claude Design has its own weekly limits, separate from chat and Claude Code. Based on early user reports, the Module 01 workload (design system + 5 high-fidelity screens + wireframes + prototype + iterations) may consume a significant portion of a weekly allowance on Pro. If you're on Max, you have more headroom.

Practical tip: front-load the design-system session (Session 1). That's the most token-intensive because of codebase/document ingestion and system generation. Subsequent sessions reuse the system and consume less.

If you hit limits mid-project, you can:
- Enable extra usage (pay-as-you-go) in settings
- Wait until the weekly reset
- Finish the in-progress screen, export what you have, continue next week

Plan the design work during a week when you don't have other heavy Claude Design uses (if applicable).
