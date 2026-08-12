# Input

Text fields collect typed input. Apply `.input` to an `<input>` or
`<textarea>`. There's a single style with three sizes; focus and disabled
states are automatic. The field is a soft grey fill with no resting border —
the fill is the affordance. Inputs are full-width by default — constrain them
with their container. For dropdowns, use the [Select](/components/select)
component.

## Basic

<div class="ds-demo" style="flex-direction:column; align-items:stretch; gap:0.75rem; max-width:360px;">
  <label>
    <span class="input-label">Email</span>
    <input class="input" type="email" placeholder="you@example.com" />
  </label>
</div>

```html
<label>
  <span class="input-label">Email</span>
  <input class="input" type="email" placeholder="you@example.com" />
</label>
```

## Label & required

Use `.input-label` for the bold caption above a field — it works the same above
an `<input>` or `<textarea>`. Add `.input-label--required` to
prepend the danger-red asterisk (e.g. `*Name`), and always back it with the
field's `required` attribute so the state reaches assistive tech.

<div class="ds-demo" style="flex-direction:column; align-items:stretch; gap:0.75rem; max-width:360px;">
  <label>
    <span class="input-label input-label--required">Name</span>
    <input class="input" value="alice00" required />
  </label>
  <label>
    <span class="input-label">Bio</span>
    <textarea class="input" placeholder="Tell us about yourself…"></textarea>
  </label>
</div>

```html
<label>
  <span class="input-label input-label--required">Name</span>
  <input class="input" required />
</label>

<label>
  <span class="input-label">Bio</span>
  <textarea class="input"></textarea>
</label>
```

## Sizes

<div class="ds-demo" style="flex-direction:column; align-items:stretch; gap:0.75rem; max-width:360px;">
  <input class="input input--sm" placeholder="Small" />
  <input class="input" placeholder="Medium (default)" />
  <input class="input input--lg" placeholder="Large" />
</div>

```html
<input class="input input--sm" placeholder="Small" />
<input class="input" placeholder="Medium (default)" />
<input class="input input--lg" placeholder="Large" />
```

## States

Filled grey with no resting border, so there's no hover change. Focus shows
the purple ring plus a Foreground Purple border. Disabled drops to 60% opacity.
Add `.input--invalid` (or `aria-invalid="true"`) for the error state — a
danger-red border and ring.

<div class="ds-demo" style="flex-direction:column; align-items:stretch; gap:0.75rem; max-width:360px;">
  <input class="input" placeholder="Default" />
  <input class="input" value="With a value" />
  <input class="input" placeholder="Disabled" disabled />
  <label style="display:flex; flex-direction:column; gap:0.25rem;">
    <input class="input input--invalid" value="not-an-email" aria-invalid="true" aria-describedby="err" />
    <span id="err" class="text-caption" style="color:var(--text-danger)">Enter a valid email address.</span>
  </label>
</div>

```html
<input class="input" placeholder="Default" />
<input class="input" value="With a value" />
<input class="input" placeholder="Disabled" disabled />

<!-- Invalid + error message -->
<label>
  <input class="input input--invalid" aria-invalid="true" aria-describedby="err" />
  <span id="err" style="color: var(--text-danger)">Enter a valid email address.</span>
</label>
```

## Multi-line

`.input` works on `<textarea>` too — it grows vertically.

<div class="ds-demo" style="flex-direction:column; align-items:stretch; gap:0.75rem; max-width:360px;">
  <textarea class="input" placeholder="Message…"></textarea>
</div>

```html
<textarea class="input" placeholder="Message…"></textarea>
```

## Character count & soft length limit

Optional. Wrap the field in `.input-field` and add an `.input-field__count`
element to show an in-field counter — right-centred on single-line, bottom-right
on `textarea` (add `.input-field--multiline`).

