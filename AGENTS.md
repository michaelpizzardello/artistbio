# AGENTS.md

## Purpose
This file gives coding agents a concise operating guide for working in this repository.

## Project Snapshot
- Stack: Next.js (App Router) + TypeScript + React
- Styling: global CSS (`app/globals.css`) and utility-first patterns
- Data/source files: `supabase-import/*.csv`
- Supabase client helpers live in `lib/supabase/`

## Working Rules
- Keep changes minimal and task-focused.
- Preserve existing architecture and naming patterns.
- Do not rewrite unrelated files.
- Do not commit or expose secrets from `.env.local`.
- Prefer small, reviewable diffs over broad refactors.
- ask before using placeholder information or making up content 
- Prioritize mobile layout proportions first; treat desktop/tablet as secondary unless explicitly requested.

## File/Code Conventions
- Use TypeScript (`.ts`/`.tsx`) for app code.
- Follow existing component organization under `components/` and route files under `app/`.
- Reuse existing helpers in `lib/` before adding new utilities.
- Keep CSV headers and column order stable unless explicitly requested.
- Avoid introducing new dependencies unless necessary.

## Validation Checklist
Run relevant checks after edits:
1. `npm run lint`
2. `npm run build` (for structural or routing changes)

If a command fails due to unrelated pre-existing issues, report it clearly and separate it from your changes.

## Common Commands
- Install deps: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`

## High-Risk Areas
- Dynamic routes under `app/u/[username]/`
- Any changes to Supabase auth flow (`app/auth/callback/`, login/signup pages)
- CSV files in `supabase-import/` used for imports/migrations

## Change Reporting Format
When finishing work, include:
- What changed
- Why it changed
- Files touched
- Validation performed (or why not run)
