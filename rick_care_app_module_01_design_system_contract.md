# Module 01 — Design System Contract (v1.0)

**Status:** Build-ready. Durable reference.

**Purpose:** This is the implementation-level contract for the design system that emerged from Module 01's Claude Design work in April 2026. It exists independently of the Claude Design project so that if that project is ever lost, modified beyond recognition, or re-exported in a lossy way, the IA still has an authoritative source for the tokens, components, and rules that every module must honor.

**Dependencies:** `rick_care_app_outline_v0.3.md`, `rick_care_app_technical_foundation.md` v1.1, `rick_care_app_module_01_profile.md` v1.2. Claude Design project "Rick Care App — Production Design System" (for pixel-level reference).

**Dependents:** Every module with UI.

**Stack:** React 19 + TypeScript strict + Tailwind v4 + shadcn/ui + Radix + Lucide. Colors in OKLCH. CSS-first theming via Tailwind v4's `@theme` directive + CSS variables.

---

## 1. Tenets (the four filters every design decision passes through)

These are inherited from the Claude Design Guidance document and elevated to contract-level so the IA can reference them without re-reading the HTML. Every PR reviewer — and the Coordinator Agent — should reject UI changes that violate one of these.

### 1.1 Family tool, not medical record

The app writes "Rick" and "Linda," not "Patient" and "Caregiver." It shows recovery progress, not medical-record numbers. MRN, height, weight, and code status belong in the ER handoff PDF — not the Today screen. If a field feels like it came from an EHR intake form, it probably shouldn't be on a primary surface. This tenet does not remove those fields from the data model; it constrains where they appear in the UI.

### 1.2 Calm when calm, assertive when not

Default surfaces are warm and low-contrast. Red, bold, and filled are earned states reserved for things that actually matter right now: a life-threatening allergy, a missed anticoagulant dose, an active MPA, a 911-tier escalation. Overusing urgency destroys the ability to signal it when it counts. If a design reviewer can't immediately name a concrete, acute clinical reason for a red element, that element is wrong.

### 1.3 Every stakeholder sees a different app

The navigation, the write affordances, and the primary surface change by role. Linda administers. Amy stewards the record. Rick does his own check-ins. Ben is the technical operator. Paid aides are scoped. This is not about hiding things from people — it's about giving each user a UI that fits their job. The `NAV_CONFIGS` pattern in §6 is the canonical implementation mechanism.

### 1.4 Writes are first-class citizens

Every action — mark-taken, log vitals, check-in, log fall, log symptom, add diagnosis, verify allergy, upload document — flows through the shared `useCareLog` store (defined in Module 01 §15.7 and in §7 of this doc), is attributed to a stakeholder, and surfaces somewhere meaningful. "What did I tap?" should always be answerable by scrolling the activity feed. Writes are not side effects of UI — they are the product.

---

## 2. Design tokens

### 2.1 Type & font

Primary: **Inter** (weights 400/500/600/700). Fallback stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.
Mono: **JetBrains Mono** (weights 400/500). Used only for: vitals values (BP, HR), phone numbers, timestamps, MRN. Never body copy.
Self-hosted (Google Fonts via `<link>` is acceptable for the Claude Design prototype; production must self-host per privacy posture).

Scale (implemented as utility classes; use the closest match, do not invent sizes):
- `t-display` — 34px / 600 / -0.02em / 1.1 — only for special landing moments
- `t-h1` — 24px / 600 / -0.015em / 1.2 — greeting on Today, screen titles
- `t-h2` — 18px / 600 / -0.01em / 1.25 — section titles, sheet titles
- `t-h3` — 15px / 600 / -0.005em / 1.3 — card titles, list item titles
- `t-body` — 15px / 400 / 1.5 — default narrative text
- `t-body-sm` — 13.5px / 400 / 1.45 — dense lists, metadata-rich rows
- `t-meta` — 12px / 500 / 1.4 / color `ink-3` — supporting and secondary info
- `t-label` — 11px / 600 / 0.06em letter-spacing / UPPERCASE — section kickers

