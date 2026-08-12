# RS Design System

The single source of truth for the RS design language — **design tokens**,
**framework-agnostic CSS components**, and a **Figma library**, all derived from one
set of tokens.

<div class="ds-demo">
  <button class="btn btn--solid">Primary</button>
  <button class="btn btn--outline">Secondary</button>
  <button class="btn btn--outline btn--accent">Accent</button>
</div>

## Brand colors

- **Primary — Black** `#000000`
- **Secondary — Foreground Purple** `#5F40A1`
- **Secondary — Background Purple** `#F4F0FB`

## What's here

| Area | Where |
| --- | --- |
| Authoritative spec | [`Design.md`](https://github.com/tripletree/rs/blob/main/Design.md) |
| Design tokens (DTCG) | `tokens/` → `dist/tokens.{css,scss,js}` |
| Tailwind preset | `tailwind.preset.js` |
| CSS components | `src/css/` → `dist/design-system.css` |
| AI guidelines | `.github/copilot-instructions.md`, `CLAUDE.md`, `.claude/skills/` |

## Quick start

```html
<link rel="stylesheet" href="@tripletree/rs-design-system/design-system.css" />
<button class="btn btn--solid">Save changes</button>
```

See **[Colors](/foundations/colors)**, **[Typography](/foundations/typography)**,
and **[Button](/components/button)**.
