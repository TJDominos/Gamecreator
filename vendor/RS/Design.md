# RS Design System

The authoritative specification for the RS design language. This document is the
human- and AI-readable source of truth for **principles, color, typography, and
components**. The machine source of truth for values lives in [`tokens/`](./tokens)
(W3C DTCG format) and is compiled into `dist/` and `tailwind.preset.js`.

> **Rule of thumb:** never hard-code a color, radius, or spacing value. Reference a
> token. If a value you need does not exist as a token, add it to `tokens/` first.

- **Design tokens:** [`tokens/`](./tokens) → `dist/tokens.css`, `dist/tokens.js`, `dist/tokens.scss`
- **CSS components:** [`src/css/`](./src/css) → bundled as `dist/design-system.css`
- **Tailwind preset:** `tailwind.preset.js`
- **Interactive docs:** `docs/` (VitePress) — run `npm run docs:dev`
- **Figma library:** https://www.figma.com/design/pGzbgIgTk5NXteRflrGCSB — **Variables** (`Primitives` + `Semantic`, aliased) — colors (incl. `black-alpha/5·30·65`, `color/coin` #FDC700), the `space/*` scale, `radius/*`, and the `size/*` icon &amp; avatar scale (`size/icon-sm…xl`, `size/avatar-sm…2xl`) — two **Effect Styles** (`shadow/dropdown`, `shadow/popover`) — eight **Text Styles** — one per step of the size scale (Display, Heading, Section, Subsection, Lead, Body Large, Body, Caption) — the **Button** component set (36 variants: Variant Solid / Solid-Accent / Outline / Outline-Accent × Size Small/Medium/Large × State Default/Hover/Disabled), the **Input** component set (12 variants: Size Small/Medium/Large × State Default/Focus/Disabled/Invalid) and the **Textarea** component set (4 variants: State Default/Focus/Disabled/Invalid), the **Select** + **Select Option** component sets (10 variants: Type Form/Filter × State Default/Filled/Focus/Disabled/Error — no hover state on either type, and open adds no ring so there's no separate Open state; the chosen value is black regular; options State Default/Hover/Selected/Disabled with the purple ✓), the **Checkbox** component set (12 variants: Size Small/Medium/Large × State Unchecked/Checked/Disabled/Checked-Disabled — the disabled-checked box carries the neutral.400 ✓), the **Switch** component set (4 variants: State Off/On/Off-Disabled/On-Disabled), the **Tab** component set (3 variants: State Active/Inactive/Disabled), the **Popup** component (bottom sheet over the black-30% scrim), the **Loading** component set (State Determinate/Indeterminate — a slim progress bar with an optional percent label), the **Spinner** component (the brand clover + “Loading…” caption, for indeterminate waits), the **Refresh** component (a purple circular-arrow icon button that spins once on load and on click to refresh a value), and the **Toast** component (a dark 65% translucent surface with white text; content-sized 200–384px, viewport-clamped), all bound to the same tokens. The file mirrors the docs: a **Foundations** page (Colors + Typography scale + Spacing &amp; Radius) and a **Components** page with a docs board + component set for every component above.

---

## 1. Principles

1. **Tokens first.** Every visual value comes from a token. One change in `tokens/`
   propagates to CSS, Tailwind, Figma, and docs.
2. **Black is primary, purple is secondary.** Black carries primary actions and
   text; purple is the accent — used for focus, links, and secondary emphasis.
3. **Framework-agnostic.** Components ship as plain CSS classes so any stack
   (React, Vue, plain HTML) can consume them.
4. **Accessible by default.** Color pairings meet WCAG 2.1 AA; every interactive
   element has a visible focus state.

---

## 2. Color

### Brand

| Role | Token | Hex | Usage |
| --- | --- | --- | --- |
| Primary | `color.black` | `#000000` | Primary buttons, body text, strong borders |
| Secondary — Foreground Purple | `color.purple.600` | `#5F40A1` | Accents, links, focus ring, secondary emphasis |
| Secondary — Background Purple | `color.purple.50` | `#F4F0FB` | Subtle surfaces, hover tints |