### 2.2 Canvas & neutrals (warm, not cool gray)

```css
--canvas:      oklch(0.985 0.006 75);    /* warm off-white — primary background */
--surface:     oklch(1.00 0 0);          /* pure white — cards */
--surface-2:   oklch(0.975 0.006 75);    /* slightly sunken surface */
--surface-3:   oklch(0.955 0.008 75);    /* deeper sunken — inputs, keyboard hint */
--hairline:    oklch(0.92 0.008 75);     /* divider lines */
--border:      oklch(0.89 0.010 75);     /* card borders */
--border-strong: oklch(0.80 0.012 75);   /* emphasized borders */

--ink:   oklch(0.22 0.015 260);          /* primary text */
--ink-2: oklch(0.36 0.015 260);          /* secondary text */
--ink-3: oklch(0.52 0.012 260);          /* tertiary / meta */
--ink-4: oklch(0.68 0.010 260);          /* disabled / faded */
--ink-5: oklch(0.80 0.008 260);          /* near-placeholder */
```

### 2.3 Accent (brand)

**Calm teal.** Used sparingly — primary buttons, the "Now" dot in the timeline, active-nav-tab indicator. Not a decoration color.

```css
--accent:      oklch(0.52 0.09 195);
--accent-ink:  oklch(0.38 0.08 195);
--accent-wash: oklch(0.96 0.025 195);
--accent-edge: oklch(0.86 0.05 195);
```

### 2.4 Semantic state colors (earned)

These are **not** category tints. They carry meaning. Do not use them for decoration.

```css
--critical:      oklch(0.58 0.18 25);   /* red */
--critical-ink:  oklch(0.42 0.17 25);
--critical-wash: oklch(0.96 0.035 25);
--critical-edge: oklch(0.86 0.07 25);

--warning:      oklch(0.68 0.13 70);    /* amber */
--warning-ink:  oklch(0.48 0.12 70);
--warning-wash: oklch(0.97 0.03 80);
--warning-edge: oklch(0.88 0.06 80);

--ok:      oklch(0.62 0.11 155);        /* green */
--ok-ink:  oklch(0.42 0.10 155);
--ok-wash: oklch(0.96 0.03 155);
--ok-edge: oklch(0.86 0.06 155);

--info:      oklch(0.55 0.10 245);      /* blue */
--info-ink:  oklch(0.40 0.10 245);
--info-wash: oklch(0.96 0.025 245);
--info-edge: oklch(0.88 0.05 245);
```

When each is earned:
- **critical** — life-threatening allergy, missed anticoagulant dose >2h, active 911-tier escalation, overdue critical med, active MPA
- **warning** — trending wrong (3-day window), overdue dose 30–120 min, unverified important fact, low supply, MPA expiration within 30 days
- **ok** — taken, verified, stable, no concerns
- **info** — scheduled, neutral status, on-track, BLT active (a fact not a problem)

### 2.5 Category tints (the spine of the visual language)

Every clinical domain gets a pastel background + darker ink + matching edge. Used on `CategoryCard`, `cat-surface` tiles, section containers. These tints are decoration that conveys domain; they do not convey state.

