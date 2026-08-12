# Refresh

A small icon button for refreshing a value in place — a running balance, a
count, a rate. The circular-arrow icon spins two full turns on each trigger:
once when the view loads (signalling the value was just refreshed) and again on
every click. Foreground Purple, sized like the other inline control icons —
**20px on mobile, 16px on desktop**.

Real `<button>` + `aria-label`; the spin and the `refresh` event come from the
enhancer in `src/js/refresh.js`.

## Basic

<div class="ds-demo" style="justify-content:center; padding:2.5rem;">
  <span style="display:inline-flex; align-items:center; gap:.5rem; font-weight:700; font-size:1.25rem;">
    0.00
    <button class="refresh" data-refresh aria-label="Refresh balance">
      <span class="refresh__icon" aria-hidden="true"></span>
    </button>
  </span>
</div>

```html
<span class="balance">
  0.00
  <button class="refresh" data-refresh aria-label="Refresh balance">
    <span class="refresh__icon" aria-hidden="true"></span>
  </button>
</span>
```

```js
import { initRefreshers } from '@tripletree/rs-design-system/refresh.js';

initRefreshers(); // spins each [data-refresh] once on load, then on every click

const btn = document.querySelector('.refresh');
btn.addEventListener('refresh', () => {
  // re-fetch the value; the icon has already spun to acknowledge the tap
  loadBalance();
});
```

## With a label

Pair it with a caption — the button still owns its own `aria-label`.

<div class="ds-demo" style="justify-content:center; padding:2.5rem;">
  <span style="display:inline-flex; align-items:center; gap:.375rem; font-weight:600;">
    Gcoin
    <button class="refresh" data-refresh aria-label="Refresh Gcoin balance">
      <span class="refresh__icon" aria-hidden="true"></span>
    </button>
  </span>
</div>

```html
<span>
  Gcoin
  <button class="refresh" data-refresh aria-label="Refresh Gcoin balance">
    <span class="refresh__icon" aria-hidden="true"></span>
  </button>
</span>
```

## Async reload

If the refresh is asynchronous, keep the icon turning until the data lands:
`setRefreshing(el, true)` spins it continuously, `false` stops it.

```js
import { initRefreshers, setRefreshing } from '@tripletree/rs-design-system/refresh.js';

initRefreshers();
btn.addEventListener('refresh', async () => {
  setRefreshing(btn, true);          // continuous spin + aria-busy
  await loadBalance();
  setRefreshing(btn, false);         // stop
});
```

## Anatomy

| Class / attr | Required | Notes |
| --- | --- | --- |
| `.refresh` | ✅ | The `<button>`. Give it an `aria-label`. |
| `data-refresh` | ✅ | So the enhancer finds it (spins on load + wires the click). |
| `.refresh__icon` | ✅ | The circular-arrow glyph. `aria-hidden="true"`. |
| `.refresh--busy` | optional | Continuous spin for an async reload (toggled by `setRefreshing`). |
| `data-spin-on-load="false"` | optional | Skip the load spin — only spin on click. |

## Behaviour & accessibility

- The enhancer spins each control two turns on load (unless `data-spin-on-load="false"`)
  and again per click, and dispatches a bubbling **`refresh`** event so the app
  re-fetches the value.
- `setRefreshing(el, n)` toggles `.refresh--busy` (continuous spin) and
  `aria-busy` for async reloads.
- Use a real `<button>` with a meaningful `aria-label` ("Refresh balance"); the
  icon is `aria-hidden`.
- Under `prefers-reduced-motion` the icon doesn't spin, but the `refresh` event
  still fires, so the value still reloads.

## Tokens

| Part | Token |
| --- | --- |
| Icon colour | `refresh.icon` (`color.purple.600`) |
| Icon size | `refresh.icon-size` 16px (desktop) · `refresh.icon-size-mobile` 20px — switch at 48rem |
| Motion | two 360° turns per trigger (720° / 1s ease); `--busy` loops 1s linear — both off under `prefers-reduced-motion` |
