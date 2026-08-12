# Typography

The type system uses the **native system UI font** (`font.family.sans`) —
no web font is loaded. It resolves to the platform's own UI typeface
(SF Pro on Apple, Segoe UI on Windows, Roboto on Android/Linux), with
CJK coverage (PingFang SC, Microsoft YaHei, Noto Sans CJK SC) and emoji
fallbacks (Apple Color Emoji, Segoe UI Emoji).

## Scale

<div class="ds-demo" style="flex-direction:column; align-items:flex-start; gap:0.75rem;">
  <div style="font-size:2.25rem; font-weight:700;">4xl · 2.25rem (36px) — Display</div>
  <div style="font-size:2rem; font-weight:700;">3xl · 2rem (32px) — Heading</div>
  <div style="font-size:1.5rem; font-weight:600;">2xl · 1.5rem (24px) — Section</div>
  <div style="font-size:1.25rem; font-weight:600;">xl · 1.25rem (20px) — Subsection</div>
  <div style="font-size:1.125rem;">lg · 1.125rem (18px) — Lead</div>
  <div style="font-size:1rem;">md · 1rem (16px) — Body Large</div>
  <div style="font-size:0.875rem;">sm · 0.875rem (14px) — Body</div>
  <div style="font-size:0.75rem;">xs · 0.75rem (12px) — Caption</div>
</div>

## Type rules

Each step of the size scale has **one type rule** — a fixed pairing of size,
weight, and line-height. The bundled `dist/design-system.css` ships every rule
as a `.text-*` utility class, and maps the matching rules onto **native HTML
elements** so apps inherit correct type without opting in per element.

| Rule | Class | Token · Size | Weight | Line-height | Element |
| --- | --- | --- | --- | --- | --- |
| Display | `.text-display` | 4xl · 36px | 700 bold | tight | — |
| Heading | `.text-heading` | 3xl · 32px | 600 semibold | tight | `h1` |
| Section | `.text-section` | 2xl · 24px | 600 semibold | tight | `h2` |
| Subsection | `.text-subsection` | xl · 20px | 600 semibold | tight | `h3` |
| Lead | `.text-lead` | lg · 18px | 400 regular | normal | — |
| Body Large | `.text-body-lg` | md · 16px | 400 regular | normal | — |
| Body | `.text-body` | sm · 14px | 400 regular | normal | `body`, `p` |
| Caption | `.text-caption` | xs · 12px | 400 regular | normal | `small`, `figcaption`* |

\* `small` and `figcaption` additionally pick up `text.subtle` (65%);
`strong` / `b` take the semibold weight inline only.

<div class="ds-demo" style="flex-direction:column; align-items:flex-start; gap:0.5rem;">
  <span class="text-display">Display</span>
  <span class="text-heading">Heading</span>
  <span class="text-section">Section</span>
  <span class="text-subsection">Subsection</span>
  <span class="text-lead">Lead</span>
  <span class="text-body-lg">Body Large</span>
  <span class="text-body">Body</span>
  <span class="text-caption">Caption</span>
</div>

## Tokens

| Category | Tokens |
| --- | --- |
| Family | `font.family.sans`, `font.family.mono` |
| Weight | regular 400, medium 500, semibold 600, bold 700 |
| Size | `xs` 0.75rem (12px) · `sm` 0.875rem (14px) · `md` 1rem (16px) · `lg` 1.125rem (18px) · `xl` 1.25rem (20px) · `2xl` 1.5rem (24px) · `3xl` 2rem (32px) · `4xl` 2.25rem (36px) |
| Line height | `tight` 1.2 · `normal` 1.5 · `relaxed` 1.65 |
| Text color | `text.primary` (black) · `text.subtle` (black 65%) · `text.accent` · `text.disabled` |

Use `font.line-height.tight` for headings and buttons, `normal` for body copy.

The bundled `dist/design-system.css` sets a base layer: `body` gets the system
font and the Body rule (`font-size: var(--font-size-sm)` / 14px, `text.primary`,
`line-height: var(--font-line-height-normal)`), and the headings, `small`, and
`figcaption` pick up the type rules in the table above — so apps inherit the
full scale without opting in per element.
