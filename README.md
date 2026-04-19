# PostopCare — Rick & Linda Care App

A multi-stakeholder postoperative care coordination PWA for families
managing complex post-surgical recovery.

## Stack

- **Frontend:** React 19, Vite 7, TypeScript (strict mode)
- **Styling:** Tailwind v4 (CSS-first config via `@tailwindcss/vite`),
  shadcn/ui, Radix primitives, Lucide icons
- **Fonts:** Inter (sans), JetBrains Mono (numeric values)
- **State:** TanStack Query (server), Zustand (client), React Hook Form + Zod
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- **Authorization:** Row-Level Security (RLS) — no separate API layer
- **PWA:** vite-plugin-pwa + Workbox
- **PDF:** react-pdf (ER handoff generation)
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Hosting:** Vercel (frontend), Supabase Cloud (backend)

Exact pinned dependency versions live in `package.json`. See
`docs/rick_care_app_technical_foundation.md` for architecture details.

## Package manager

**This project uses `pnpm`.** Do not use `npm` or `yarn` — mixing package
managers creates competing lockfiles and peer dependency drift.

If you don't have pnpm:

    npm install -g pnpm

## Getting Started

1. Node version: 20.19+ or 22.12+. Check with `node --version`.

2. Install dependencies:

       pnpm install

3. Copy environment variables:

       cp .env.example .env

   Then set the Supabase and other values per the comments in `.env.example`.

4. Start the dev server:

       pnpm run dev

## Scripts

- `pnpm run dev` — start Vite dev server at http://localhost:5173
- `pnpm run build` — build production assets
- `pnpm run preview` — preview production build locally
- `pnpm run typecheck` — run TypeScript strict type check
- `pnpm run test` — run Vitest (unit + component)
- `pnpm run test:watch` — Vitest in watch mode
- `pnpm run test:e2e` — run Playwright end-to-end tests
- `pnpm run lint` — run ESLint
- `pnpm run format` — format code with Prettier

## Repository layout

    src/                  — application source code
    ├── app/              — routing, providers, layouts
    ├── features/         — per-module business logic
    ├── components/ui/    — shadcn components
    ├── lib/              — Supabase client, utilities, PDF, push
    ├── hooks/            — shared hooks (includes useCareLog)
    ├── types/            — generated from Supabase + Zod-derived
    └── styles/           — global styles + Tailwind theme

    supabase/             — database + Edge Functions
    ├── migrations/       — timestamped SQL migrations
    ├── seed.sql          — dev seed data
    └── functions/        — Edge Functions (notify, escalate, mpa-*, er-handoff)

    docs/                 — product and technical documentation
    ├── rick_care_app_outline_v0.3.md
    ├── rick_care_app_technical_foundation.md
    ├── rick_care_app_coordinator_agent_v2.md
    ├── rick_care_app_design_workflow.md
    ├── rick_care_app_claude_code_kickoff.md
    ├── modules/          — per-module deep specs
    ├── design/           — Claude Design handoff bundle
    ├── build-plans/      — IA-produced build plans per phase
    ├── decisions/        — questions, deviations, contract-changes, signoffs
    └── archive/          — historical spec versions

    tests/                — test suites
    ├── unit/
    ├── component/
    ├── integration/
    └── e2e/

## Development workflow

This project is built by a multi-agent system with human oversight:

- **Implementation Agent (IA):** Claude Code, working in this repo.
  Writes migrations, types, components, tests, wiring.
- **Coordinator Agent (CA):** A separate Claude conversation using
  `docs/rick_care_app_coordinator_agent_v2.md` as its system prompt.
  Reviews plans, gates phases, detects drift.
- **Human operator (Ben):** Final authority. Approves plans and gates.

See `docs/rick_care_app_claude_code_kickoff.md` for starting a new
Module build. See `docs/modules/rick_care_app_module_01_profile.md`
§14 for the full multi-agent build protocol.

## Environment variables

Copy `.env.example` to `.env` and set runtime values. Secrets never
go in the repo; production secrets live in Supabase Secrets and Vercel
Environment Variables.
