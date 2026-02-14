# Backend App Design Guide (Artist Dashboard)

This guide is the implementation spec for product, design, and engineering contributors.

Scope:
- backend dashboard UX/UI behavior
- mobile-first layout and interaction
- element-level implementation rules

Use this alongside `AGENTS.md`.

Decision rule:
- Prefer first-principles flow redesign over preserving legacy UI structure when they conflict.

## 1) Source-Backed Baseline (Use As Constraints)

These are not optional style preferences. They are baseline product constraints.

| Area | Rule for this repo | Source |
| --- | --- | --- |
| Touch targets | Target `48x48` CSS px for tappable controls. Never go below `44x44` for primary actions. Absolute minimum follows WCAG `24x24` with spacing exceptions. | [R1], [R2], [R3] |
| Bottom navigation count | Keep bottom nav to `3-5` top-level destinations. Overflow goes in More. | [R4] |
| Text contrast | Minimum `4.5:1` for normal text. | [R5] |
| UI component contrast | At least `3:1` for boundaries/icons/states needed to operate UI. | [R6] |
| Focus visibility | Focus indicator must be clearly visible with strong contrast and adequate area/thickness. | [R7] |
| Form labels | Always provide visible labels. Do not rely on placeholder-only labeling. | [R8], [R9] |
| Form error handling | Show field-level error + top summary; preserve entered values. | [R10] |
| Form complexity | Prefer one-question-per-step for complex flows; avoid giant forms. | [R11] |
| Drag interactions | If drag/reorder exists, provide non-drag alternatives (buttons/menu actions). | [R12], [R13] |
| Modal/dialog behavior | Trap focus, provide close control, keep keyboard path intact. | [R14] |
| Performance | Target Core Web Vitals good thresholds at p75: LCP <=2.5s, INP <=200ms, CLS <=0.1. | [R15] |

Inference applied from sources:
- Apple and Material differ (`44pt` vs `48dp`). For consistency, this repo targets `48x48` by default and treats `44x44` as fallback floor for dense layouts.

## 2) Product Structure And Navigation

### 2.1 App surfaces
1. Marketing + auth
2. Public profile
3. Backend dashboard (current priority)

### 2.2 Dashboard nav model
- Mobile: bottom nav `Home`, `Artworks`, `Exhibitions`, `Profile`, `More`
- `More`: `News & Links`, `Enquiries`, `Settings`
- Desktop: left rail with same labels and order

### 2.3 Global shell rules
- Keep one sticky top app bar with page title + primary contextual action.
- Preserve route context. Never hide where the user is.
- Every page must include obvious forward action and safe back path.

## 3) Canonical Flow Specs (Step-By-Step)

### 3.1 Onboarding
Steps:
1. Account creation/login
2. Username selection + live URL preview + availability check
3. Avatar + cover + short bio
4. Confirmation screen with CTA `Add first artwork`

Rules:
- Max one dominant task per step.
- Keep progress visible (`Step 2 of 4`).
- Save draft state between steps.

### 3.2 Add artwork
Steps:
1. Media upload
2. Core details (`title`, `year`, `medium`, `dimensions`)
3. Description + optional metadata (`price/POA`, edition, notes)
4. Visibility + ordering + publish

Rules:
- Allow multi-image upload and reorder.
- Show per-file upload progress and failed-file retry.
- Published artwork must have title + at least one image.

### 3.3 Add exhibition
Steps:
1. Basic details (`title`, `type`, `venue`)
2. Dates + location
3. Media/installation views
4. Related works + press links
5. Visibility + publish

Rules:
- Auto-derive status from dates (`upcoming/current/past`) but allow manual override.
- Add optional press links without forcing all fields.

### 3.4 Edit profile
Separate screens:
- Identity
- About
- CV
- Links/Contact

Rules:
- Do not combine all profile fields into one long form.
- Keep each screen save behavior explicit (`Save`, `Saving`, `Saved`).

### 3.5 Settings
Sections:
- Account details
- Password/security
- Notifications
- Privacy/visibility
- Billing placeholder (if inactive)

Rules:
- Destructive actions require confirmation dialog.
- Security changes require re-auth when needed.

## 4) Element-By-Element UI Spec

Each element includes implementation requirements, accessibility constraints, and state rules.

