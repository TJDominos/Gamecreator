# Spacing & Radius

Layout is built on a **4px base unit**. Spacing tokens step up from it for
padding, margin, and gaps; corner radii share the same dimension scale. Always
consume tokens (CSS variables, the Tailwind preset, or `tokens.js`) — never
hard-code pixel values.

## Spacing scale

A linear 4px scale (`space.1` = 4px) with larger steps doubling as the values
grow. Semantic aliases (`space.xxs` → `space.3xl`) map onto this same scale.
Each bar below is drawn at its real token width.

<div class="ds-scale">
  <div class="ds-scale__row"><span class="ds-scale__label">space.0 · 0</span><span>—</span></div>
  <div class="ds-scale__row"><span class="ds-scale__label">space.1 · 4px</span><span class="ds-bar" style="width:0.25rem"></span></div>
  <div class="ds-scale__row"><span class="ds-scale__label">space.2 · 8px</span><span class="ds-bar" style="width:0.5rem"></span></div>
  <div class="ds-scale__row"><span class="ds-scale__label">space.3 · 12px</span><span class="ds-bar" style="width:0.75rem"></span></div>
  <div class="ds-scale__row"><span class="ds-scale__label">space.4 · 16px</span><span class="ds-bar" style="width:1rem"></span></div>
  <div class="ds-scale__row"><span class="ds-scale__label">space.5 · 20px</span><span class="ds-bar" style="width:1.25rem"></span></div>
  <div class="ds-scale__row"><span class="ds-scale__label">space.6 · 24px</span><span class="ds-bar" style="width:1.5rem"></span></div>
  <div class="ds-scale__row"><span class="ds-scale__label">space.8 · 32px</span><span class="ds-bar" style="width:2rem"></span></div>
  <div class="ds-scale__row"><span class="ds-scale__label">space.10 · 40px</span><span class="ds-bar" style="width:2.5rem"></span></div>
  <div class="ds-scale__row"><span class="ds-scale__label">space.12 · 48px</span><span class="ds-bar" style="width:3rem"></span></div>
  <div class="ds-scale__row"><span class="ds-scale__label">space.16 · 64px</span><span class="ds-bar" style="width:4rem"></span></div>
</div>

| Token | Value | px | Typical use |
| --- | --- | --- | --- |
| `space.0` | 0 | 0 | reset / collapse |
| `space.1` | 0.25rem | 4 | base unit, hairline gaps |
| `space.2` | 0.5rem | 8 | icon ↔ label, tight padding |
| `space.3` | 0.75rem | 12 | compact control padding |
| `space.4` | 1rem | 16 | default padding / gap |
| `space.5` | 1.25rem | 20 | — |
| `space.6` | 1.5rem | 24 | card padding, section gaps |
| `space.8` | 2rem | 32 | block separation |
| `space.10` | 2.5rem | 40 | — |
| `space.12` | 3rem | 48 | large section rhythm |
| `space.16` | 4rem | 64 | extra-large section rhythm |

### Semantic spacing aliases

| Semantic token | Alias of | px |
| --- | --- | --- |
| `space.xxs` | `space.1` | 4 |
| `space.xs` | `space.2` | 8 |
| `space.sm` | `space.3` | 12 |
| `space.md` | `space.4` | 16 |
| `space.lg` | `space.6` | 24 |
| `space.xl` | `space.8` | 32 |
| `space.2xl` | `space.12` | 48 |
| `space.3xl` | `space.16` | 64 |

## Radius scale

<div class="ds-radii">
  <div class="ds-radius">
    <div class="ds-radius__box" style="border-radius:0"></div>
    <div>none</div><div class="ds-radius__label">0</div>
  </div>
  <div class="ds-radius">
    <div class="ds-radius__box" style="border-radius:0.25rem"></div>
    <div>sm</div><div class="ds-radius__label">4px</div>
  </div>
  <div class="ds-radius">
    <div class="ds-radius__box" style="border-radius:0.5rem"></div>
    <div>md</div><div class="ds-radius__label">8px</div>
  </div>
  <div class="ds-radius">
    <div class="ds-radius__box" style="border-radius:0.625rem"></div>
    <div>snug</div><div class="ds-radius__label">10px</div>
  </div>
  <div class="ds-radius">
    <div class="ds-radius__box" style="border-radius:0.75rem"></div>
    <div>lg</div><div class="ds-radius__label">12px</div>
  </div>
  <div class="ds-radius">
    <div class="ds-radius__box" style="border-radius:1.25rem"></div>
    <div>xl</div><div class="ds-radius__label">20px</div>
  </div>
  <div class="ds-radius">
    <div class="ds-radius__box" style="border-radius:9999px"></div>
    <div>full</div><div class="ds-radius__label">pill</div>
  </div>
</div>

| Token | Value | Use |
| --- | --- | --- |
| `radius.none` | 0 | square edges |
| `radius.sm` | 0.25rem (4px) | chips, small controls |
| `radius.md` | 0.5rem (8px) | cards, menus |
| `radius.snug` | 0.625rem (10px) | **multi-line inputs (textarea)** |
| `radius.lg` | 0.75rem (12px) | surfaces, modals |
| `radius.xl` | 1.25rem (20px) | **inputs (component default)**, large surfaces |
| `radius.full` | 9999px | **buttons (component default)**, pills, avatars |

## Usage

```css
/* CSS custom properties */
.card {
  padding: var(--space-6);
  gap: var(--space-4);
  border-radius: var(--radius-lg);
}
```

```html
<!-- Tailwind preset (same scale) -->
<div class="p-6 gap-4 rounded-lg">…</div>
```

The Tailwind preset maps the spacing scale onto `spacing` (`p-*`, `m-*`,
`gap-*`, …) and the radius scale onto `borderRadius` (`rounded-*`), so the
same tokens drive both raw CSS and utility classes.
