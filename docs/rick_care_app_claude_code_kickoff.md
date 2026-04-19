# Module 01 — Claude Code Kickoff (Phase 1)

**Purpose:** The exact prompt to hand Claude Code to start Module 01 Phase 1 (Schema Migrations). Starting point for the build.

**When to use this:** Once the scaffold is installed, `pnpm run dev` works, `pnpm run typecheck` passes, and the repo is committed. If you're not there yet, finish `postopcare_scaffold_reset.md` first.

**When NOT to use this:** For Phases 2–7. Each phase has its own kickoff pattern (Phase 5 is in Design Workflow Guide §6.4). This doc covers the opening move.

---

## What Claude Code needs to know before starting

Before pasting the kickoff prompt, make sure these files are committed to the repo:

Required:
- `docs/outline_v0.3.md` (product spec)
- `docs/technical_foundation.md` v1.1 (stack + architecture)
- `docs/coordinator_agent.md` v1.0 (Coordinator Agent instructions)
- `docs/modules/01_profile.md` v1.2 (Module 01 deep spec)
- `docs/modules/01_design_system_contract.md` v1.0 (design contracts)

Not required yet (come later in phases):
- Design handoff bundle (Phase 5)
- Module 02+ specs (after Module 01 Phase 7)

If any of the required files aren't committed, do that first. Claude Code reads them from the repo.

---

## The Phase 1 kickoff prompt

Paste this into a fresh Claude Code session at the repo root (`/workspaces/postopcare`):

> I'm starting Module 01 of the Rick & Linda Care App. You are the Implementation Agent (IA). A separate Claude instance is running as the Coordinator Agent (CA); you will submit work to the CA at phase gates for review.
>
> **Your first job is NOT to write code.** It is to read the foundation documents, then produce a Module 01 Build Plan for Phase 1 (Schema Migrations). Submit the plan to me for review before starting any migration.
>
> **Read in this order** (full text, not skim):
>
> 1. `docs/outline_v0.3.md` — product spec
> 2. `docs/technical_foundation.md` v1.1 — stack (React 19 + Vite 7 + Tailwind v4 + Supabase), data model conventions, auth, RLS patterns, audit log conventions
> 3. `docs/coordinator_agent.md` v1.0 — how you and the CA operate; what gets escalated to me
> 4. `docs/modules/01_profile.md` v1.2 — Module 01 deep spec: §3 (Data Model), §6 (Business Rules), §7 (Validation), §9 (Audit), §10 (Acceptance Criteria), §14 (Multi-Agent Build Instructions), §15 (Integration Contracts)
> 5. `docs/modules/01_design_system_contract.md` v1.0 — only skim for now; fully relevant at Phase 4
>
> After reading:
>
> **Produce a Phase 1 Build Plan** at `docs/build-plans/module-01-phase-1-plan.md` covering:
> - Ordered list of migration files you propose to create (one per table per the spec's §3)
> - For each migration: table name, the RLS policies that go with it, the audit trigger, the indexes, the Zod/TypeScript type this will be paired with later
> - Open questions about the spec (quote the ambiguous text, propose a resolution)
> - Assumptions you're making that aren't explicit in the spec
> - Any proposed deviations from the spec, with justification
> - An explicit note on the `care_log` table (spec §15.7 in Module 01) — this is load-bearing for every subsequent module
>
> Submit the Build Plan to me (I'll route it to the Coordinator Agent). **Do not begin writing migrations until the CA has reviewed and I have approved.**
>
> Per Module 01 §14.5: if you find ambiguity or missing information, write your question to `docs/decisions/questions/module-01-{topic}.md` and flag me. Do NOT guess on a foundational module.
>
> Confirm you've read all five documents by summarizing, in 3–5 sentences, what Module 01 is and what Phase 1 delivers. Then produce the Build Plan.

---

## What to expect after you paste this

Claude Code will spend significant context reading the foundation documents. Expect:
- Probably 8–15 minutes of reading + summarizing
- A summary of Module 01 back to you (verify it matches your understanding)
- A draft Build Plan file in `docs/build-plans/module-01-phase-1-plan.md`
- Likely a few clarifying questions in `docs/decisions/questions/`

**What to do with the questions:** read them, answer them in the same file (or in the chat, and the answers get committed). If an answer reveals a gap in the spec, update the spec and re-commit before Claude Code proceeds.

---

## The Coordinator Agent workflow

For the CA pattern, open a separate Claude conversation (claude.ai, web interface — not Claude Code) with `rick_care_app_coordinator_agent.md` as the system prompt (use Projects, or paste the content with a "You are the Coordinator Agent for this project" header).

When the IA submits a Build Plan or phase deliverable:
1. Copy the plan + relevant context from the IA's output
2. Paste into the CA conversation with: "The IA has submitted this Phase 1 Build Plan. Review per your role."
3. The CA will produce a review: approvals, challenges, required changes, escalations to you
4. Route the CA's review back to the IA

It's two separate conversations because the IA and CA are designed to be adversarial and to not share context. That's the feature, not a bug.

---

## When you hit the first phase gate

After Phase 1 (migrations) is complete and tested, Claude Code will present it for gate review. You route to the CA. If the CA approves, you kick off Phase 2 with a similar (shorter) invocation:

> "Phase 1 is approved. Proceed to Phase 2 (Types & Zod schemas) per Module 01 §14.3. Produce a Phase 2 Build Plan first; submit for review before writing code."

The Phase 1 kickoff is the longest because it requires foundation-document reading. Subsequent phase kickoffs are short because the IA already has context.

---

## Context management

Module 01 will likely exceed a single Claude Code context window across all seven phases. Per Module 01 §14.7:

- Commit after every reviewable slice
- Before the context fills, the IA produces a `docs/handoff/module-01-in-progress.md` summarizing what's done, what's next, open questions
- A new IA session reads `handoff/module-01-in-progress.md` first, then picks up from the last committed slice

If the IA seems to be drifting from the spec or losing track of prior decisions, that's the signal to stop, have it write a handoff doc, and start a fresh session.

---

## Troubleshooting

**"The IA started writing migrations immediately without producing a Build Plan."**
That's a violation of the kickoff. Interrupt, point it at Module 01 §14.2, ask it to stop and produce the plan. Don't let it proceed — foundation work done without planning compounds.

**"The IA is asking many small questions instead of one Build Plan."**
Fine for the first session. Answer the questions, but also ask the IA to consolidate the remaining ambiguity into the Build Plan document rather than chatting them out.

**"The Coordinator Agent is rubber-stamping everything."**
Read the CA instructions doc; it should be challenging. If the CA is too agreeable, re-initialize the CA conversation with stronger emphasis on its adversarial role. Also verify you pasted the full CA instructions, not a truncated version.

**"The IA started writing to tables or RLS I didn't authorize."**
Revert the commit, point the IA at Module 01 §14.5 ("What the IA does NOT do"), and restart. Drift on foundation work is expensive — catch it early.

---

## Change log

- **v1.0** (Apr 19, 2026): Initial version. Phase 1 kickoff only. Subsequent phase kickoff patterns will be added as phases complete, or produced on demand.