### 4.1 Top app bar
Purpose:
- Context, back navigation, one primary action.

Requirements:
- Height optimized for mobile thumb reach and notched safe area.
- Show page title as plain language task name.
- Include back affordance on non-root routes.

States:
- Default, scrolled, loading, disabled-action.

Accessibility:
- Icon buttons need accessible names.
- Hit area follows target-size rules.

### 4.2 Bottom navigation
Purpose:
- Fast switching between top-level destinations.

Requirements:
- 3-5 tabs only.
- Active destination visually clear by icon + label state.
- Keep labels short and stable.

States:
- Default, active, badge/attention, disabled (avoid unless necessary).

Accessibility:
- Selected tab announced programmatically.
- Keep contrast and touch target compliance.

### 4.3 Section header
Purpose:
- Label content block and expose one lightweight action.

Requirements:
- Left: section title; right: one action (`Edit`, `See all`, `Add`).
- Avoid nested card wrappers.

States:
- Default, action unavailable.

### 4.4 List row / preview item (artworks, exhibitions, links)
Purpose:
- Quick scan + quick actions.

Requirements:
- Thumbnail (if media), title, status chip, updated time.
- Entire row tappable to open details.
- Secondary row actions in overflow menu.

States:
- Draft, published, scheduled, errored upload.

Accessibility:
- Status cannot be color-only; include text label.

### 4.5 Primary/secondary button system
Purpose:
- Clear action hierarchy.

Requirements:
- One primary action per viewport region.
- Avoid multiple competing primary buttons in same section.
- Keep verb-led labels (`Add artwork`, `Save draft`, `Publish`).

States:
- Default, pressed, loading, success, disabled.

Accessibility:
- Disabled buttons must include explanatory text nearby when blocking progress.

### 4.6 Text input
Purpose:
- Structured metadata entry.

Requirements:
- Visible persistent label.
- Helper text only when necessary.
- Input mode aligned with data type (numeric for year/dimensions).

Validation:
- Validate on blur + on submit.
- Preserve user input on validation errors.

Accessibility:
- `label` association required.
- Error text linked with field semantics.

### 4.7 Textarea (bio/statement/description)
Purpose:
- Longer narrative input.

Requirements:
- Visible label + optional character guidance.
- Expandable height with sensible max before internal scroll.

States:
- Empty, typing, limit warning, error.

### 4.8 Select, segmented control, and switches
Purpose:
- Compact selection and binary states.

Requirements:
- Use segmented control for 2-4 mutually exclusive options.
- Use select for long option lists.
- Use switch only for immediate true/false toggles.

Rules:
- If a switch has delayed side effects, show confirmation or undo path.

### 4.9 Stepper/progress indicator
Purpose:
- Reduce form burden and provide orientation.

Requirements:
- Show current step index and total steps.
- Keep consistent next/back placement.
- Prevent accidental loss on navigation away.

States:
- Not started, in progress, completed, blocked.

### 4.10 Media uploader
Purpose:
- Add artwork/exhibition images quickly from phone/computer.

Requirements:
- Support multiple files.
- Show per-file progress with retry and remove.
- Preserve upload queue on temporary network issues.
- Validate file type/size before upload start.

Accessibility:
- Upload progress exposed with progress semantics.
- Provide text feedback, not color-only progress states.

### 4.11 Reorder control (drag-and-drop)
Purpose:
- Let artists control display order.

Requirements:
- Provide drag handle on draggable rows.
- Optimistic reorder response should feel immediate.
- Persist order explicitly or auto-save with visible confirmation.

Accessibility:
- Must provide non-drag alternative: `Move up`, `Move down`, `Send to top` actions.
- Keyboard-accessible reorder path required for web.

### 4.12 Full-screen image viewer
Purpose:
- Inspect artwork images in detail.

Requirements:
- Open from artwork page media tap.
- Support swipe/arrow navigation for multi-image sets.
- Include close, next/prev, index label (`2/6`), and optional caption.

Accessibility:
- Focus enters viewer on open and returns to trigger on close.
- ESC key closes on desktop.

### 4.13 Enquiry CTA block
Purpose:
- Convert profile/artwork interest into contact.

Requirements:
- Place CTA near artwork detail and profile contact sections.
- Include expectation text (what happens next).
- Validate mandatory contact fields.

States:
- Idle, sending, sent, failed.

