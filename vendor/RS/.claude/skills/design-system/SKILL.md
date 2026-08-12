---
name: design-system
description: Use the RS Design System when building or changing any UI, styles, colors, buttons, or components in this repo. Enforces design tokens as the single source of truth (primary Black #000000, secondary Purple #5F40A1 / #F4F0FB), the .btn solid/outline button API, and the tokens→build→docs workflow. Trigger whenever generating markup/CSS, adding a component or variant, or editing colors/spacing/radius.
---

# RS Design System skill

Follow this when producing or modifying UI in this repository. Authoritative spec:
[`Design.md`](../../../Design.md). Token values: [`tokens/`](../../../tokens).

## 1. Tokens are the single source of truth

- Values live in `tokens/*.json` (W3C DTCG). They compile via Style Dictionary to
  `dist/tokens.css` (CSS vars), `dist/tokens.scss`, `dist/tokens.js`, and
  `tailwind.preset.js`. The bundled stylesheet is `dist/design-system.css`.
- **Never** hard-code a color/spacing/radius and **never** edit `dist/` or
  `tailwind.preset.js` by hand. To add a value: edit `tokens/`, then `npm run build`.

## 2. Color roles

- Primary: Black `#000000` → `color.black`.
- Secondary: Purple — Foreground `#5F40A1` → `color.purple.600`; Background
  `#F4F0FB` → `color.purple.50`.
- Prefer **semantic** tokens in components: `text.primary`, `text.subtle`,
  `text.accent`, `text.disabled`, `text.danger`, `bg.subtle`, `border.accent`,
  `border.invalid`, `focus.ring`. Component-scoped groups (`button.*`, `input.*`,
  `select.*`, `checkbox.*`, …) also live in `tokens/semantic.json`.
- In CSS use the variable form, e.g. `color: var(--text-accent);`. In Tailwind use
  the preset. In JS import `dist/tokens.js`.

## 3. Buttons

Use existing classes — do not invent new button styles.

- Base (required): `.btn`
- Variant: `.btn--solid` (primary, black) **or** `.btn--outline` (secondary)
- Accent: `.btn--accent` — pair with `.btn--outline` (purple-outlined secondary)
  **or** with `.btn--solid` (purple tonal: Background Purple fill, Foreground
  Purple text)
- Size: `.btn--sm` / `.btn--lg` (default medium)
- Icon: `.btn__icon` on the `<svg>` (inherits `currentColor`); `.btn--icon-only`
  for a square icon-only button (always add `aria-label`)
- Loading: `.btn--loading` + `aria-busy="true"` (centered spinner, clicks blocked)
- States are automatic (`:hover`, `:active`, `:focus-visible`, `:disabled`).

## 4. Other components — check before building anything

The system already ships these (CSS in `src/css/`, docs in `docs/components/`):
button, input, select, checkbox, switch, tabs, toast, popup (bottom sheet),
loading (progress overlay), spinner, refresh, plus base/typography styles.
Input (number/currency formatting, soft length limit), select, popup, loading,
and refresh have JS behaviors in `src/js/`. **Reuse these instead of writing new
markup/CSS.**

If a genuinely new component/variant is required, add it to `src/css/` referencing
tokens, then update `Design.md` and `docs/`.

## 5. Accessibility

- Keep the purple `:focus-visible` ring. Use real `<button>` / `<a>` elements.
- Verify pairings meet WCAG AA (contrast table in `Design.md`). Disabled buttons use
  `disabled` or `aria-disabled="true"`.

## 6. Workflow checklist

1. Edit `tokens/` and/or `src/css/`.
2. `npm run build` to regenerate `dist/` + `tailwind.preset.js`.
3. Update `Design.md` and the relevant page under `docs/`.
4. Verify locally with `npm run docs:dev`.
5. Keep the Figma library variables/components in sync with token names.
