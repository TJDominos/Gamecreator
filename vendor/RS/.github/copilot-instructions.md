# Copilot Instructions — RS Design System

This repository is the RS Design System. When generating UI or styles, follow the
design system. The full spec is **[`Design.md`](../Design.md)**; token values live
in **[`tokens/`](../tokens)** and compile to `dist/` + `tailwind.preset.js`.

## Hard rules

1. **Never hard-code colors, spacing, or radius.** Reference tokens — CSS variables
   (`var(--color-purple-600)`), the Tailwind preset, or `dist/tokens.js`. If a value
   is missing, add it to `tokens/` and run `npm run build` — do not edit `dist/`.
2. **Color roles:** primary = Black `#000000` (`color.black`); secondary = Purple —
   Foreground `#5F40A1` (`color.purple.600`), Background `#F4F0FB` (`color.purple.50`).
   Use semantic tokens (`text.primary`, `bg.subtle`, `focus.ring`, …) over raw ramps.
3. **Buttons:** use the existing classes — `.btn` + `.btn--solid` (primary) or
   `.btn--outline` (secondary); `.btn--accent` pairs with either (`--outline` =
   purple-outlined, `--solid` = purple tonal); sizes `.btn--sm`/`.btn--lg`; plus
   `.btn__icon`, `.btn--icon-only` (needs `aria-label`), and `.btn--loading`
   (with `aria-busy="true"`). Do not invent new button styles; extend
   `src/css/button.css` if truly needed.
4. **Reuse existing components.** `src/css/` already ships input, select, checkbox,
   switch, tabs, toast, popup (bottom sheet), loading, spinner, and refresh — with
   JS behaviors for input/select/popup/loading/refresh in `src/js/`. Check
   `Design.md` and `docs/components/` before writing new markup or CSS.
5. **Accessibility:** keep the purple focus ring, use real `<button>`/`<a>` elements,
   and ensure pairings meet WCAG AA (see the contrast table in `Design.md`).

## Workflow

- Tokens are the single source of truth: edit `tokens/*.json`, then `npm run build`.
- Components are framework-agnostic CSS in `src/css/` (plus vanilla-JS behaviors in
  `src/js/`); consume via `dist/design-system.css` and the `src/js/*.js` exports.
- When you add or change a component or token, update `Design.md` and `docs/`.