Add `data-maxlength` (with the [input enhancer](#behaviors-optional-js) loaded)
for a **soft limit**: the counter text updates automatically, and going over the
limit never truncates — instead the field turns invalid (`aria-invalid` + danger
ring) and the counter turns danger-red until the text is back within the limit.
Don't use the native `maxlength` attribute for this — it hard-truncates.

Try it: type past the limit in the first field — the counter turns red and the
field goes invalid, but nothing is cut off. The second field is pre-filled over
its limit to show the warning state.

<div class="ds-demo" style="flex-direction:column; align-items:stretch; gap:0.75rem; max-width:360px;">
  <div class="input-field">
    <input class="input" value="alice00" data-maxlength="10" aria-describedby="lim1" />
    <span class="input-field__count">7/10</span>
  </div>
  <div class="input-field">
    <input class="input" value="over the ten-char limit" data-maxlength="10" aria-describedby="lim1" />
    <span class="input-field__count">23/10</span>
  </div>
  <span id="lim1" class="text-caption" style="color:var(--text-subtle)">Warns past the limit — never truncates.</span>
  <div class="input-field input-field--multiline">
    <textarea class="input" data-maxlength="50">Hello there</textarea>
    <span class="input-field__count">11/50</span>
  </div>
</div>

```html
<!-- single-line, soft limit: typing past 30 warns instead of truncating -->
<div class="input-field">
  <input class="input" data-maxlength="30" />
  <span class="input-field__count">0/30</span>
</div>

<!-- textarea -->
<div class="input-field input-field--multiline">
  <textarea class="input" data-maxlength="50"></textarea>
  <span class="input-field__count">0/50</span>
</div>
```

Without the enhancer, the count text is app-managed and a native `maxlength`
(hard cut-off) is the fallback. Without a counter, use `.input` on its own —
the wrapper is opt-in.

## Number & currency formatting

Opt-in via the input enhancer. Add `data-format` to a text `.input`
(the enhancer sets `inputmode` for the right mobile keyboard):

- `data-format="number"` — positive integer. Illegal characters are dropped and
  leading zeros stripped as you type (`007` → `7`); on blur the value is
  clamped to the `min`/`max` attributes and displayed with thousand separators.
- `data-format="currency"` — amount. Digits and one decimal point (max two
  decimals) while typing; on blur clamped to `min`/`max` and displayed with
  thousand separators and exactly two decimals (`1234.5` → `1,234.50`).

Formatting happens **on blur** — while focused the field holds the plain number
so editing stays native (no caret jumps, no fighting half-typed values). The
canonical machine value is always mirrored to `data-value`
(`"1,234.50"` → `"1234.50"`); read that on submit, or call `rawValue(el)`.

<div class="ds-demo" style="flex-direction:column; align-items:stretch; gap:0.75rem; max-width:360px;">
  <label>
    <span class="input-label">Quantity (1–9,999)</span>
    <input class="input" type="text" data-format="number" min="1" max="9999" value="25" />
  </label>
  <label>
    <span class="input-label">Amount (10.00–99,999.99)</span>
    <input class="input" type="text" data-format="currency" min="10" max="99999.99" value="1234.5" />
  </label>
</div>

```html
<script type="module">
  import { initInputs, rawValue } from '@tripletree/rs-design-system/input.js';
  initInputs(); // also runs automatically on DOMContentLoaded
</script>

<!-- integer with thousand separators, clamped to 1–9999 on blur -->
<input class="input" type="text" data-format="number" min="1" max="9999" />

<!-- currency: two decimals + separators on blur -->
<input class="input" type="text" data-format="currency" min="10" max="99999.99" />
```

Use `type="text"` (not `type="number"`) — the formatted value contains commas,
which a native number input rejects. Below-`min` and above-`max` values are
**replaced with the limit** on blur, not flagged as errors.

## API

| Class | Required | Description |
| --- | --- | --- |
| `.input` | ✅ | Base field — works on `<input>` and `<textarea>` |
| `.input--sm` / `.input--lg` | optional | Small / large (default medium) |
| `.input--invalid` | optional | Error state — danger border/ring (or set `aria-invalid="true"`) |
| `.input-label` | optional | Bold field label (above `<input>` or `<textarea>`) |
| `.input-label--required` | optional | Adds the danger-red required asterisk — pair with the field's `required` attribute |
| `.input-field` + `.input-field__count` | optional | Wrapper + in-field character counter (`--multiline` for textarea) |

## Behaviors (optional JS)

`src/js/input.js` — import `{ initInputs, rawValue }` from
`@tripletree/rs-design-system/input.js`. Auto-runs on `DOMContentLoaded`;
call `initInputs(scope)` after injecting fields dynamically.

| Attribute | Behavior |
| --- | --- |
| `data-format="number"` | Positive integer — filters as you type, thousand separators on blur |
| `data-format="currency"` | Amount — two decimals + thousand separators on blur |
| `min` / `max` | Clamp on blur: out-of-range values are replaced with the limit |
| `data-maxlength="N"` | Soft length limit — over-limit warns (invalid state + red counter), never truncates |
| `data-value` (output) | Canonical unformatted value, kept in sync — read this on submit |

## Tokens

| Part | Token |
| --- | --- |
| Background | `input.bg` (black 5% · #0000000D) |
| Text | `input.text` (black) |
| Disabled | whole field at 60% opacity (`opacity: 0.6`) |
| Label | `input.label` (black) · required marker `input.required` (danger.500) |
| Placeholder | `input.placeholder` (black 30% · #0000004D) |
| Border | none at rest (transparent 1px reserves space so focus/error don't shift) |
| Focus border | `input.border-focus` (purple.600) + `focus.ring` |
| Invalid border / ring | `input.border-invalid` (danger.600) · message text `text.danger` (danger.600 · #C11717) |
| Over-limit counter | `text.danger` (danger.600 · #C11717) |
| Radius | `radius.xl` (20px) single-line · `radius.snug` (10px) textarea |
| Height | 36px single-line (default) · 114px textarea |

## Accessibility

- Always pair a field with a `<label>` (wrap it, or link via `for`/`id`).
- Keep the focus ring — it's the only non-color focus affordance.
- Mark unavailable fields with `disabled` or `aria-disabled="true"`.
- Use the right `type` (`email`, `tel`, `number`, …) for correct keyboards and validation.
- Formatted fields (`data-format`) use `type="text"`; the enhancer sets
  `inputmode="numeric"`/`"decimal"` so mobile keyboards are still correct.
- Over the soft limit, the enhancer sets `aria-invalid="true"` — pair it with an
  `aria-describedby` message explaining the limit where possible.
