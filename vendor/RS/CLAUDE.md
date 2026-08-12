# CLAUDE.md — RS Design System

This repo is the RS Design System: design tokens, framework-agnostic CSS
components, docs, and a Figma library. **Read [`Design.md`](./Design.md) for the
full spec** before generating or changing any UI.

## Single source of truth

`tokens/` (W3C DTCG JSON) → compiled by Style Dictionary into:
- `dist/tokens.css` (CSS custom properties), `dist/tokens.scss`, `dist/tokens.js`
- `tailwind.preset.js`
- `dist/design-system.css` (tokens + components, bundled)

Never edit `dist/` or `tailwind.preset.js` by hand — edit `tokens/` and run `npm run build`.

## Rules when writing UI

- **No hard-coded values.** Reference tokens (`var(--color-purple-600)`, the Tailwind
  preset, or `tokens.js`).
- **Color roles:** primary Black `#000000` (`color.black`); secondary Purple —
  fg `#5F40A1` (`color.purple.600`), bg `#F4F0FB` (`color.purple.50`). Prefer semantic
  tokens (`text.*`, `bg.*`, `border.*`, `focus.ring`).
- **Buttons:** `.btn` + `.btn--solid` | `.btn--outline` (+ `.btn--accent` with either,
  `.btn--sm`/`--lg`, `.btn__icon`/`.btn--icon-only`, `.btn--loading`).
- **Reuse components:** `src/css/` also ships input, select, checkbox, switch, tabs,
  toast, popup, loading, spinner, refresh (JS behaviors in `src/js/`) — check
  `docs/components/` before building anything new.
- **A11y:** keep the purple focus ring; real `<button>`/`<a>`; WCAG AA pairings.

## Commands

| Command | What it does |
| --- | --- |
| `npm run build` | Rebuild tokens (`dist/`, `tailwind.preset.js`) and bundle CSS |
| `npm run tokens` | Tokens only |
| `npm run docs:dev` | Run the VitePress docs site locally |
| `npm run docs:build` | Build the docs site |

A more detailed, on-demand workflow lives in the skill at
`.claude/skills/design-system/SKILL.md`.
