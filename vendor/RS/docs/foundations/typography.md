# Typography

The type system uses the shared sans stack from `font.family.sans`:

`"SF Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`

## Scale

<div class="ds-demo" style="flex-direction:column; align-items:flex-start; gap:0.75rem;">
  <div style="font-size:2rem; font-weight:600;">First-level title · 32px / 600</div>
  <div style="font-size:1.5rem; font-weight:600;">Secondary title · 24px / 600</div>
  <div style="font-size:1rem; font-weight:600;">Emphasized text · 16px / 600</div>
  <div style="font-size:0.875rem;">Body / regular · 14px / 400</div>
  <div style="font-size:0.75rem; color:#000000a6;">Tips / note · 12px / 400 / #000000A6</div>
  <div style="font-size:0.625rem; color:#00000073;">Micro text · 10px / 400 / #00000073</div>
</div>

## Type rules

Each step of the size scale has **one type rule** — a fixed pairing of size,
weight, and line-height. The bundled `dist/design-system.css` ships every rule
as a `.text-*` utility class, and maps the matching rules onto **native HTML
elements** so apps inherit correct type without opting in per element.

| Role | Class | Token · Size | Weight | Color |
| --- | --- | --- | --- | --- |
| First-level title | `.text-title-1` | `font.size.3xl` · 32px | 600 semibold | `text.primary` |
| Secondary title | `.text-title-2` | `font.size.2xl` · 24px | 600 semibold | `text.primary` |
| Emphasized text | `.text-emphasis` | `font.size.md` · 16px | 600 semibold | `text.primary` |
| Body / regular | `.text-body` | `font.size.sm` · 14px | 400 regular | `text.primary` |
| Tips / note | `.text-tips` | `font.size.xs` · 12px | 400 regular | `text.subtle` |
| Micro text | `.text-micro` | `font.size.2xs` · 10px | 400 regular | `text.micro` |

`h1`, `h2`, `body`, `p`, `small`, and `figcaption` map to the matching role tokens
in `src/css/base.css`.

<div class="ds-demo" style="flex-direction:column; align-items:flex-start; gap:0.5rem;">
  <span class="text-title-1">First-level title</span>
  <span class="text-title-2">Secondary title</span>
  <span class="text-emphasis">Emphasized text</span>
  <span class="text-body">Body</span>
  <span class="text-tips">Tips / note</span>
  <span class="text-micro">Micro text</span>
</div>

## Tokens

| Category | Tokens |
| --- | --- |
| Family | `font.family.sans`, `font.family.mono` |
| Weight | regular 400, medium 500, semibold 600, bold 700 |
| Size | `2xs` 0.625rem (10px) · `xs` 0.75rem (12px) · `sm` 0.875rem (14px) · `md` 1rem (16px) · `lg` 1.125rem (18px) · `xl` 1.25rem (20px) · `2xl` 1.5rem (24px) · `3xl` 2rem (32px) · `4xl` 2.25rem (36px) |
| Line height | `tight` 1.2 · `normal` 1.5 · `relaxed` 1.65 |
| Text color | `text.primary` (black) · `text.subtle` (black 65%) · `text.micro` (black 45%) · `text.accent` · `text.disabled` |

Use `font.line-height.tight` for headings and buttons, `normal` for body copy.

The bundled `dist/design-system.css` sets a base layer: `body` gets the system
font and the Body rule (`font-size: var(--font-size-sm)` / 14px, `text.primary`,
`line-height: var(--font-line-height-normal)`), and the headings, `small`, and
`figcaption` pick up the type rules in the table above — so apps inherit the
full scale without opting in per element.
