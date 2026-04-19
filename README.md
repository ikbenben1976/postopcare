# PostopCare

PostopCare is a React 19 + Vite + TypeScript scaffold built for a Supabase-first postoperative care platform.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — build production assets
- `npm run preview` — preview production build locally
- `npm run typecheck` — run TypeScript strict type check
- `npm run test` — run Vitest
- `npm run lint` — run ESLint
- `npm run format` — format code with Prettier
- `npm run playwright` — run Playwright E2E tests

## Structure

- `src/` — application source code
- `docs/` — product and technical documentation
- `supabase/` — Supabase migrations, seeds, and Edge Functions
- `tests/` — unit, component, integration, and E2E tests

## Environment Variables

Create `.env` from `.env.example` and set runtime values before launching.
