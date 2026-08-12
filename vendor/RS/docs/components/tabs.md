# Tabs

Switch between views in the same context. A row of `.tab` buttons inside
`.tabs`; the selected one takes `.tab--active` (or `aria-selected="true"`).
The indicator is a **bottom line** — 2px black under the active tab, 1px black
65% under the rest.

## Basic

<div class="ds-demo">
  <div class="tabs" role="tablist">
    <button class="tab tab--active" role="tab" aria-selected="true">Overview</button>
    <button class="tab" role="tab">Activity</button>
    <button class="tab" role="tab">Settings</button>
  </div>
</div>

```html
<div class="tabs" role="tablist">
  <button class="tab tab--active" role="tab" aria-selected="true">Overview</button>
  <button class="tab" role="tab" aria-selected="false">Activity</button>
  <button class="tab" role="tab" aria-selected="false">Settings</button>
</div>
```

## States

| State | Label | Underline |
| --- | --- | --- |
| **Active** (`.tab--active`) | black, **semibold** | 2px black |
| Inactive | black 65%, regular | 1px black 65% |
| Disabled (`disabled`) | `text.disabled`, not-allowed | 1px black 65% |

<div class="ds-demo">
  <div class="tabs" role="tablist">
    <button class="tab tab--active" role="tab" aria-selected="true">Active</button>
    <button class="tab" role="tab">Inactive</button>
    <button class="tab" role="tab" disabled>Disabled</button>
  </div>
</div>

## API

| Class | Required | Description |
| --- | --- | --- |
| `.tabs` | ✅ | The tab row (use `role="tablist"`) |
| `.tab` | ✅ | A tab (real `<button>`, `role="tab"`) |
| `.tab--active` | one tab | The selected tab (mirror with `aria-selected="true"`) |

## Tokens

| Part | Token |
| --- | --- |
| Active label / line | `tabs.text-active` / `tabs.line-active` (black) |
| Inactive label / line | `tabs.text` / `tabs.line` (black 65%) |
| Focus ring | `focus.ring` (purple.600) |

## Accessibility

- Use real `<button role="tab">` inside `role="tablist"`; set `aria-selected`.
- Link each tab to its panel with `aria-controls` / `id`, panel `role="tabpanel"`.
- Keep the focus ring; support arrow-key navigation between tabs (app-managed).
