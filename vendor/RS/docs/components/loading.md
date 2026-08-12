# Loading

A slim progress bar with an optional percent label — for game entry, uploads,
or any determinate task. Progress is driven by the `--loading-progress` custom
property (0–100); the enhancer in `src/js/loading.js` keeps ARIA and the label
in sync.

Default width is 264px and it never overflows its parent. Set `width` on
`.loading` (e.g. `width: 100%`) to span a container.

## Basic

<div class="ds-demo" style="justify-content:center; padding:2.5rem; background:var(--color-neutral-900); border-radius:10px;">
  <div class="loading" data-loading data-progress="86">
    <div class="loading__bar"><div class="loading__bar-fill"></div></div>
    <p class="loading__label" data-template="Loading… {value}%">Loading… 86%</p>
  </div>
</div>

```html
<div class="loading" data-loading data-progress="0">
  <div class="loading__bar"><div class="loading__bar-fill"></div></div>
  <p class="loading__label" data-template="Loading… {value}%">Loading… 0%</p>
</div>
```

```js
import { initLoadings, setLoadingProgress } from '@tripletree/rs-design-system/loading.js';

initLoadings(); // enhance every [data-loading] on the page

const bar = document.querySelector('.loading');
setLoadingProgress(bar, 86);             // bar, ARIA and label move together

bar.addEventListener('loading:complete', () => {
  bar.hidden = true;                     // fires once when progress hits 100
});
```

## Bar only

Drop `.loading__label` for just the bar.

<div class="ds-demo" style="justify-content:center; padding:2.5rem; background:var(--color-neutral-900); border-radius:10px;">
  <div class="loading" data-loading data-progress="45">
    <div class="loading__bar"><div class="loading__bar-fill"></div></div>
  </div>
</div>

```html
<div class="loading" data-loading data-progress="45">
  <div class="loading__bar"><div class="loading__bar-fill"></div></div>
</div>
```

## Indeterminate

No real progress numbers? Add `.loading__bar--indeterminate` — a 40% segment
sweeps the track (a dimmed static bar under `prefers-reduced-motion`). Drop the
percent label.

<div class="ds-demo" style="justify-content:center; padding:2.5rem; background:var(--color-neutral-900); border-radius:10px;">
  <div class="loading" data-loading>
    <div class="loading__bar loading__bar--indeterminate"><div class="loading__bar-fill"></div></div>
  </div>
</div>

```html
<div class="loading" data-loading>
  <div class="loading__bar loading__bar--indeterminate"><div class="loading__bar-fill"></div></div>
</div>
```

## Full width

`.loading` sizes to 264px by default; set `width` to span a container.

<div class="ds-demo" style="padding:2.5rem; background:var(--color-neutral-900); border-radius:10px;">
  <div class="loading" data-loading data-progress="70" style="width:100%;">
    <div class="loading__bar"><div class="loading__bar-fill"></div></div>
    <p class="loading__label" data-template="Loading… {value}%">Loading… 70%</p>
  </div>
</div>

```html
<div class="loading" data-loading data-progress="70" style="width:100%;">…</div>
```

## Anatomy

| Class | Required | Notes |
| --- | --- | --- |
| `.loading` | ✅ | Wrapper. `data-loading` so the enhancer finds it; `data-progress` sets the starting value. 264px wide by default — set `width` to change it. |
| `.loading__bar` | ✅ | The 4px track (pill radius). Add `--indeterminate` for a sweeping segment when the duration is unknown. |
| `.loading__bar-fill` | ✅ | The fill — width tracks `--loading-progress`. |
| `.loading__label` | optional | Percent text. `data-template="Loading… {value}%"` is rewritten on every update. |

## Behaviour & accessibility

- `setLoadingProgress(el, n)` clamps to 0–100, moves the fill (200ms ease-out,
  none under `prefers-reduced-motion`), updates `aria-valuenow` and the label.
- Reaching 100 emits **`loading:complete`** (once) on the wrapper.
- The enhancer wires `role="progressbar"` + `aria-valuemin/max` on the bar and
  names it with `.loading__label` via `aria-labelledby` (falls back to
  `aria-label="Loading"`). Indeterminate bars omit `aria-valuenow`.

## Tokens

The bar is white-on-dark — it sits over a dark surface (the game screen). On a
light background, give it a dark container.

| Part | Token |
| --- | --- |
| Track | `loading.bar-track` (white 45%) |
| Fill | `loading.bar-fill` (white) |
| Label | `loading.text` (white) — 14px semibold, tabular digits |
| Size | `loading.bar-width` 264px (never overflows) · `loading.bar-height` 4px · `radius.full` |
| Motion | fill 200ms ease-out · indeterminate sweep 1.2s — both off under `prefers-reduced-motion` |
