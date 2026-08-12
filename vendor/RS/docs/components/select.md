# Select

The design system's dropdown (listbox) — use it wherever a value is picked
from a list. The trigger is a real `<button>`; the panel is a `role="listbox"`
with `role="option"` children, and keyboard + ARIA wiring comes from the
enhancer in `src/js/select.js`.

Every new select is one of two types — classify first, then apply the matching
tokens. Never size a select per page.

| Type | Use for | Look |
| --- | --- | --- |
| **Form** (`.select--form`) | Form fields, next to inputs | Grey fill, no border, fills its container |
| **Filter** (bare `.select`, the default) | Filters above lists / data pages | White outlined pill, sized by its content |

## Width

Width is the main difference between the two types — the trick is setting it in
the right place:

- **Form** fills its container (`width: 100%`). Never put a width on the control
  itself; cap it on the **container** — about `28rem` (`max-w`) in a
  single-column form, one grid column in a two-column form, `100%` inside a
  dialog. An 800px-wide field looks empty and misleads about the expected
  answer length, so the limit lives one level up.
- **Filter** is sized by its **content** — it hugs the longest option, then
  clamps: never narrower than `96px` (so short labels like “All” aren't
  cramped), never wider than `240px` on desktop / `60%` of the container on
  mobile (so it doesn't crush neighbouring filters).
- **Panel** is at least as wide as the trigger and may grow past it for long
  options, up to `320px`.

## Form select

Sits in a form column and behaves like an input: full width, grey fill, the
same radius and heights as `.input`. Set the width on the container, not the
control — see [Width](#width).

<div class="ds-demo" style="flex-direction:column; align-items:stretch; gap:0.75rem; max-width:28rem;">
  <label style="display:block;">
    <span class="input-label">Location</span>
    <div class="select select--form" data-select data-name="city">
      <button type="button" class="select__trigger" aria-haspopup="listbox" aria-expanded="false">
        <span class="select__value">Choose a city…</span>
        <span class="select__caret" aria-hidden="true"></span>
      </button>
      <ul class="select__panel" role="listbox" tabindex="-1" hidden>
        <li class="select__option" role="option" data-value="london">London</li>
        <li class="select__option" role="option" data-value="berlin">Berlin</li>
        <li class="select__option" role="option" data-value="tokyo">Tokyo</li>
        <li class="select__option" role="option" data-value="sydney">Sydney</li>
      </ul>
    </div>
  </label>
</div>

```html
<label>
  <span class="input-label">Location</span>
  <div class="select select--form" data-select data-name="city">
    <button type="button" class="select__trigger" aria-haspopup="listbox" aria-expanded="false">
      <span class="select__value">Choose a city…</span>
      <span class="select__caret" aria-hidden="true"></span>
    </button>
    <ul class="select__panel" role="listbox" tabindex="-1" hidden>
      <li class="select__option" role="option" data-value="london">London</li>
      <li class="select__option" role="option" data-value="berlin">Berlin</li>
    </ul>
  </div>
</label>
```

```js
import { initSelects } from '@tripletree/rs-design-system/select.js';
initSelects(); // enhance every [data-select] on the page
```

## Filter select

Compact outlined pill for filtering lists — sized by its content between a
96px floor and a 240px ceiling (see [Width](#width)). Group adjacent filters
with `.select-group` for the standard 8px gap.

<div class="ds-demo" style="align-items:flex-start;">
  <div class="select-group">
    <div class="select" data-select>
      <button type="button" class="select__trigger" aria-haspopup="listbox" aria-expanded="false">
        <span class="select__value">June 2026</span>
        <span class="select__caret" aria-hidden="true"></span>
      </button>
      <ul class="select__panel" role="listbox" tabindex="-1" hidden>
        <li class="select__option" role="option" aria-selected="true">June 2026</li>
        <li class="select__option" role="option">May 2026</li>
        <li class="select__option" role="option">April 2026</li>
        <li class="select__option" role="option">March 2026</li>
      </ul>
    </div>
    <div class="select" data-select>
      <button type="button" class="select__trigger" aria-haspopup="listbox" aria-expanded="false">
        <span class="select__value">All categories</span>
        <span class="select__caret" aria-hidden="true"></span>
      </button>
      <ul class="select__panel" role="listbox" tabindex="-1" hidden>
        <li class="select__option" role="option" aria-selected="true">All categories</li>
        <li class="select__option" role="option">Food</li>
        <li class="select__option" role="option">Travel</li>
        <li class="select__option" role="option">Housing</li>
      </ul>
    </div>
  </div>
</div>

```html
<div class="select-group">
  <div class="select" data-select>…</div>
  <div class="select" data-select>…</div>
</div>
```

## Placeholder vs value

A chosen value renders in black at regular weight — like input text; the
placeholder is grey, also regular (colour alone tells them apart). The enhancer
applies `.select__value--placeholder`
automatically when no option is preselected and clears it on first selection.
Never leave the trigger empty — use a generic prompt (“Choose an option…”)
or a concrete action (“Choose a city…”).

## States

Neither type changes on hover — the form is a fill and the filter outline holds
steady. Focus shows the purple ring. Opening adds
no extra ring — the panel appearing plus the chevron rotating 180° are the
open cue. Disabled is the whole trigger
at 50% opacity. For errors, set `aria-invalid="true"` on the trigger and link
a 12px danger message with `aria-describedby`.

<div class="ds-demo" style="flex-direction:column; align-items:stretch; gap:0.75rem; max-width:28rem;">
  <div class="select select--form">
    <button type="button" class="select__trigger" aria-haspopup="listbox" aria-expanded="false" disabled>
      <span class="select__value select__value--placeholder">Unavailable</span>
      <span class="select__caret" aria-hidden="true"></span>
    </button>
  </div>
  <div style="display:flex; flex-direction:column; gap:0.25rem;">
    <div class="select select--form" data-select>
      <button type="button" class="select__trigger" aria-haspopup="listbox" aria-expanded="false" aria-invalid="true" aria-describedby="select-err">
        <span class="select__value">Choose a city…</span>
        <span class="select__caret" aria-hidden="true"></span>
      </button>
      <ul class="select__panel" role="listbox" tabindex="-1" hidden>
        <li class="select__option" role="option">London</li>
        <li class="select__option" role="option">Berlin</li>
      </ul>
    </div>
    <span id="select-err" class="text-caption" style="color:var(--text-danger)">Please choose a location.</span>
  </div>
</div>

```html
<!-- Disabled -->
<button type="button" class="select__trigger" disabled>…</button>

<!-- Error + message -->
<button type="button" class="select__trigger" aria-invalid="true" aria-describedby="err">…</button>
<span id="err" style="color: var(--text-danger)">Please choose a location.</span>
```

## Panel behaviour

- **Height** caps at ~8 options on desktop (320px) and ~6.5 on mobile (288px);
  overflow scrolls, and the half-cut last row is the scroll affordance.
- **Width** is at least the trigger's, growing with long options up to 320px.
- The panel opens **downward** and flips above the trigger when the space
  below can't fit it.
- Long trigger text truncates to a single ellipsised line; option labels wrap
  to at most two lines, then truncate. One long option never stretches the
  trigger.
- On mobile, if a list runs past ~12 options (months, countries…), prefer the
  [bottom sheet](/components/popup) over a popover — scrolling is far better
  there.

## Keyboard & ARIA

- **Space / Enter / ↓** open the panel; **Esc** closes it and returns focus to the trigger.
- **↑ / ↓ / Home / End** move the active option; **Enter** selects it.
- **Type a letter** to jump to the next matching option (500ms buffer, wraps around).
- Trigger exposes `aria-haspopup="listbox"` + `aria-controls`; the panel is `role="listbox"`, options are `role="option"` with `aria-selected`, and the active option is exposed via `aria-activedescendant`.
- Error state: `aria-invalid` drives the styling; link the message with `aria-describedby`.
- Selecting an option emits a `select:change` event (`detail: { value, label }`) on the `.select` wrapper.

## Anatomy

| Class | Required | Notes |
| --- | --- | --- |
| `.select` | ✅ | Relative wrapper. Add `data-select` so the enhancer finds it. Alone = filter look. |
| `.select--form` | optional | Form variant — grey fill, full width, input heights. |
| `.select__trigger` | ✅ | The `<button>`. |
| `.select__value` | ✅ | Current label — single line, ellipsised. `--placeholder` is managed by the enhancer. |
| `.select__caret` | optional | Chevron icon; rotates when open. |
| `.select__panel` | ✅ | `role="listbox"` popover. The enhancer adds `--up` when it flips upward. |
| `.select__option` | ✅ | `role="option"` row — selected rows get a grey wash and a purple ✓. |
| `.select-group` | optional | Flex row of filter selects with the standard gap. |
| `data-name="…"` | optional | On `.select`: mirrors the chosen `data-value` into a hidden input for forms. |

## Tokens

All sizes have a mobile and a desktop tier, switched at `48rem`
(`*-mobile` variants in `tokens/semantic.json`).

| Part | Token |
| --- | --- |
| Form trigger | `select.form-bg` (black 5%, no border, no hover change) · height 48→36px · text 16→14px · pad 16→12px · radius `radius.xl` (as input) |
| Filter trigger | `select.filter-bg` (white) · border `select.filter-border` (black 10%, no hover change) · height 36→32px · text 14→12px · min 96px / max 240px · pill |
| Value / placeholder | `select.value` (black, regular) · `select.placeholder` (black 30%, regular) |
| Chevron | `select.caret` (black 60%) · `select.icon-size` 20→16px |
| Error | `select.border-invalid` (danger.600) · message `text.danger` |
| Disabled | whole trigger at 50% opacity |
| Panel | `select.panel-bg` (white) · hairline `select.panel-border` (black 10%) · max-height 288→320px · max-width 320px · offset 4px · radius 12→8px · `shadow.popover` (0 8 24 black 12%) |
| Option | `select.option-text` (black) · hover/active `select.option-hover-bg` (black 5%) · selected `select.option-selected-bg` + ✓ `select.option-check` (purple.600) · height 44→36px · pad 16→12px |
| Focus ring | `focus.ring` (purple.600) |

## Motion

| Element | Trigger | Animation | Duration | Easing |
| --- | --- | --- | --- | --- |
| Panel | open | fade in + 4px slide | 150ms | ease-out |
| Panel | close | fade out | 100ms | ease-in |
| Chevron | open / close | rotate 180° | 150ms | ease-out |

All motion is removed under `prefers-reduced-motion: reduce`.