### Ramps

Neutrals (`color.neutral.50`…`900`) cover text, borders, and disabled states.
Purple (`color.purple.50`…`900`) is anchored on **`50 = #F4F0FB`** (Background Purple)
and **`600 = #5F40A1`** (Foreground Purple). **Danger** (`color.danger.500/600`)
is the one functional hue — reserved for errors and validation
(`text.danger`, `border.invalid`); not a brand color. **Coin** (`color.coin` =
`#FDC700`) is a single gold accent for coin / currency icons and amounts only —
not a brand or UI color.

### Semantic aliases

Semantic tokens reference the ramps — **consume these, not raw ramp values**, in
component code:

| Token | References | Meaning |
| --- | --- | --- |
| `text.primary` / `text.accent` | black / purple.600 | Text colors |
| `text.subtle` / `text.disabled` / `text.danger` | black 65% / neutral.400 / danger.600 | Captions / disabled / error text |
| `bg.subtle` | purple.50 | Background Purple surface |
| `border.accent` / `border.invalid` | purple.600 / danger.600 | Borders |
| `input.*` | black 5% / black 10% / purple.600 / danger.600 | Field bg, border, focus, invalid |
| `focus.ring` | `color.purple.600` | Focus-visible outline |

### Contrast (WCAG 2.1 AA)

| Foreground | Background | Ratio | Result |
| --- | --- | --- | --- |
| `#FFFFFF` | `#000000` | 21:1 | ✅ AAA |
| `#000000` | `#FFFFFF` | 21:1 | ✅ AAA |
| `#5F40A1` (purple.600) | `#FFFFFF` | 7.6:1 | ✅ AAA |
| `#5F40A1` (purple.600) | `#F4F0FB` (purple.50) | 6.3:1 | ✅ AA |

---

## 3. Typography

- **Family:** `font.family.sans` → native system UI stack: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'` (no web font loaded)
- **Weights:** regular 400, medium 500, semibold 600, bold 700
- **Sizes:** `xs` 0.75rem (12px) → `4xl` 2.25rem (36px); `3xl` = 2rem (32px) (`font.size.*`)
- **Line height:** `tight` 1.2 (headings/buttons), `normal` 1.5 (body)
- **Type rules** — one rule per size step (size + weight + line-height), each shipped
  as a `.text-*` utility and mapped onto native elements by `dist/design-system.css`:
  - Display → `.text-display`: 4xl 36px / 700 / tight
  - Heading → `.text-heading`, `h1`: 3xl 32px / 600 / tight
  - Section → `.text-section`, `h2`: 2xl 24px / 600 / tight
  - Subsection → `.text-subsection`, `h3`: xl 20px / 600 / tight (`strong`/`b`: weight only)
  - Lead → `.text-lead`: lg 18px / 400 / normal
  - Body Large → `.text-body-lg`: md 16px / 400 / normal
  - Body → `.text-body`, `body`, `p`: sm 14px / 400 / normal
  - Caption → `.text-caption`, `small`, `figcaption`: xs 12px / 400 / normal (also `text.subtle`, 65%)

---

## 4. Spacing, Radius & Sizing

- **Spacing:** 4px base unit (`space.1`). Scale: `space.0` 0 · `1` 4px · `2` 8px ·
  `3` 12px · `4` 16px · `5` 20px · `6` 24px · `8` 32px · `10` 40px · `12` 48px
  (`space.*`). Drives padding/margin/gap via CSS vars (`--space-*`) and the
  Tailwind preset (`p-*`, `m-*`, `gap-*`).
- **Radius:** `radius.none` 0 · `sm` 4px (chips) · `md` 8px (cards/menus) ·
  `lg` 12px (surfaces/modals) · `xl` 20px (**inputs — component default**) ·
  `full` pill (**buttons — component default**) (`radius.*` → `--radius-*`, Tailwind `rounded-*`).
