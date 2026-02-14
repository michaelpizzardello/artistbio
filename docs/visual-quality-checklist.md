# Visual Quality Checklist

Use this checklist for any UI-facing change before considering it done.

## Standard
- Target quality: premium consumer app polish (Uber/Airbnb/Instagram-level fit and finish).
- "Works" is not enough; it must also look intentional and production-ready.

## Pass/Fail Checks

1. Visual Hierarchy
- One clear primary action per screen/section.
- Headings, subheadings, and body text have deliberate contrast in size/weight.
- Eye path is obvious in under 3 seconds on mobile.

2. Spacing and Layout Rhythm
- Consistent spacing scale is used (no random 13px/22px-style gaps).
- Related items are visually grouped; unrelated items have breathing room.
- Card/list layouts align cleanly on both small phones and desktop widths.

3. Typography
- Line lengths remain readable on mobile.
- Font sizes and weights are consistent for equivalent UI roles.
- No placeholder-style microcopy or generic AI-sounding labels.

4. Color and Surfaces
- Color use maps to semantic meaning (primary, success, warning, destructive, muted).
- Surface elevation (borders/shadows/backgrounds) is coherent and not noisy.
- Contrast is accessible and focus states are visible.

5. Component States
- Required states exist and are styled: default, hover, focus-visible, active, disabled, loading, empty, and error.
- Skeleton/loading treatment matches final layout and avoids jumpy transitions.

6. Motion and Interaction Feel
- Motion is subtle and purposeful (not absent, not excessive).
- Transitions support orientation and feedback.
- No jank from layout shift during async updates.

7. Content Quality
- Copy is concise, specific, and human-sounding.
- Labels and CTA text are action-oriented and unambiguous.
- Empty states explain next steps clearly.

## Failure Policy
- If two or more sections fail, do not ship.
- If one section fails on a primary user flow, do not ship.
- Document what was fixed before handoff.
