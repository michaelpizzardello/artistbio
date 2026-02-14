# AGENTS.md

## Purpose
This file gives coding agents a practical operating guide for this repository.

## Project Snapshot
- Stack: Next.js (App Router) + TypeScript + React
- Styling: global CSS (`app/globals.css`) and utility-first patterns
- Data/source files: `supabase-import/*.csv`
- Supabase client helpers: `lib/supabase/`
- Product shape: mobile-first artist website/profile builder + backend dashboard

## Product North Star
Build a mobile-first artist profile platform that combines:
- editorial quality and credibility of a White Cube-style artist profile
- simple publishing workflow similar to Linktree/Instagram

Primary user: independent artist managing their own profile.

Current delivery priority:
1. Backend dashboard app
2. Public profile quality
3. Marketing/auth flow consistency

## Working Rules
- Keep changes minimal and task-focused.
- Preserve existing architecture and naming patterns.
- Do not rewrite unrelated files.
- Do not commit or expose secrets from `.env.local`.
- Prefer small, reviewable diffs over broad refactors.
- Ask before using placeholder information or making up content.
- Prioritize mobile layout proportions first; treat desktop/tablet as secondary unless explicitly requested.

## Required Product Surfaces
1. Marketing/Lander + Auth
2. Public Artist Profile (`/[username]` or `/u/[username]`)
3. Backend Dashboard App (current priority)

## Dashboard IA Baseline
- Home
- Profile
- Artworks
- Exhibitions
- News & Links
- Enquiries
- Settings

## Core UX Principle
Use progressive disclosure. Avoid dense mega-forms. Split create/edit tasks into clear steps.

## Visual Quality Bar (Non-Negotiable)
- Every UI change must meet a premium consumer-app standard (Uber/Airbnb/Instagram-level polish).
- Reject generic, amateur, or "template/chatgpt-ish" UI output even if functionally correct.
- Any screen that looks unfinished must be iterated before merge (spacing rhythm, hierarchy, contrast, typography, and motion quality).
- Prefer intentional visual systems over one-off styling decisions.
- Mobile-first visual quality is the primary acceptance gate.

### Prohibited Visual Patterns
- Default-looking UI with weak hierarchy (uniform text sizes/weights and flat spacing).
- Inconsistent corner radius, shadows, stroke weights, or icon styles across adjacent components.
- Random color usage without semantic purpose.
- Placeholder-like copy or generic section labels that feel auto-generated.
- Crowded forms/cards without progressive disclosure.

### Required Design Review Pass
Before closing a UI task, agents must explicitly evaluate:
1. Hierarchy: Is primary/secondary information instantly scannable?
2. Spacing: Is there a consistent rhythm across sections and components?
3. Typography: Are size/weight/line-length decisions intentional and legible on mobile?
4. Color/Contrast: Is emphasis semantic and accessible, not decorative noise?
5. States: Do hover/focus/active/disabled/loading/empty/error states look finished?
6. Motion: Are transitions purposeful and subtle (no janky/default animations)?
7. Cohesion: Does this match surrounding screens and the product's premium tone?

If any answer is "no", continue iterating instead of shipping.

## Canonical Flows (Must Exist)
### Onboarding
1. Create account / login
2. Choose username + URL preview
3. Add avatar, cover, short bio
4. Prompt to add first artwork

### Add Artwork
1. Upload media
2. Enter core details
3. Add description + optional metadata
4. Set visibility/order + publish

### Add Exhibition
1. Basic details
2. Dates + location
3. Media
4. Related works + links
5. Publish controls

### Profile Editing
- Identity
- About
- CV
- Links/Contact

### Settings
- Account
- Password/Security
- Notifications
- Privacy/Visibility
- Billing placeholders (if not live yet)

## Element-Level Rules
Detailed element-by-element specs and behavior standards live in:
- `docs/backend-app-design-guide.md`
- `docs/mobile-benchmark-implementation-guide.md`
- `docs/visual-quality-checklist.md`
- `docs/overarching-style-ui-guide.md`

Use that file as the source of truth for:
- component-level behavior
- accessibility and state requirements
- mobile layout specs
- performance targets
- copy and interaction rules
- overarching visual language and token discipline across all app surfaces

## Coordination Source Of Truth
- Use `fixes.txt` as the live implementation tracker for current sprint state.
- When work changes status (done/in progress/blocked), update `fixes.txt` immediately.
- Remove outdated checklist items instead of appending contradictory notes.
- Put deferred ideas in `non-mvp-todo.txt` instead of active implementation docs.

## Research-to-Code Sync Rule
- Any UX research feedback must be validated against the current working tree before it is added.
- Feedback items in `fixes.txt` must include concrete file evidence from current code.
- If implementation changes, stale guidance must be removed or rewritten the same day.

## File/Code Conventions
- Use TypeScript (`.ts`/`.tsx`) for app code.
- Follow existing organization under `components/` and `app/`.
- Reuse existing helpers in `lib/` before adding new utilities.
- Keep CSV headers and column order stable unless explicitly requested.
- Avoid introducing new dependencies unless necessary.

## High-Risk Areas
- Dynamic routes under `app/u/[username]/`
- Supabase auth flow (`app/auth/callback/`, login/signup)
- CSV files in `supabase-import/` used for imports/migrations

## Validation Checklist
Run relevant checks after edits:
1. `npm run lint`
2. `npm run build` (for structural or routing changes)

If a command fails due to unrelated pre-existing issues, report it separately.

## Common Commands
- Install deps: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`

## Change Reporting Format
When finishing work, include:
- What changed
- Why it changed
- Files touched
- Validation performed (or why not run)