- **Sizing** (`size.*` → `--size-*`): fixed **square** boxes for the two elements
  not driven by the spacing scale — icons and avatars. Larger avatar steps go
  past where the 48px spacing scale stops. In the Tailwind preset as `width`,
  `height`, and the `size-*` utility (`size-icon-md`, `size-avatar-lg`, …).
  - **Icon:** `size.icon.sm` 16 · `md` 20 (default) · `lg` 24 · `xl` 32 (feature/empty-state; above this it's an illustration).
  - **Avatar** (square, usually clipped to a circle with `radius.full`):
    `size.avatar.sm` 24 · `md` 32 (default) · `lg` 40 · `xl` 48 · `2xl` 64 (profile headers).

---

## 5. Components

### Button

Apply `.btn` plus exactly one variant, and optionally a size.

| Class | Purpose |
| --- | --- |
| `.btn` | Base (required) |
| `.btn--solid` | **Solid** — primary action. Black fill, white text. |
| `.btn--outline` | **Outline** — secondary action. Transparent fill, black border/text. |
| `.btn--accent` | Purple modifier. With `.btn--solid` → purple tonal (Background Purple fill, Foreground Purple text); with `.btn--outline` → purple border/text. |
| `.btn--sm` / `.btn--lg` | Small / large size (default is medium). |
| `.btn__icon` / `.btn--icon-only` | Icon (`<svg>`) inside a button; `--icon-only` is square — pair with `aria-label`. |
| `.btn--loading` | Loading — centered spinner, content hidden, clicks blocked, brand color kept; pair with `aria-busy="true"`. |

**States** (automatic): `:hover`, `:active`, `:focus-visible` (purple ring),
and `:disabled` / `[aria-disabled="true"]`.

```html
<!-- Primary -->
<button class="btn btn--solid">Save changes</button>

<!-- Secondary -->
<button class="btn btn--outline">Cancel</button>

<!-- Purple tonal (solid + accent) -->
<button class="btn btn--solid btn--accent">Highlight</button>

<!-- Secondary, purple accent -->
<button class="btn btn--outline btn--accent">Learn more</button>

<!-- Sizes -->
<button class="btn btn--solid btn--sm">Small</button>
<button class="btn btn--solid btn--lg">Large</button>

<!-- Disabled -->
<button class="btn btn--solid" disabled>Disabled</button>
```

**Token mapping** (see `tokens/semantic.json`):

| Part | Solid | Outline |
| --- | --- | --- |
| Background | `button.solid.bg` (black) | `button.outline.bg` (transparent) |
| Text | `button.solid.text` (white) | `button.outline.text` (black) |
| Border | — | `button.outline.border` (black) |
| Hover bg | `button.solid.bg-hover` | `button.outline.bg-hover` |
| Disabled | `button.solid.bg-disabled` | 25% opacity |

**Accessibility:** use a real `<button>` (or `<a>` for navigation). Never rely on
color alone; keep the focus ring; disabled buttons use `disabled` or
`aria-disabled="true"`.

### Input

Apply `.input` to an `<input>` or `<textarea>`, optionally with a size. One
style; focus/disabled are automatic — no hover change (the filled field reads
like a surface). Full-width by default. For dropdowns, use the Select
component (below).

| Class | Purpose |
| --- | --- |
| `.input` | Base field (required) |
| `.input--sm` / `.input--lg` | Small / large size (default is medium). |
| `.input--invalid` | Error state — danger border/ring (or `aria-invalid="true"`). |
| `.input-field` + `.input-field__count` | Optional wrapper + in-field char counter (`--multiline` for textarea). |

**States** (automatic): `:focus`/`:focus-visible` (purple ring +
Foreground Purple border), `:disabled` / `[aria-disabled="true"]`, and
`.input--invalid` / `[aria-invalid="true"]` (danger-red border + ring).

**Formatting behaviour** (optional JS — `src/js/input.js`, auto-inits): opt in
per field with data attributes on a `type="text"` input. Formatting happens on
blur; while focused the field holds the plain number. The canonical value is
mirrored to `data-value` — read that on submit (or `rawValue(el)`).

| Attribute | Behaviour |
| --- | --- |
| `data-format="number"` | Positive integer — illegal chars dropped and leading zeros stripped while typing; thousand separators on blur. |
| `data-format="currency"` | Amount — digits + one point, max two decimals while typing; two decimals + thousand separators on blur (`1234.5` → `1,234.50`). |
| `min` / `max` | Clamped on blur — out-of-range values are **replaced with the limit**, not flagged. |
| `data-maxlength="N"` | Soft length limit — over-limit **warns instead of truncating**: field turns invalid (`aria-invalid`), the `.input-field__count` counter auto-updates and turns danger-red (`text.danger`). Native `maxlength` hard-truncates — don't use it for this. |

```html
<label>
  Email
  <input class="input" type="email" placeholder="you@example.com" />
</label>

<input class="input input--sm" placeholder="Small" />
<input class="input" placeholder="Disabled" disabled />

<!-- Invalid + message -->
<input class="input input--invalid" aria-invalid="true" aria-describedby="err" />
<span id="err" style="color: var(--text-danger)">Enter a valid email address.</span>
```

**Token mapping** (see `tokens/semantic.json`):

| Part | Token |
| --- | --- |
| Background | `input.bg` (black 5% · #0000000D) |
| Disabled | whole field at 60% opacity (`opacity: 0.6`) |
| Label | `input.label` (black) · required marker `input.required` (danger.500) |
| Text / placeholder | `input.text` (black) · `input.placeholder` (black 30% · #0000004D) |
| Border | none at rest (filled grey, no hover change) → `input.border-focus` (purple.600) on focus |
| Invalid | `input.border-invalid` (danger.600) · message `text.danger` (danger.600 · #C11717) |
| Radius | `radius.xl` (20px) single-line · `radius.snug` (10px) textarea |
| Height | 36px single-line · 114px textarea |

**Accessibility:** always pair with a `<label>`; keep the focus ring; use the
right `type`; mark unavailable fields with `disabled` / `aria-disabled="true"`.

### Select (custom, JS-driven listbox)

The system's only dropdown — use it wherever a value is picked from a list: a
`<button>` trigger plus a `role="listbox"` panel, enhanced by
`src/js/select.js` (keyboard + ARIA). Two types — classify first, never size
per page. All sizes carry a mobile and a desktop tier, switched at `48rem`.

| Class | Purpose |
| --- | --- |
| `.select` | Wrapper (relative); add `data-select` so the enhancer finds it. Alone = filter look. |
| `.select--form` | Form fields — grey fill, no border, full width (constrain at the container, ~28rem in single-column forms), input heights (48→36px), radius as input. |
| (filter, default) | List/data-page filters — white outlined pill, content-sized between 96px and 240px (60% of the container on mobile), 36→32px tall. |
| `.select__trigger` | The `<button>`. Error: `aria-invalid="true"` → danger border + `aria-describedby` message. Disabled: 50% opacity. |
| `.select__value` / `.select__caret` | Current label (black, regular, single-line ellipsis; grey `--placeholder` until first pick) / rotating chevron. |
| `.select__panel` | `role="listbox"` popover — max-height 288→320px then scrolls, max-width 320px, flips up (`--up`) when out of room. |
| `.select__option` | `role="option"` row — 44→36px tall, wraps to 2 lines max; selected = grey wash + purple ✓. |
| `.select-group` | Flex row of filter selects with the standard 8px gap. |

**Behaviour** (`initSelects()`): click / Space / Enter / ↓ open; ↑↓/Home/End
move; type-ahead jumps to matching options; Enter selects; Esc closes;
click-outside closes; the active option is exposed via `aria-activedescendant`;
optional `data-name` mirrors the value into a hidden input; emits a
`select:change` event. Panel fades in 150ms / out 100ms (none under
`prefers-reduced-motion`). On mobile, prefer the bottom sheet (Popup) for
lists past ~12 options.

**Token mapping** (see `tokens/semantic.json`; `*-mobile` = mobile tier):

| Part | Token |
| --- | --- |
| Form trigger | `select.form-bg` (black 5%, no border, no hover change) · sizes `select.form-*` |
| Filter trigger | `select.filter-bg` (white) · border `select.filter-border` (black 10%, no hover change) · sizes `select.filter-*` |
| Value / placeholder | `select.value` (black, regular) · `select.placeholder` (black 30%, regular) |
| Chevron / error | `select.caret` (black 60%) · `select.icon-size` · `select.border-invalid` (danger.600) |
| Panel | `select.panel-bg` (white) · hairline `select.panel-border` (black 10%) · `select.panel-*` sizes · `shadow.popover` (0 8 24 black 12%) · 4px inset; options `radius.sm` |
| Option | `select.option-text` (black) · hover `select.option-hover-bg` (black 5%) · selected `select.option-selected-bg` + ✓ `select.option-check` (purple.600) · sizes `select.option-*` |

**Accessibility:** real `<button>` trigger; full keyboard model (incl.
type-ahead) and listbox roles with `aria-activedescendant`; keep the purple
focus ring; mark unavailable triggers `disabled`; drive errors with
`aria-invalid` + `aria-describedby`.

### Checkbox

Apply `.checkbox` to a native `<input type="checkbox">`. Checked fills
Foreground Purple with a white check; small radius (`radius.sm`).

| Class | Purpose |
| --- | --- |
| `.checkbox` | Base (required) — on `<input type="checkbox">` |
| `.checkbox--sm` / `.checkbox--lg` | 16px / 24px (default 20px). |
| `.checkbox-field` | Inline wrapper for checkbox + label. |

**States** (automatic): `:checked`, `:hover`, `:focus-visible`
(purple ring), `:disabled`.

```html
<label class="checkbox-field">
  <input class="checkbox" type="checkbox" />
  Subscribe for special offers and promotions.
</label>
```

**Token mapping:** unchecked `checkbox.bg`/`checkbox.border` (white / black 65%);
checked `checkbox.bg-checked`/`border-checked` (purple.600); glyph `checkbox.check`
(white); disabled `checkbox.bg-disabled` (white) / `checkbox.border-disabled`
(black 30%) / `checkbox.check-disabled`.

**Accessibility:** use a real `<input type="checkbox">`; pair with a `<label>`;
keep the focus ring.

### Switch

A binary on/off toggle for settings that apply immediately. Wrap a native
`<input type="checkbox" role="switch">` in a `.switch` label; the visible track +
knob is a `.switch__slider` span.

| Class | Purpose |
| --- | --- |
| `.switch` | `<label>` wrapper (required). |
| `.switch > input` | Real `<input type="checkbox" role="switch">` — visually hidden, focusable. |
| `.switch__slider` | Track (36×20) + knob (16) via `::before`; slides on `:checked`. |
| `.switch__label` | Optional text beside the control. |

**Token mapping:** track `switch.track-off` (neutral.300) / `switch.track-on`
(purple.600); knob `switch.thumb` (white); disabled = 50% opacity.

**Accessibility:** real checkbox (Space toggles, works in forms); `role="switch"`
announces on/off; keep the focus ring.

```html
<label class="switch">
  <input type="checkbox" role="switch" checked />
  <span class="switch__slider"></span>
  <span class="switch__label">Email notifications</span>
</label>
```

### Popup

A bottom-anchored sheet that slides up over a dimmed scrim — for transient
contextual content. JS-driven (`initPopups()`); dismiss by tapping the scrim,
Escape, or swiping the sheet down.

| Class / attribute | Purpose |
| --- | --- |
| `.popup` | Fixed full-screen container (required); starts `hidden`, needs an `id`. |
| `.popup__overlay` | Scrim (required) — black 30%; `data-popup-close` to tap-dismiss. |
| `.popup__sheet` | Bottom sheet (required) — `role="dialog"` `aria-modal="true"`. |
| `.popup__title` / `.popup__body` | Sheet title / subtitle text (the internal type hierarchy). |
| `.popup__footer` | Bottom action bar — sticky, white, full-bleed row of buttons. |
| `[data-popup-open="<id>"]` / `[data-popup-close]` | Open trigger / dismiss element. |

**Text hierarchy** (tokens only): title `.popup__title` — `font.size.md` (16px) /
`font.weight.semibold` / `popup.title` (black); body `.popup__body` —
`font.size.xs` (12px) / `font.weight.regular` / `popup.body` (black 50%).
Buttons inside the sheet use the standard `.btn` component.

**Spacing:** sheet padding `space.4` (16px, top/left/right); title → subtitle
`space.2` (8px); content → footer `space.6` (24px). `.popup__footer` is a
sticky, white, full-bleed button bar pinned to the sheet's bottom edge while the
content above scrolls.

**Token mapping:** `popup.bg` (white) · `popup.overlay` (black 30%) ·
`popup.title` (black) · `popup.body` (black 50%); radius `radius.xl`
(20px, top corners only); elevation `shadow.dropdown`.

**Accessibility:** `role="dialog"` + `aria-modal`; label via `aria-labelledby`;
focus moves into the sheet on open and back to the opener on close; Escape
dismisses; body scroll locked while open.

```html
<button class="btn btn--solid" data-popup-open="sheet">Open</button>
<div class="popup" id="sheet" hidden>
  <div class="popup__overlay" data-popup-close></div>
  <div class="popup__sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
    <h2 id="sheet-title" class="popup__title">Title</h2>
    <p class="popup__body">Supporting copy.</p>
    <div class="popup__footer">
      <button class="btn btn--outline" data-popup-close>Close</button>
    </div>
  </div>
</div>
```

### Spinner

A compact indeterminate indicator: the brand icon spins with an optional
“Loading…” caption below — for a page or panel fetching its content. No scrim;
it sits inline. Pure CSS (no JS); mark it `role="status"`.

| Class | Purpose |
| --- | --- |
| `.spinner` | Inline column (icon + optional label). |
| `.spinner--block` | Fills the width, centres horizontally (normal flow). |
| `.spinner--center` | Fills a positioned parent, centres both axes (full-page / panel load) — same placement on mobile and desktop. |
| `.spinner__icon` | 48px box that spins its `<img>`/`<svg>` (1.2s linear). |
| `.spinner__icon--brand` | Bakes in the RS clover — no inner markup. |
| `.spinner__label` | The caption; drop it (+ `aria-label`) for icon-only. |

**Token mapping:** `spinner.icon-size` (48px) · `spinner.label` (neutral.500) ·
`spinner.gap` (12px). Spin off under `prefers-reduced-motion`. Distinct from
**Loading** (a determinate progress bar) — use the spinner for unknown waits.

### Loading

A slim progress bar with an optional percent label — for game entry, uploads,
or any determinate task. Progress is driven by `--loading-progress` (0–100);
the enhancer in `src/js/loading.js` keeps ARIA and the label in sync. 264px
wide by default, never overflowing its parent; set `width` to span a container.

| Class | Purpose |
| --- | --- |
| `.loading` | Wrapper. `data-loading` for the enhancer, `data-progress` for the start value. |
| `.loading__bar` + `.loading__bar-fill` | 4px track / fill, pill radius. `--indeterminate` sweeps a 40% segment. |
| `.loading__label` | Optional percent text; `data-template="Loading… {value}%"` is rewritten on every update. |

**Behaviour** (`initLoadings()` + `setLoadingProgress(el, n)`): clamps 0–100,
moves the fill (200ms ease-out; none under reduced motion), updates
`aria-valuenow` + label; hitting 100 emits `loading:complete` once. The bar is
`role="progressbar"` named by `.loading__label`.

**Token mapping:** white-on-dark — `loading.bar-track` (white 45%) ·
`loading.bar-fill` (white) · `loading.text` (white) · `loading.bar-width/height`
(264 × 4px). On a light background, give it a dark container.

### Refresh

A small icon button (`.refresh`) that refreshes a value in place — a balance, a
count. The circular-arrow `.refresh__icon` spins two full turns per trigger: once
when the view loads (the value was refreshed) and again per click. Real
`<button>` + `aria-label`; `src/js/refresh.js` (`initRefreshers`) does the spin
and emits a bubbling `refresh` event for the app to re-fetch. `setRefreshing(el,
n)` gives a continuous spin (`.refresh--busy`) for an async reload. Spin is off
under `prefers-reduced-motion` (the `refresh` event still fires).

**Token mapping:** `refresh.icon` (`color.purple.600`) · `refresh.icon-size`
16px (desktop) / `refresh.icon-size-mobile` 20px (mobile, switch at `48rem`) —
reuses the `size.icon.sm`/`md` scale, matching the Select chevron.

### Toast

A transient notification: `.toast` is a dark translucent surface (**black 65%**,
`color.black-alpha.65`) with white text. Show/hide/timing are app-managed.

| Class | Purpose |
| --- | --- |
| `.toast` | Notification surface (required) |
| `.toast-viewport` | Optional fixed, centred stack for live toasts. |

**Token mapping:** `toast.bg` (black 65%) · `toast.text` (white) · `radius.lg` (12px) ·
`toast.min-width` (200px) · `toast.max-width` (384px) · `toast.min-height` (60px).
**Size:** 200–384px wide (content-sized, clamped to the viewport), min 60px tall
(grows with content) — same on mobile and desktop.

```html
<div class="toast" role="status">
  <span>Changes saved successfully.</span>
</div>
```

**Accessibility:** `role="status"` for info, `role="alert"` for errors; keep them
brief; never put essential, non-repeatable info only in a toast.

### Tabs

Content switcher with a bottom-line indicator. A row of `.tab` buttons in
`.tabs`; the selected one takes `.tab--active` / `aria-selected="true"`.

| State | Label | Underline |
| --- | --- | --- |
| Active | black, **semibold** (`tabs.text-active`) | 2px black (`tabs.line-active`) |
| Inactive | black 65%, regular (`tabs.text`) | 1px black 65% (`tabs.line`) |
| Disabled | `text.disabled` | 1px black 65% |

```html
<div class="tabs" role="tablist">
  <button class="tab tab--active" role="tab" aria-selected="true">Overview</button>
  <button class="tab" role="tab" aria-selected="false">Activity</button>
</div>
```

**Accessibility:** real `<button role="tab">` in `role="tablist"`; set
`aria-selected`; link to panels via `aria-controls`; keep the focus ring.

---

## 6. Consuming the system

**Plain HTML / any framework**

```html
<link rel="stylesheet" href="@tripletree/rs-design-system/design-system.css" />
<button class="btn btn--solid">Go</button>
```

**Tailwind**

```js
// tailwind.config.js
import rsPreset from '@tripletree/rs-design-system/tailwind';
export default { presets: [rsPreset], content: ['./src/**/*.{html,js,ts,jsx,tsx}'] };
```

**JS tokens**

```js
import tokens from '@tripletree/rs-design-system/tokens.js';
tokens.color.purple['600']; // "#5f40a1"
```

---

## 7. Changing the system

1. Edit the relevant file in `tokens/` (never edit `dist/` by hand).
2. Run `npm run build` to regenerate `dist/` and `tailwind.preset.js`.
3. Update component CSS in `src/css/` if a new component/variant is needed.
4. Update this document and the `docs/` pages.
5. Re-sync the Figma library variables/components to match.
