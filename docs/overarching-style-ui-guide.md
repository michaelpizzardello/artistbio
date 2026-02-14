# Overarching Style and UI Design Guide

This guide defines the single visual direction for artistb.io and documents the current UI audit findings from real route checks and mobile screenshots.

## Audit Scope and Method
- Routes reviewed in running app (`localhost:3000`): `/`, `/login`, `/signup`, `/dashboard`, `/app`, `/app/artworks`, `/app/exhibitions`, `/app/profile`, `/app/news-links`, `/app/enquiries`, `/app/settings`, `/u/demo`, `/privacy`, `/terms`.
- All above returned HTTP `200` in dev.
- Mobile screenshots captured via Playwright (`iPhone 13`) in `.tmp/ui-audit/`.
- Component-level review performed for all files in `components/artists/` and `components/dashboard/`.

## Current State: Major Visual Issues
1. Inconsistent visual language across product surfaces.
- Marketing uses neon lime and hard contrast (`app/page.tsx`), signup/login/dashboard use muted olive neutrals, public profile uses gallery-like white editorial style.
- This feels like three products, not one brand.

2. Token bypass via heavy hardcoded colors and ad-hoc values.
- Frequent direct hex colors in dashboard/auth components (for example `components/dashboard/DashboardAddSheet.tsx`, `components/dashboard/DashboardMediaEditCard.tsx`, `app/signup/page.tsx`).
- Design tokens in `app/globals.css` are underused for actual UI surfaces.

3. Type and spacing rhythm drift.
- Multiple one-off type sizes (`text-[10px]`, `text-[11px]`, `text-[14px]`, `text-[15px]`, `text-[24px]`, `text-[30px]`) and varying tracking choices.
- Creates uneven hierarchy and "assembled" rather than intentional feel.

4. Brand metadata and legal surfaces look unfinished.
- Global metadata still default (`app/layout.tsx`: `Create Next App`).
- Legal pages are placeholder-only (`app/privacy/page.tsx`, `app/terms/page.tsx`) and visually skeletal.

5. Dashboard pre-auth state lacks premium depth.
- All `/app/*` routes render the same basic unauth card state in mobile screenshots.
- Functional, but visually generic and low-information.

## Unified Visual Direction (Required)
Design language: `Editorial Minimalism + Product Clarity`

Desired feel:
- Calm, premium, art-forward.
- Strong typography and whitespace, restrained accent use.
- Motion and depth are subtle but deliberate.

Do:
- Prioritize legibility and hierarchy before decoration.
- Use one neutral foundation with one accent family.
- Keep component geometry coherent (radius, border, elevation, icon weight).

Do not:
- Mix unrelated palettes across routes.
- Introduce one-off colors/sizes unless promoted to tokens.
- Ship placeholder-like copy or default app metadata.

## Canonical Design Tokens
All new UI work should consume tokenized values only.

1. Color
- `bg/base`: app background
- `bg/surface`: cards, sheets, elevated panels
- `fg/primary`: primary text
- `fg/secondary`: support text
- `border/subtle`, `border/strong`
- `accent/primary` + `accent/primary-foreground`
- `state/success`, `state/warning`, `state/error`

2. Spacing scale
- Use a 4px base: `4, 8, 12, 16, 20, 24, 32, 40, 48`.
- No arbitrary spacing values unless tied to a known component rule.

3. Radius scale
- `sm: 8`
- `md: 12`
- `lg: 16`
- `xl: 24`
- Sheet top radius: `28` (already used; keep as modal signature).

4. Typography
- Display: 40/48, 32/40
- Heading: 28/34, 24/30
- Title: 20/26, 18/24
- Body: 16/24
- Small: 14/20
- Caption: 12/16
- Overline: 11/16 uppercase (limited usage)

## Component System Rules
1. Buttons
- Primary CTA: single high-contrast treatment per screen.
- Secondary CTA: outline or subtle tonal fill, never visually competing with primary.
- Minimum interactive target: 44x44 CSS px (prefer 48x48).

2. Inputs
- One field height family per surface (auth can use large fields; dashboard standard fields).
- Error, focus, and disabled states must be visually distinct and consistent.
- Placeholder contrast must remain readable.

3. Cards and Sheets
- Card borders and shadows must be standardized; avoid per-card custom recipes.
- Bottom sheets: shared backdrop opacity, handle, spacing, and action row pattern.

4. Navigation
- Bottom nav icon size and label style must be uniform.
- Active state should rely on one semantic accent, not multiple unrelated treatments.

5. Empty/Loading/Error states
- Must include: clear status text, next action, and consistent icon treatment.
- Avoid plain "blank with spinner" where a contextual skeleton can prevent visual dead time.

## Page-by-Page Guidance
1. Marketing (`/`)
- Keep bold first impression, but align palette with auth/dashboard neutrals and one accent.
- Replace flat neon block feel with more art-directed composition (depth/imagery/texture).
- Tighten hero text line length and CTA hierarchy for premium feel.

2. Auth (`/login`, `/signup`)
- Current direction is stronger than marketing; use this as base visual system candidate.
- Convert hardcoded colors into named tokens.
- Fix `/signup` build blocker (`useSearchParams` suspense boundary) so production quality is enforceable.

3. Dashboard (`/app/*`, `/dashboard`)
- Improve unauth state: add stronger orientation, feature preview, and trust cues.
- Standardize dashboard component colors and type to token system.
- Reduce icon accent noise (single accent family).

4. Public profile (`/[username]`, `/u/[username]`)
- This surface has strong editorial potential; keep restrained styling.
- Replace placeholder hero image treatment and generic fallback copy as soon as data is available.
- Ensure sticky profile menu has robust contrast on variable backgrounds.

5. Legal (`/privacy`, `/terms`)
- Move from placeholder pages to branded legal template with proper content hierarchy and reading width rhythm.

## Interaction and Motion Rules
- Keep transitions purposeful: 120-220ms for micro-interactions, 220-320ms for sheet/dialog transitions.
- Prefer opacity/transform transitions; avoid layout-jank animations.
- Use motion to explain state changes, not for decoration.

## Accessibility and Quality Baselines
- Text contrast: follow WCAG guidance (normal text target 4.5:1; large text 3:1).
- Touch targets: minimum 44x44 CSS px, preferred 48x48 equivalent for reliability.
- Keep reflow-safe layouts on narrow viewports.
- Always include alt text for non-decorative images.

## Enforcement Checklist (Before Merge)
1. No new hardcoded color hex values in component/page files unless adding tokens.
2. No new arbitrary text sizes unless mapped to type scale.
3. Primary flows have polished loading/empty/error states.
4. New screens match shared spacing, radius, and elevation scales.
5. Metadata and page copy read as production, not scaffold/placeholder.

## External References Used
- WCAG 2.1 Understanding: Contrast (Minimum)
  - https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- WCAG 2.1 Understanding: Target Size
  - https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
- WCAG 2.1 Understanding: Reflow
  - https://www.w3.org/WAI/WCAG21/Understanding/reflow.html
- NN/g: The Aesthetic-Usability Effect (2024-02-03)
  - https://www.nngroup.com/articles/aesthetic-usability-effect/
- Laws of UX: Aesthetic-Usability Effect
  - https://lawsofux.com/aesthetic-usability-effect/