### 4.14 Error summary + inline errors
Purpose:
- Fast correction without losing work.

Requirements:
- Inline message near invalid field.
- Top summary listing all errors on submit failure.
- Keep user-entered values intact.

Accessibility:
- Error summary announced to assistive tech.
- Link summary items to field anchors.

### 4.15 Bottom sheet / modal dialog
Purpose:
- Short decisions and scoped edits.

Requirements:
- Use bottom sheet on mobile for quick actions.
- Use modal for confirmation/destructive decisions.
- Include explicit close affordance.

Accessibility:
- Trap focus while open.
- Restore focus to trigger after close.

### 4.16 Toast / status banner
Purpose:
- Lightweight confirmation and status updates.

Requirements:
- Toast for passive success (`Saved`).
- Banner/inline alert for blocking failures.
- Avoid stacking many toasts.

Accessibility:
- Use appropriate live region behavior for status updates.

### 4.17 Empty state
Purpose:
- Guide first action when there is no content.

Requirements:
- One sentence explaining state.
- One clear CTA.
- Optional mini-example image if helpful.

### 4.18 Loading state
Purpose:
- Preserve perceived speed and prevent layout jump.

Requirements:
- Skeleton shapes should match eventual structure.
- Prevent major layout shifts between loading and loaded UI.

### 4.19 Success state
Purpose:
- Confirm completion and next action.

Requirements:
- Explicit confirmation copy (`Artwork published`).
- Offer immediate next action (`View live`, `Add another`).

## 5) Component Ownership Map (Current Repo)

Use this map when implementing or refactoring dashboard UI so ownership and expectations stay explicit.

### 5.1 `components/dashboard/ArtistDashboard.tsx`
Role:
- Current orchestration layer for profile, artworks, exhibitions, links/news, ordering, and persistence.

Rules:
- Keep this as orchestration/state shell, not long-term home for all field UIs.
- Move create/edit experiences into dedicated step-based routes/components as they mature.
- Preserve drag reorder only if non-drag alternatives are present.
- Keep optimistic updates but always show success/failure recovery.

### 5.2 `components/dashboard/DashboardBottomNav.tsx`
Role:
- Primary mobile dashboard nav.

Rules:
- Expand from 2 controls toward 3-5 stable top-level destinations.
- Keep icon + label pair for each item.
- Maintain target-size and selected-state accessibility requirements.

### 5.3 `components/dashboard/DashboardAddSheet.tsx`
Role:
- Quick create entry point (bottom sheet).

Rules:
- Keep one-action-per-tap choices with clear labels.
- Add keyboard/focus handling consistent with modal pattern.
- Ensure every option opens a guided step flow, not dense inline forms.

### 5.4 `components/dashboard/DashboardSectionHeader.tsx`
Role:
- Section context + back affordance.

Rules:
- Preserve explicit back affordance and page title clarity.
- Ensure back action has predictable destination and does not lose drafts without warning.

### 5.5 `components/dashboard/DashboardMediaEditCard.tsx`
Role:
- Row/card for artwork or exhibition with quick actions.

Rules:
- Keep status text visible (not color-only).
- Preserve drag handle + non-drag reorder menu actions.
- Confirm destructive actions and preserve undo/recovery where possible.

### 5.6 `components/dashboard/DashboardProfileHeader.tsx`
Role:
- Profile identity summary + top actions.

Rules:
- Keep share/edit actions explicit and accessible.
- Ensure avatar/cover alt text remains meaningful.
- Avoid adding decorative controls that compete with core profile tasks.

### 5.7 `components/dashboard/DashboardToggleSwitch.tsx`
Role:
- Binary state control (publish/visibility style toggles).

Rules:
- Use only for immediate true/false state changes.
- Add semantic labeling (`aria-label`/`aria-labelledby`) wherever used.
- If toggling is blocked by missing data, explain why adjacent to control.

### 5.8 `components/dashboard/SectionPreviewCard.tsx`
Role:
- Snapshot card linking to fuller section editor.

Rules:
- Keep one clear CTA path into full editing.
- Empty states must include direct next action language.
- Preserve readable text at mobile scale.

### 5.9 `components/dashboard/ArtworksMiniPreview.tsx`
Role:
- Public-facing style mini preview of artworks.

