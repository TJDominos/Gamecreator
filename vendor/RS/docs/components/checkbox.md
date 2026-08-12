# Checkbox

A binary control. Apply `.checkbox` to a native `<input type="checkbox">`.
Three sizes; checked, hover, focus, and disabled states are automatic. Checked
fill is Foreground Purple with a white check.

## Basic

<div class="ds-demo">
  <label class="checkbox-field">
    <input class="checkbox" type="checkbox" checked />
    Subscribe for special offers and promotions.
  </label>
</div>

```html
<label class="checkbox-field">
  <input class="checkbox" type="checkbox" />
  Subscribe for special offers and promotions.
</label>
```

## Sizes

<div class="ds-demo">
  <input class="checkbox checkbox--sm" type="checkbox" checked />
  <input class="checkbox" type="checkbox" checked />
  <input class="checkbox checkbox--lg" type="checkbox" checked />
</div>

```html
<input class="checkbox checkbox--sm" type="checkbox" />  <!-- 16px -->
<input class="checkbox" type="checkbox" />               <!-- 20px (default) -->
<input class="checkbox checkbox--lg" type="checkbox" />  <!-- 24px -->
```

## States

Checked fills purple with a white check. Hover hints the border; focus shows the
purple ring; disabled uses the neutral palette.

<div class="ds-demo">
  <input class="checkbox" type="checkbox" />
  <input class="checkbox" type="checkbox" checked />
  <input class="checkbox" type="checkbox" disabled />
  <input class="checkbox" type="checkbox" checked disabled />
</div>

```html
<input class="checkbox" type="checkbox" />                 <!-- unchecked -->
<input class="checkbox" type="checkbox" checked />         <!-- checked -->
<input class="checkbox" type="checkbox" disabled />        <!-- disabled -->
<input class="checkbox" type="checkbox" checked disabled />
```

## API

| Class | Required | Description |
| --- | --- | --- |
| `.checkbox` | ✅ | Base — on a native `<input type="checkbox">` |
| `.checkbox--sm` / `.checkbox--lg` | optional | 16px / 24px (default 20px) |
| `.checkbox-field` | optional | Inline wrapper for a checkbox + its label |

## Tokens

| Part | Token |
| --- | --- |
| Unchecked | `checkbox.bg` (white) · `checkbox.border` (black 65%) |
| Checked | `checkbox.bg-checked` / `checkbox.border-checked` (purple.600) |
| Glyph | `checkbox.check` (white) |
| Disabled | `checkbox.bg-disabled` (white) · `checkbox.border-disabled` (black 30%) · `checkbox.check-disabled` (neutral.400) |
| Focus ring | `focus.ring` (purple.600) |
| Radius | `radius.sm` (4px) |

## Accessibility

- Use a real `<input type="checkbox">` — keyboard, label, and form behaviour come for free.
- Pair with a `<label>` (wrap with `.checkbox-field`, or link via `for`/`id`).
- Keep the focus ring.