```css
/* meds — mint */
--cat-meds-bg:     oklch(0.965 0.04 165);
--cat-meds-ink:    oklch(0.38 0.08 165);
--cat-meds-edge:   oklch(0.86 0.06 165);

/* vitals — sky */
--cat-vitals-bg:   oklch(0.965 0.035 230);
--cat-vitals-ink:  oklch(0.38 0.08 230);
--cat-vitals-edge: oklch(0.86 0.05 230);

/* surgery — sand */
--cat-surgery-bg:   oklch(0.965 0.035 75);
--cat-surgery-ink:  oklch(0.40 0.07 75);
--cat-surgery-edge: oklch(0.86 0.05 75);

/* allergy — rose (also used for fall history, incidents) */
--cat-allergy-bg:   oklch(0.965 0.035 20);
--cat-allergy-ink:  oklch(0.42 0.10 20);
--cat-allergy-edge: oklch(0.86 0.06 20);

/* mpa — lavender (also advance directive, legal authority) */
--cat-mpa-bg:       oklch(0.965 0.035 295);
--cat-mpa-ink:      oklch(0.40 0.08 295);
--cat-mpa-edge:     oklch(0.86 0.05 295);

/* people — peach (providers, family, aides, contacts) */
--cat-people-bg:    oklch(0.965 0.03 50);
--cat-people-ink:   oklch(0.42 0.08 50);
--cat-people-edge:  oklch(0.88 0.05 50);

/* recovery — sage (PT, check-ins, BLT, recovery progress) */
--cat-recovery-bg:  oklch(0.965 0.03 140);
--cat-recovery-ink: oklch(0.38 0.07 140);
--cat-recovery-edge:oklch(0.86 0.05 140);
```

**Rule:** Every primary content tile on a records surface uses one of these seven tints or neutral white. New modules do not invent new tints — they map their content to the closest existing tint (or propose a new one via contract-change review per §9).

### 2.6 Radii & shadow

```css
--r-xs:   6px;
--r-sm:  10px;
--r-md:  14px;   /* default card radius */
--r-lg:  20px;   /* hero cards, category tiles */
--r-xl:  28px;   /* rarely used, sheets/modals */
--r-pill: 999px; /* buttons, chips */

--shadow-0: 0 1px 2px oklch(0.2 0.01 260 / 0.05);
--shadow-1: 0 2px 8px oklch(0.2 0.01 260 / 0.06), 0 1px 2px oklch(0.2 0.01 260 / 0.04);
--shadow-2: 0 8px 24px oklch(0.2 0.01 260 / 0.10), 0 2px 6px oklch(0.2 0.01 260 / 0.05);
--shadow-raised: 0 14px 30px oklch(0.45 0.08 195 / 0.28), 0 4px 10px oklch(0.45 0.08 195 / 0.18);
```

### 2.7 Tailwind v4 theme wiring

All tokens above are declared as CSS variables in `:root` (with dark-mode overrides under `.dark`) and mapped to Tailwind v4 utilities via `@theme inline` in `src/styles/globals.css`. The IA does not hand-write color classes (e.g. `bg-red-500`); it uses semantic classes backed by variables (`bg-critical`, `text-critical-ink`, or the `.chip.critical` / `.cat-surface.cat-meds` class patterns).

Example globals.css structure (abbreviated):

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  /* all tokens from §2.2–§2.6 above */
}

.dark {
  /* dark-mode overrides — tuned in Claude Design review, not invented here */
}

