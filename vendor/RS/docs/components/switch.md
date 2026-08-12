# Switch

A binary on/off toggle — use it for settings that take effect immediately (no
Save step). For a value submitted with a form, prefer a [Checkbox](/components/checkbox).

Wrap a native `<input type="checkbox" role="switch">` in a `.switch` label; the
visible track + knob is the `.switch__slider` span. The input stays keyboard
focusable and form-friendly.

## Basic

<div class="ds-demo" style="gap:1.5rem;">
  <label class="switch">
    <input type="checkbox" role="switch" />
    <span class="switch__slider"></span>
  </label>
  <label class="switch">
    <input type="checkbox" role="switch" checked />
    <span class="switch__slider"></span>
  </label>
</div>

```html
<label class="switch">
  <input type="checkbox" role="switch" />
  <span class="switch__slider"></span>
</label>
```

## With label

<div class="ds-demo">
  <label class="switch">
    <input type="checkbox" role="switch" checked />
    <span class="switch__slider"></span>
    <span class="switch__label">Email notifications</span>
  </label>
</div>

```html
<label class="switch">
  <input type="checkbox" role="switch" checked />
  <span class="switch__slider"></span>
  <span class="switch__label">Email notifications</span>
</label>
```

## Disabled

<div class="ds-demo" style="gap:1.5rem;">
  <label class="switch">
    <input type="checkbox" role="switch" disabled />
    <span class="switch__slider"></span>
  </label>
  <label class="switch">
    <input type="checkbox" role="switch" checked disabled />
    <span class="switch__slider"></span>
  </label>
</div>

```html
<label class="switch">
  <input type="checkbox" role="switch" checked disabled />
  <span class="switch__slider"></span>
</label>
```

## Anatomy

| Class | Required | Notes |
| --- | --- | --- |
| `.switch` | ✅ | The `<label>` wrapper (inline-flex). |
| `.switch > input` | ✅ | Real `<input type="checkbox" role="switch">` — visually hidden, focusable. |
| `.switch__slider` | ✅ | Track (36×20) + knob (16) drawn via `::before`; slides on `:checked`. |
| `.switch__label` | optional | Text beside the control. |

## Accessibility

- Built on a real checkbox, so keyboard (Space to toggle) and forms work for free.
- `role="switch"` makes assistive tech announce it as a switch (on/off) rather than a checkbox.
- The whole `<label>` is clickable; keep the purple focus ring.

## Tokens

| Part | Token |
| --- | --- |
| Track off / on | `switch.track-off` (neutral.300) · `switch.track-on` (purple.600) |
| Knob | `switch.thumb` (white) |
| Disabled | whole control at 50% opacity |
| Focus ring | `focus.ring` (purple.600) |
