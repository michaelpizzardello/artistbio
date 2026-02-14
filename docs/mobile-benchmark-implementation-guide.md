# Mobile Benchmark Implementation Guide

Date: 2026-02-14
Purpose: convert top-app patterns into exact MVP decisions for ArtistBio.

## 1) Benchmark Patterns (What We Reuse)

### 1.1 Instagram
- Modular editing (profile settings split by area).
- Creation options appear after intent, not all at once.
- Fast context switching with minimal top-level actions.

### 1.2 Linktree
- One primary create action for content management.
- Reorder and visibility are practical, fast, and obvious.
- Strong focus on speed-to-publish and low cognitive load.

### 1.3 Uber and Airbnb
- Single dominant action per screen.
- Secondary actions moved into contextual surfaces.
- State clarity (what is pending, what is done, what needs attention).

### 1.4 Behance and Artsy
- Portfolio quality depends on metadata + media quality + clean presentation.
- Upload and publish confidence is critical.
- Creator workflows favor structured steps over giant forms.

## 2) First-Principles MVP Rules

1. One primary action in view, always.
2. No duplicate context labels or duplicate icon+text semantics.
3. Actions only appear when needed (staggered workflow).
4. Keep screens compact and calm; avoid ornamental UI noise.
5. Anything non-essential to first publish goes to deferred backlog.

## 3) Element-by-Element Decisions (MVP)

### 3.1 App-level primary action
- Use one prominent global `+` action for creation.
- Do not show `Add` text next to a `+` icon when both mean the same thing.
- If icon-only is used, accessibility label is mandatory (`aria-label="Add"`).

### 3.2 Add surface (sheet/modal)
- Tapping `+` opens one clean chooser: Artwork, Exhibition, News, Link.
- Keep this as a single-column or compact two-column list with clear labels.
- No secondary decorative containers inside containers.

### 3.3 Section headers
- Header should only show section title + essential utility action.
- Remove duplicated "Add" entry points if global `+` already exists.

### 3.4 Content cards (artworks/exhibitions)
- In single-type sections, do not repeat the type label on each card.
- Use card header space for unique metadata (year, medium, venue, status).
- Keep visible actions minimal:
  - Edit
  - Visibility toggle
  - Drag handle
- Move non-core actions (share/delete/move up/down/top) into overflow menu.

### 3.5 Drag and reorder
- Keep drag handle visible in reorder contexts.
- Do not show multiple reorder arrows inline by default.
- Non-drag reorder alternatives remain available inside overflow menu.

### 3.6 Inputs
- Visible label above each field (no placeholder-only fields).
- Compact field sizing and spacing rhythm.
- Validation appears near field and in one concise summary when needed.

### 3.7 Upload UI
- One primary upload affordance per step.
- Show file states clearly: uploading, success, failed.
- Failed uploads must expose retry without losing entered metadata.

### 3.8 Preview
- Preview is a core editing action and must stay easy to reach.
- Keep preview reachable from editing contexts without deep navigation.
- Preview should reflect current saved/draft state clearly.

### 3.9 Rounded surfaces and visual noise
- Do not wrap every control in rounded bubbles.
- Use one parent surface with disciplined spacing.
- Rounded corners should be consistent and restrained.

## 4) How Elements Work Together (Flow)

1. User lands on section list.
2. User taps global `+`.
3. User chooses content type in Add sheet.
4. User completes modular step flow.
5. User saves/publishes.
6. User taps Preview to validate public-facing output.

No giant all-in-one screen. No duplicate action paths.

## 5) Frontend-Backend Contract (MVP)

### 5.1 Persistence states
- `draft` and `published` must be explicit.
- `updated_at` is backend-controlled.

### 5.2 Username availability
- Identity flow must call backend check for username uniqueness.
- Response states: `available`, `taken`, `invalid`.

### 5.3 Media pipeline
- Upload to storage first, then persist metadata.
- Retry must be idempotent and not create duplicates.

### 5.4 News/links
- MVP requires real persistence (not memory-only) for creator trust.

## 6) MVP Scope Gate

Build now:
- Global `+` creation flow
- Modular editors (profile/artwork/exhibition)
- Clean list cards with minimal visible actions
- Upload + publish + preview loop

Defer:
- Advanced analytics
- recommendation engines
- complex role-based permissions
- advisory/sales workflows

Deferred items must be documented in `non-mvp-todo.txt`.

## 7) Sources
- Airbnb release: https://news.airbnb.com/airbnb-2025-summer-release/
- Uber redesign: https://www.uber.com/newsroom/were-redesigning-the-uber-app-just-for-you/
- Instagram app listing: https://apps.apple.com/us/app/instagram/id389801252
- Instagram profile/help reference: https://www.facebook.com/help/356648689595660
- Linktree app listing: https://apps.apple.com/us/app/linktree-link-in-bio-creator/id1593515263
- Behance app listing: https://apps.apple.com/us/app/behance-creative-portfolios/id489667151
- Behance upload help: https://help.behance.net/hc/en-us/articles/360005904314-Guide-Sharing-a-Work-in-Progress-from-the-Behance-iOS-app
- Artsy app listing: https://apps.apple.com/us/app/artsy-buy-and-sell-fine-art/id703796080
- Ocula city guides: https://ocula.com/cities/