Rules:
- Maintain image integrity (no distortion/cropping surprises beyond intentional cover behavior).
- Always include title/year fallback text.
- Ensure preview does not replace full editing flow.

### 5.10 `components/dashboard/ExhibitionsMiniPreview.tsx`
Role:
- Public-facing style mini preview of exhibitions.

Rules:
- Keep date/location text concise and scannable.
- Preserve fallback copy when fields are missing.
- Keep hierarchy: title first, metadata second.

### 5.11 `components/dashboard/PreviewHeader.tsx`
Role:
- Header for preview contexts with back/share actions.

Rules:
- Keep back behavior predictable when history stack is absent.
- Share action must fail gracefully and keep user in flow.
- Ensure icon controls remain accessible and large enough for touch.

## 6) Screen-Level Requirements

### 6.1 Home
Must include:
- Pending drafts count
- Recent updates
- Quick actions: add artwork/exhibition/news

### 6.2 Artworks list
Must include:
- Search/filter by status
- Reorder mode
- Draft vs published indicators

### 6.3 Artwork editor
Must include:
- Stepper flow
- Media order controls
- Publish control with visibility preview

### 6.4 Exhibitions list/editor
Must include:
- Date status visibility
- Related artwork linking
- External link validation

### 6.5 Profile editor
Must include:
- Separate entry points for Identity/About/CV/Links
- Public profile preview entry

### 6.6 News & links
Must include:
- Content type selector
- Optional scheduling
- Link field validation

### 6.7 Enquiries
Must include:
- Message list and status
- Contact details panel
- Response tracking status

### 6.8 Settings
Must include:
- Account/security controls
- Privacy toggles
- Clear destructive-action confirmations

## 7) Content And Microcopy Rules

- Keep CTA labels verb-first.
- Prefer short direct helper text.
- Explain optional advanced fields briefly.
- Avoid internal jargon (`object`, `entry`) in user-facing UI.

## 8) Accessibility Acceptance Criteria (Per PR)

Every UI PR must prove:
1. Touch target sizing meets repo rules.
2. Contrast meets WCAG text/UI thresholds.
3. Keyboard path exists for all core actions.
4. Labels and errors are programmatically associated.
5. Drag/reorder has non-drag alternative.
6. Dialog/sheet focus behavior is correct.

## 9) Performance Acceptance Criteria (Per PR)

For changed flows/screens:
1. Core Web Vitals remain in good range at p75 targets.
2. No major CLS introduced by loaders/images.
3. Media views use responsive/lazy loading.
4. Expensive lists are virtualized or chunked where necessary.

## 10) Delivery Sequence (Recommended)

1. App shell + nav + state scaffolding
2. Onboarding flow
3. Artwork flow (list/create/edit/reorder/view)
4. Exhibition flow
5. Profile editor
6. News/links and enquiries
7. Settings hardening and edge cases

## 11) PR Review Checklist

- Is the flow split into steps instead of one giant form?
- Does each element follow this guide’s behavior and state rules?
- Is mobile the primary layout and interaction target?
- Are empty/loading/error/success states all implemented?
- Are accessibility and performance criteria explicitly verified?

## References

- [R1] Apple, Touch controls and text sizing guidance: https://developer.apple.com/design/tips/
- [R2] Material Design, touch target size guidance (48dp): https://m1.material.io/usability/accessibility.html
- [R3] WCAG 2.2 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- [R4] Material Design bottom navigation (3-5 destinations): https://m1.material.io/components/bottom-navigation.html
- [R5] WCAG 2.2 Contrast (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- [R6] WCAG 2.2 Non-text Contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- [R7] WCAG 2.2 Focus Appearance: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- [R8] W3C Forms Tutorial, labels required: https://www.w3.org/WAI/tutorials/forms/labels/
- [R9] WAI-ARIA APG, names/descriptions practice: https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/
- [R10] GOV.UK Design System, error message behavior: https://design-system.service.gov.uk/components/error-message/
- [R11] GOV.UK Service Manual, structuring forms as question pages: https://www.gov.uk/service-manual/design/asking-users-for-information
- [R12] WCAG 2.2 Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- [R13] WCAG 2.2 Pointer Gestures: https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html
- [R14] WAI-ARIA APG Dialog (Modal) pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- [R15] web.dev Core Web Vitals thresholds: https://web.dev/articles/vitals
