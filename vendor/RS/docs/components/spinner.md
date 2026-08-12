# Spinner

A compact "working…" indicator: the brand icon spins with an optional caption
below. Unlike [Loading](/components/loading) (a progress bar for a *known*
task), the spinner is for indeterminate waits — a page or panel fetching its
content. No scrim; it sits inline in whatever region is loading.

Pure CSS — no JavaScript. Mark it `role="status"` so assistive tech announces
the wait, and give the spinning icon `aria-hidden="true"`.

## Basic

<div class="ds-demo" style="justify-content:center; padding:3rem;">
  <div class="spinner" role="status">
    <span class="spinner__icon spinner__icon--brand" aria-hidden="true"></span>
    <p class="spinner__label">Loading…</p>
  </div>
</div>

```html
<div class="spinner" role="status">
  <span class="spinner__icon spinner__icon--brand" aria-hidden="true"></span>
  <p class="spinner__label">Loading…</p>
</div>
```

## Your own icon

Put any `<img>` or `<svg>` inside `.spinner__icon` instead of the `--brand`
clover — it's sized and spun for you.

<div class="ds-demo" style="justify-content:center; padding:3rem;">
  <div class="spinner" role="status">
    <span class="spinner__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--color-purple-600)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="42 14"/></svg>
    </span>
    <p class="spinner__label">Fetching table…</p>
  </div>
</div>

```html
<div class="spinner" role="status">
  <span class="spinner__icon" aria-hidden="true"><img src="logo.svg" alt="" /></span>
  <p class="spinner__label">Fetching table…</p>
</div>
```

::: tip Non-symmetric logos
Continuous rotation suits a radially symmetric mark like the clover. For a
wordmark or an asymmetric logo, override `animation` on `.spinner__icon` with a
pulse (opacity / scale) so it doesn't tumble.
:::

## Icon only

Drop `.spinner__label` for just the spinning icon.

<div class="ds-demo" style="justify-content:center; padding:3rem;">
  <div class="spinner" role="status" aria-label="Loading">
    <span class="spinner__icon spinner__icon--brand" aria-hidden="true"></span>
  </div>
</div>

```html
<div class="spinner" role="status" aria-label="Loading">
  <span class="spinner__icon spinner__icon--brand" aria-hidden="true"></span>
</div>
```

## Placement

Centre it — the **same on mobile and desktop**. Horizontally always centred;
vertically centred in the **content region** (between a fixed header and any
bottom nav), not the raw viewport, so it doesn't sit low. Keep the 48px icon the
**same size** on both — only the surrounding whitespace grows on a wider screen.

`.spinner--center` fills a positioned parent and centres both axes — for a
full-page load or a loading panel. Give the parent `position: relative` (or
absolute/fixed) and a height.

<div class="ds-demo" style="padding:0;">
  <div style="position:relative; width:100%; height:280px; background:var(--color-neutral-50); border-radius:10px;">
    <div class="spinner spinner--center" role="status">
      <span class="spinner__icon spinner__icon--brand" aria-hidden="true"></span>
      <p class="spinner__label">Loading…</p>
    </div>
  </div>
</div>

```html
<!-- full-page load -->
<div style="position:relative; min-height:100dvh;">
  <div class="spinner spinner--center" role="status">
    <span class="spinner__icon spinner__icon--brand" aria-hidden="true"></span>
    <p class="spinner__label">Loading…</p>
  </div>
</div>
```

`min-height:100dvh` uses the *dynamic* viewport height so mobile browser
toolbars don't push the spinner off-centre. In normal flow (no absolute
positioning), `.spinner--block` centres horizontally and the parent handles the
vertical (e.g. `display:grid; place-items:center`).

## Anatomy

| Class | Required | Notes |
| --- | --- | --- |
| `.spinner` | ✅ | Inline column: icon + optional label. Mark `role="status"`. |
| `.spinner--block` | optional | Fills the width and centres horizontally (normal flow). |
| `.spinner--center` | optional | Fills a positioned parent and centres both axes — full-page or panel load. Parent needs `position:relative` + a height. |
| `.spinner__icon` | ✅ | 48px box that spins its content (`<img>`/`<svg>`). `aria-hidden="true"`. |
| `.spinner__icon--brand` | optional | Bakes in the RS clover — no inner markup needed. |
| `.spinner__label` | optional | The caption (“Loading…”). Drop it (and set `aria-label` on `.spinner`) for icon-only. |

## Accessibility

- `role="status"` announces the wait politely (an `aria-live="polite"` region);
  the label text is the announcement, so keep it meaningful ("Loading…",
  "Fetching table…").
- Icon-only: put the wait text in `aria-label` on `.spinner` since there's no
  visible label.
- The spin stops under `prefers-reduced-motion` — the icon and caption still
  communicate the wait.

## Tokens

| Part | Token |
| --- | --- |
| Icon | `spinner.icon-size` (48px) · spins 1.2s linear (off under `prefers-reduced-motion`) |
| Label | `spinner.label` (neutral.500) · 14px |
| Gap | `spinner.gap` (12px) |
