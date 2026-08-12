# Popup

A bottom-anchored sheet that slides up over a dimmed scrim — for transient,
contextual content (actions, pickers, details) on top of the current screen.
Dismiss by tapping the scrim, pressing Escape, or swiping the sheet down.

::: tip
For a blocking, centered confirmation, a popup isn't the right pattern — this is
a **bottom sheet**: it stays attached to the bottom edge and is meant to be
quick to dismiss.
:::

## Basic

<div class="ds-demo">
  <button class="btn btn--solid" data-popup-open="demo-popup">Open popup</button>
  <div class="popup" id="demo-popup" hidden>
    <div class="popup__overlay" data-popup-close></div>
    <div class="popup__sheet" role="dialog" aria-modal="true" aria-labelledby="demo-popup-title">
      <h2 id="demo-popup-title" class="popup__title">Share</h2>
      <p class="popup__body">Choose how you'd like to share this item.</p>
      <div class="popup__footer">
        <button class="btn btn--solid">Copy link</button>
        <button class="btn btn--outline" data-popup-close>Cancel</button>
      </div>
    </div>
  </div>
</div>

```html
<button class="btn btn--solid" data-popup-open="demo">Open popup</button>

<div class="popup" id="demo" hidden>
  <div class="popup__overlay" data-popup-close></div>
  <div class="popup__sheet" role="dialog" aria-modal="true" aria-labelledby="demo-title">
    <h2 id="demo-title" class="popup__title">Share</h2>
    <p class="popup__body">Choose how you'd like to share this item.</p>
    <div class="popup__footer">
      <button class="btn btn--outline" data-popup-close>Cancel</button>
    </div>
  </div>
</div>
```

```js
import { initPopups } from '@tripletree/rs-design-system/popup.js';
initPopups(); // wire every [data-popup-open] trigger + .popup on the page
```

## Anatomy

| Class / attribute | Required | Notes |
| --- | --- | --- |
| `.popup` | ✅ | Fixed full-screen container; starts `hidden`. Give it an `id`. |
| `.popup__overlay` | ✅ | The scrim — black 30%; add `data-popup-close` to dismiss on tap. |
| `.popup__sheet` | ✅ | Bottom sheet — white, 20px top corners, slides up. `role="dialog"` + `aria-modal="true"`. |
| `.popup__title` | optional | Sheet title — 16px semibold, black. |
| `.popup__body` | optional | Subtitle / body — 12px regular, black 50%. |
| `.popup__footer` | optional | Bottom action bar — sticky, white, full-bleed row of buttons. |
| `[data-popup-open="<id>"]` | ✅ | Trigger; opens the popup with that `id`. |
| `[data-popup-close]` | optional | Any element inside the popup that dismisses it (overlay, Cancel button…). |

## Behavior & gestures

- **Open:** click a `[data-popup-open]` trigger.
- **Dismiss:** tap the overlay, click any `[data-popup-close]`, press **Escape**, or **swipe the sheet down** past ~80px.
- **Scroll:** content taller than the sheet (max-height `90vh`) scrolls natively, including on touch; the swipe-down dismiss engages only for downward drags that start with the content scrolled to the top.
- Body scroll is locked while a popup is open; focus moves into the sheet on open and returns to the trigger on close.
- Emits `popup:open` / `popup:close` CustomEvents on the `.popup` element.

## Accessibility

- The sheet is a `role="dialog"` with `aria-modal="true"`; label it via `aria-labelledby` (its heading) or `aria-label`.
- Focus is moved into the sheet on open and restored to the opener on close.
- Escape always dismisses; keep a visible `[data-popup-close]` control too.
- (Lightweight focus handling — for a hard focus-trap across Tab, wrap with your framework's dialog primitive.)

## Tokens

| Part | Token |
| --- | --- |
| Sheet background | `popup.bg` (white) |
| Overlay scrim | `popup.overlay` (black 30%) |
| Title text | `popup.title` (black) · `font.size.md` (16px) · `font.weight.semibold` |
| Body text | `popup.body` (black 50%) · `font.size.xs` (12px) · `font.weight.regular` |
| Sheet padding | `space.4` (16px) — top / left / right |
| Title → subtitle | `space.2` (8px) |
| Content → footer | `space.6` (24px) |
| Radius | `radius.xl` (20px) — top corners only |
| Elevation | `shadow.dropdown` |