@theme inline {
  --color-canvas: var(--canvas);
  --color-surface: var(--surface);
  --color-critical: var(--critical);
  --color-warning: var(--warning);
  --color-ok: var(--ok);
  --color-info: var(--info);
  --color-accent: var(--accent);
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

---

## 3. Canonical components

These are the components the IA implements in Phase 4 (per Module 01 §14.3). Every module reuses these — new modules do not invent replacements.

### 3.1 ScreenHeader

Every inner screen has one. Props: `title` (string), `kicker` (optional uppercase label), `onBack` (optional back handler), `trailing` (optional action button/element).

Behavior: sticky to the top of the screen when content scrolls. Back button is 44×44px minimum tap target. Kicker uses `t-label` styling in `ink-3` color.

### 3.2 HeroCard

Identity card. Two variants:
- **Recovery variant** (default): avatar with progress ring around it (`RecoveryRing`), week indicator ("Week 5 of 12"), name, role context ("Recovering from spine surgery · 77 y.o."), "View full profile" link.
- **Pre-recovery variant** (used during onboarding before surgery/recovery context exists): no ring, just avatar + name + context line.

Appears on Today (top), Profile home (top of records surface), Rick's view (top of patient app). Does not appear on inner screens — those have `ScreenHeader`.

### 3.3 CategoryCard

The pastel tile that links to a domain. Props: `tone` (one of the seven category tints from §2.5), `icon` (Lucide), `label` (domain name), `primary` (main line), `secondary` (supporting line), `badge` (optional small indicator, e.g. "2 unverified"), `chips` (optional array of `chip.*` spans), `onClick` (handler).

Behavior: whole card is tappable (do not add separate "Open" buttons — the chevron is the affordance). Min height 72px. Tapping navigates to the domain detail screen.

### 3.4 VitalsTile

Value + unit + sparkline + trend note. Props: `label`, `value`, `unit`, `trend` (array of numbers for sparkline), `tone` (`ok` | `warning` | `critical`), `foot` (trend note, e.g. "Stable this week" or "Trending down").

Behavior: Sparkline renders 7 data points by default. Tone determines sparkline stroke color. Value uses mono font. Tile is tappable to open the full vitals screen filtered to that metric.

### 3.5 MedCard

Pill glyph + dose + supply bar + state chip. Full contract lives in Module 02; Module 01 reserves the type export so cross-module uses (e.g. the ER handoff's medication section) render identically.

### 3.6 AllergyRow

Warmer list row; auto-elevates when `severity === 'life_threatening'`. Props: `allergy` (the Allergy record), `onOpen` (handler to open `AllergyDetailSheet`).

Behavior: Life-threatening allergies use a critical-tinted treatment even in list contexts; they should be visually impossible to miss. On Today, the most-severe allergy renders in a dedicated "Life-threatening allergies" section with the critical gradient wash.

### 3.7 Sheet (bottom-sheet modal)

The scaffold for all logging forms, detail sheets, and confirmation flows. Props: `onClose`, children. Behavior: slides up from the bottom, dismisses on backdrop tap, has a drag handle at the top (36×4px pill). Max height 90vh, scrolls internally if content exceeds.

Every write affordance in the app uses a Sheet-based form. No separate "form screens" — forms are always sheets over the current surface.

### 3.8 TimelineItem

The vertical row of the "Today's plan" timeline. Props: `time` (label), `state` (`ok` | `pending` | `warn` | `critical`), `isNow` (bool — render the accent "Now" anchor), `icon`, `title`, `subtitle`, `tone` (category), `actions` (optional array of buttons for pending items).

Behavior: state determines the dot treatment. `isNow` renders the big accent-colored "Now" dot with a wash ring. Tapping the item opens the relevant detail/logging sheet.

### 3.9 RecoveryRing

SVG progress ring around an avatar, count, or icon. Props: `progress` (0–1), `size` (default 96), `strokeWidth` (default 4), `children` (rendered in the center).

Used in HeroCard; reusable in Module 10 (Rick's recovery-progress primary surface) and anywhere a visual progress indicator helps reframe a clinical state as a recovery narrative.

### 3.10 SectionLabel

The spaced uppercase kicker that divides every screen into blocks. Props: children (label text), `action` (optional trailing link/button, commonly "See all >").

Used pervasively. Uses `t-label` styling.

### 3.11 TimestampedEntry (facts-not-blame)

The default pattern for displaying a record entry. Shows what + when. Tapping expands to reveal who (actor attribution). Actor is never shown by default on records surfaces.

Props: `entry` (any record with `created_at`, `created_by_user_id`, and type-specific content), `renderContent` (render function for the content block), `defaultExpanded` (bool, default false).

**Rule:** Any record-detail view that could show who-entered-it must use `TimestampedEntry`. Modules do not re-implement attribution display.

### 3.12 ERHandoffButton + ERPDFPreview

Triggers the ER handoff generator sheet and renders the one-page PDF preview. Preview layout is defined in Module 01 §4 and the Claude Design handoff bundle.

`ERPDFPreview` is extensible — Module 06 (Handoff family) extends it for surgeon follow-up, aide shift brief, and rehab admission variants. All variants share the same top-third-is-load-bearing discipline: allergies + hardware (+ MRI safety) + anticoagulant-with-last-taken visible before any other content.

### 3.13 MPAStatusIndicator

Compact MPA state indicator for the app header and anywhere cross-cutting MPA awareness is needed. Variants by status (`inactive` | `active` | `expiring_soon`) and by viewer role (Rick sees "You decide" framing; others see "Rick holds decisions" / "Amy is deciding").

Full framing rules in §5.

### 3.14 OfflineIndicator

Global header badge that appears when the network is offline. Indicates writes will queue via the outbox pattern. Disappears on reconnect; shows a brief "Synced" state transition.

### 3.15 ActivityFeed row

Compact row in the Today-screen activity feed (and the full audit feed in Module 07). Renders a care-log entry as a one-line summary with icon, summary text, timestamp, and actor name. Source of truth for the rendering is the `CareLogEntry.kind` — each kind has a canonical summary function exported from Module 01.

### 3.16 ActionConfirmation (with typed-keyword variant)

Sheet-based confirmation for high-risk actions. Default variant: simple "Are you sure?" with cancel + confirm buttons. Typed-keyword variant (for MPA activation, record deletion, etc.): requires the user to type a specific keyword before the confirm button enables.

### 3.17 TrafficLight gate indicator

Informational status tile for "not yet cleared" states (e.g., surgeon clearance pending, BLT precautions not yet lifted). Distinguishable from warning — uses neutral framing with a clear next-step affordance. Never uses critical red.

---

## 4. Alert taxonomy (three tiers, not a spectrum)

From Design Guidance §M03; codified here because Module 03 (Alerts) depends on this being settled before build.

### 4.1 Tier 1 — critical

**When:** Missed anticoagulant dose >2 hours. Life-threatening symptom flagged in check-in. Fall with any indication of injury OR any fall on anticoagulation. Vitals past a doctor-set threshold. Active 911-tier event.

**Delivery:**
- Push notification with sound (uses Rick's photo + one plain-language line)
- `critical-wash` banner takes over the top of Today with the specific concern + a one-tap resolution
- BottomNav's ER button pulses
- In-app display persists until resolved

**Rules:**
- Only one Tier 1 visible at once. Queue and show the next when current is resolved.
- Tier 1 never appears for something we can't name precisely. Never "Rick needs attention" — say what: "Rick's Apixaban is 2 hours overdue."
- Push notifications never use medical terms. "Anticoagulant non-compliance" is wrong; "Rick's blood thinner is 2 hours overdue" is right.
- Rick and paid aides see fewer Tier 1 alerts than Linda/Amy (scoped by role).

### 4.2 Tier 2 — attention

**When:** Overdue dose 30–120 min. Vitals trending wrong over 3 days. Unverified important fact. New document awaiting review (Amy's queue). MPA expiration in 30 days.

**Delivery:**
- In-app amber chip on the relevant surface
- Quiet push (no sound)
- Shows as a "Needs attention" count badge on Today
- Persists until resolved, dismissed, or snoozed

**Rules:**
- Tier 3 never becomes Tier 2 from accumulation. "5 unread updates" is not Tier 2.
- Aide role sees even fewer Tier 2 alerts than Linda/Amy.

### 4.3 Tier 3 — informational

**When:** "Amy added a note." "Dose logged by Aide." "New vitals logged." Anything the activity feed captures.

**Delivery:**
- In-app only, appears in activity feed
- Never interrupts

**Rules:**
- Never generates a push notification
- Never escalates to Tier 2 from count alone
- Is the default for every `useCareLog` entry that isn't inherently urgent

### 4.4 Resolution verbs (not just dismissal)

Alerts never just "go away." Actions on Tier 1 and Tier 2:
- **Resolve** — with a log entry explaining what was done (e.g., "Dose taken at 2:15pm, 3h late")
- **Snooze** — with a reason and duration
- **Escalate** — send to the next role up (Linda → Amy, Amy → Ben, or Linda → 911 for Tier 1 unresolved)

Tier 1 alerts never show a plain "X" dismiss button. Dismissing without action is a trap.

---

## 5. Rick-specific view rules (patient view as a different product)

From Design Guidance §M05. Rick's view is not a trimmed caregiver view. It is a different product that happens to share data.

### 5.1 Today surface for Rick

Strip to three things:
1. A warm greeting ("Good afternoon, Rick")
2. **One** primary action — the next thing he should do right now (take a pill, do a 30-second check-in, rest)
3. Recovery progress (RecoveryRing with week indicator)

Do not include: vital tiles, timeline, activity feed, ER banner (Rick doesn't need to generate an ER handoff for himself), alerts queue, records navigation tiles.

The caregiver's Today screen has a dozen things on it. Rick's has three. The more he sees, the less likely he uses it.

### 5.2 Readability

- Minimum text baseline 16px (not 15px)
- Primary action button minimum 56px tall (not 44px)
- Contrast ratios must pass WCAG **AAA** (not AA)
- Sparklines are excluded from Rick's view — they require scrutiny he won't give

### 5.3 One-handed thumb zone

Every tappable element Rick cares about sits in the bottom half of the screen. Bottom navigation stays. The caregiver quick-action row does not appear in Rick's view.

### 5.4 Plain language everywhere

- "Blood thinner" not "Apixaban"
- "For pain" not "Oxycodone"
- "Surgery healing" not "Post-op status"
- "How you felt yesterday" not "Check-in history"
- "You decide" not "MPA inactive"

The translation happens at the view layer — the underlying data still uses clinical terms. A display utility (`labelForRick(term)`) maps clinical to plain.

### 5.5 Hard rules

- Rick never sees MPA status as a warning state. When MPA is inactive, he is the holder — frame as "You decide." When MPA is active, frame as "Amy is making decisions for you right now" (not "MPA activated").
- Rick never sees his own fall history on Today. It's for caregivers.
- Rick's write affordances: only `mark-taken` and the 30-second check-in. Everything else is view-only. Adding allergies, editing diagnoses, uploading documents — not in Rick's view.
- Rick does not see the ER handoff button. (He can still generate one from his profile if he navigates to it, but it is not a primary affordance.)

---

## 6. Role-based view divergence (`NAV_CONFIGS` pattern)

### 6.1 The pattern

Each stakeholder sees a different bottom-nav configuration and a different Today surface. The pattern:

```typescript
type Stakeholder = 'linda' | 'rick' | 'amy' | 'ben' | 'aide';

type NavTab = {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  badge?: () => number | null;  // dynamic, e.g. Amy's "needs attention" count
};

type NavConfig = {
  primary: NavTab[];       // bottom nav tabs
  todaySurface: 'default' | 'rick_stripped' | 'amy_queue' | 'aide_scoped';
  writeAffordances: Set<string>;  // which actions are enabled
  alertTiers: Set<1 | 2 | 3>;     // which tiers this role receives
};

const NAV_CONFIGS: Record<Stakeholder, NavConfig> = { /* ... */ };
```

### 6.2 Per-role configuration summary

**Linda (primary caregiver):**
- Nav: Today, Rick (profile), People, Records, ER (red, always visible)
- Today surface: default (HeroCard, QuickActionsRow, Vitals tiles, Timeline, Life-threatening allergies, Activity feed, ER banner)
- Write affordances: all logging, all records editing except MPA activation
- Alert tiers: 1, 2, 3

**Amy (MPA holder / records steward):**
- Nav: Today, Rick, Records (primary), Handoffs, Activity
- Today surface: `amy_queue` — leads with "Needs attention" queue (unverified records, documents to review, provider phone numbers stale >8 months), then activity feed, then records categories
- Write affordances: all records editing, document upload, MPA activation (with capacity determination), allergy verification
- Alert tiers: 1, 2, 3

**Rick (patient):**
- Nav: Today, Me (profile), Activity (own check-ins)
- Today surface: `rick_stripped` (see §5.1)
- Write affordances: mark-taken, 30-second check-in
- Alert tiers: 1 (only those directly relevant to him — never "Linda didn't log your vitals")

**Ben (technical operator):**
- Nav: Today, Rick, People, Records, Admin
- Today surface: default (same as Linda) + an admin strip showing system health, permissions overview, recent audit events
- Write affordances: all; plus role assignment, export, settings
- Alert tiers: 1, 2, 3 + system-level alerts (offline devices, sync failures)

**Aide (scoped paid helper):**
- Nav: Today, Shift brief
- Today surface: `aide_scoped` — only shows shift time window, meds due during shift (no history), one-line "what to watch for", emergency contacts
- Write affordances: mark-taken (within shift window only), basic check-ins ("Rick seems OK / Rick seems off")
- Alert tiers: 1 only (and only alerts relevant to current shift)

### 6.3 Enforcement is dual-layer

Role restrictions are enforced both at the UI layer (conditional rendering, hidden affordances) and at the RLS layer (database-enforced). Never one without the other. A bug in the UI that shows Linda an MPA activation button must not be able to cause a database write — RLS must block it.

---

## 7. `useCareLog` universal write-store

Full contract in Module 01 §15.7. Implementation notes for the IA:

### 7.1 Table shape

```sql
CREATE TABLE care_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  household_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN (
    'med', 'vitals', 'checkin', 'fall', 'symptom',
    'record_edit', 'document', 'mpa'
  )),
  by_user_id UUID NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  corrects UUID REFERENCES care_log(id),  -- for correction entries
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_care_log_patient_ts ON care_log(patient_id, ts DESC);
CREATE INDEX idx_care_log_kind_ts ON care_log(patient_id, kind, ts DESC);
```

Append-only. `corrects` is how you "edit" — insert a new row pointing at the old one. The UI resolves the latest non-corrected entry when displaying current state.

### 7.2 RLS

- All stakeholders in the household can SELECT
- All stakeholders except aide can INSERT for kinds matching their `NAV_CONFIGS.writeAffordances`
- Aide can INSERT only `med` (mark-taken) and a restricted `checkin` kind, and only during active shift window
- Nobody can UPDATE or DELETE (append-only invariant enforced at RLS)
- MPA kind has tighter RLS: only Amy + Ben can INSERT, and only with a valid `capacity_determination_id` in `detail`

### 7.3 Realtime subscriptions

The `useCareLog` hook subscribes to the `care_log` table via Supabase Realtime, filtered by `patient_id`. New entries appear in subscribed components within 500ms of insert. Network-partitioned devices queue writes via the outbox pattern defined in `technical_foundation.md` §5.

### 7.4 Typed detail extensions

Each module that writes to `care_log` exports a typed Zod schema for its `detail` field. Examples:

```typescript
// Module 02 exports:
const MedDetailSchema = z.object({
  action: z.enum(['taken', 'skipped', 'refused']),
  name: z.string(),
  dose: z.string(),
  reason: z.string().optional(),  // for skipped
  route: z.enum(['oral', 'iv', 'im', 'topical', 'other']).optional(),
});

// Module 03 exports:
const VitalsDetailSchema = z.object({
  bp: z.string().regex(/^\d{2,3}\/\d{2,3}$/).optional(),
  hr: z.number().int().min(20).max(250).optional(),
  spo2: z.number().int().min(50).max(100).optional(),
  temp: z.number().min(90).max(110).optional(),
  rr: z.number().int().min(6).max(60).optional(),
  pain: z.number().int().min(0).max(10).optional(),
  orthostatic: z.object({ /* ... */ }).optional(),
});
```

Module 01 owns the base `CareLogEntry` shape. Downstream modules own their `detail` schemas.

### 7.5 Every write uses it

**The IA must not write any mutation in any module that does not route through `useCareLog.append()`.** A direct INSERT into `medications_log`, `vitals_readings`, `fall_events`, etc. without a corresponding `care_log` entry is a bug. The appropriate pattern is: in a single transaction, the domain INSERT happens AND the `care_log.append()` happens. The Coordinator Agent checks for this at every gate.

---

## 8. Handoff PDF variants

From Design Guidance §M06. The ER handoff PDF is the first of several handoffs — each with a different audience, density, and tone. All extend `ERPDFPreview`.

### 8.1 Variants

| Variant | Audience | Pages | Tone | Generation |
|---|---|---|---|---|
| **ER** (Phase A, Module 01) | Unknown ER clinician | 1 | Dense, clinical, 15-second read | One-tap from dashboard |
| **Surgeon follow-up** (Module 06) | Operating surgeon's office | 1–2 | Med adherence + PT + symptoms + questions | Triggered before scheduled visit |
| **Aide shift brief** (Module 06) | Paid aide starting shift | 1 | Friendly, photo-led, schedule-focused | Auto-generated for shift start |
| **Rehab admission** (Module 06) | Rehab facility intake | 3–4 | Full clinical history, all records | Manual, for rehab transfer |

### 8.2 Design rules across all variants

- **Review before generate.** Every handoff shows the user what will be included, with toggles for sensitive sections (insurance, MPA status, mental health), before the PDF exists.
- **One font, one weight, one accent color.** Handoffs do not use the app's pastel palette. Black-on-white with one critical red for "cannot take this" rows.
- **Attribution footer.** "Prepared by Linda · generated Apr 19, 2026 · sources: Brigham discharge 3/18, family-reported." This lets the reading clinician trust or discount specific data.
- **QR code in the footer.** Points to a time-limited web view of the same data so a provider can update the record without typing into the app.

### 8.3 ER handoff PDF layout (the template for all variants)

The top third is load-bearing. In order:
1. Patient identifiers (name, DOB, sex, emergency contact name + phone, MPA status)
2. **⚠ ALLERGIES** section — critical red for life-threatening at the top
3. **ACTIVE DIAGNOSES** — one-line summary per diagnosis, surgical history included
4. **CURRENT MEDICATIONS** — anticoagulant with last-taken time in bold

Then:
5. **SURGICAL HARDWARE** with MRI conditional note highlighted (amber)
6. **RECENT VITALS (24h)** in mono font
7. **CODE / AD / MPA**

Full layout referenced by implementation is in the Claude Design handoff bundle.

---

## 9. Contract change process

Adding to or changing any contract in this document (a new category tint, a new component, a change to the alert taxonomy, a change to the Rick-view rules, a `useCareLog` kind addition) follows the same process as Module 01 §15.10:

1. IA writes a proposal to `docs/decisions/contract-changes/{YYYY-MM-DD}-{topic}.md`
2. Coordinator Agent evaluates impact on all modules that render UI or write through `useCareLog`
3. If other modules are built, IA proposes a migration plan
4. Human approves
5. Dependent modules update in a coordinated stack

No silent contract changes. Specifically disallowed:
- A new module inventing a category tint (use an existing one, or propose a new one)
- A new module bypassing `useCareLog` for writes (every write goes through the hook)
- A new module adding a fourth alert tier or a "Tier 0" urgency (the three-tier system is load-bearing)
- A new module implementing `TimestampedEntry`-like attribution UI in its own components instead of using the canonical component
- A new module creating its own bottom-sheet modal pattern instead of using `Sheet`

---

## 10. References

- Claude Design project: "Rick Care App — Production Design System" at claude.ai/design (v2 · warm caregiver direction, April 2026)
- Claude Design handoff bundle at `docs/design/handoff-bundle-{date}/` (or wherever the IA stores it after export)
- Claude Design Guidance document (HTML) — source for §1 tenets, §4 alert taxonomy, §5 Rick rules, §6 role divergence, §8 handoff variants
- `rick_care_app_module_01_profile.md` v1.2 — data model, workflows, integration contracts
- `rick_care_app_technical_foundation.md` v1.1 — stack, auth, RLS patterns
- `rick_care_app_design_workflow.md` v2.0 — how the design was produced; referenced if design is updated
- `postopcare_scaffold_reset.md` — pinned package versions for the entire stack
