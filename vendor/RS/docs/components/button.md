# Button

Buttons trigger actions. There are two variants: **Solid** (primary) and
**Outline** (secondary). Apply `.btn` plus exactly one variant.

## Variants

<div class="ds-demo">
  <button class="btn btn--solid">Solid (primary)</button>
  <button class="btn btn--solid btn--accent">Solid · purple</button>
  <button class="btn btn--outline">Outline (secondary)</button>
  <button class="btn btn--outline btn--accent">Outline · accent</button>
</div>

```html
<button class="btn btn--solid">Solid (primary)</button>
<button class="btn btn--solid btn--accent">Solid · purple</button>
<button class="btn btn--outline">Outline (secondary)</button>
<button class="btn btn--outline btn--accent">Outline · accent</button>
```

The `--accent` modifier applies the purple treatment to either variant:
`.btn--solid.btn--accent` is a **purple tonal** button (Background Purple fill,
Foreground Purple text); `.btn--outline.btn--accent` is a purple-outlined button.

## Sizes

<div class="ds-demo">
  <button class="btn btn--solid btn--sm">Small</button>
  <button class="btn btn--solid">Medium</button>
  <button class="btn btn--solid btn--lg">Large</button>
</div>

```html
<button class="btn btn--solid btn--sm">Small</button>
<button class="btn btn--solid">Medium</button>
<button class="btn btn--solid btn--lg">Large</button>
```

## With icon

`.btn` is a flex container with a gap, so an icon sits naturally before or after
the label — just add an `<svg class="btn__icon">`. The icon inherits the text
color (`currentColor`) and scales with the button's font-size. Mark decorative
icons `aria-hidden="true"`. For an **icon-only** button use `.btn--icon-only`
(square) and always provide an `aria-label`.

<div class="ds-demo">
  <button class="btn btn--solid">
    <svg class="btn__icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2H9v3a1 1 0 1 1-2 0V9H4a1 1 0 1 1 0-2h3V4a1 1 0 0 1 1-1Z"/></svg>
    New item
  </button>
  <button class="btn btn--outline">
    Continue
    <svg class="btn__icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M9.3 3.3a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 1 1-1.4-1.4L11.6 9H2a1 1 0 1 1 0-2h9.6L9.3 4.7a1 1 0 0 1 0-1.4Z"/></svg>
  </button>
  <button class="btn btn--solid btn--icon-only" aria-label="Search">
    <svg class="btn__icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M7 2a5 5 0 1 0 3.1 8.9l3 3a1 1 0 0 0 1.4-1.4l-3-3A5 5 0 0 0 7 2ZM4 7a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z"/></svg>
  </button>
</div>

```html
<!-- Leading icon -->
<button class="btn btn--solid">
  <svg class="btn__icon" viewBox="0 0 16 16" aria-hidden="true"><path d="…"/></svg>
  New item
</button>

<!-- Trailing icon -->
<button class="btn btn--outline">
  Continue
  <svg class="btn__icon" viewBox="0 0 16 16" aria-hidden="true"><path d="…"/></svg>
</button>

<!-- Icon only — square; aria-label required -->
<button class="btn btn--solid btn--icon-only" aria-label="Search">
  <svg class="btn__icon" viewBox="0 0 16 16" aria-hidden="true"><path d="…"/></svg>
</button>
```

## Loading

Add `.btn--loading` plus `aria-busy="true"`. The label and icon fade out, a
spinner shows in the center, and clicks are blocked — while the button keeps its
size (no layout shift) and its brand color (unlike `:disabled`). The label text
stays in the DOM, so screen readers keep the accessible name; `aria-busy` tells
assistive tech the action is in progress.

<div class="ds-demo">
  <button class="btn btn--solid btn--loading" aria-busy="true">Saving…</button>
  <button class="btn btn--outline btn--loading" aria-busy="true">Saving…</button>
  <button class="btn btn--solid btn--accent btn--loading" aria-busy="true">Saving…</button>
  <button class="btn btn--solid btn--icon-only btn--loading" aria-busy="true" aria-label="Saving"></button>
</div>

```html
<button class="btn btn--solid btn--loading" aria-busy="true">Saving…</button>
<button class="btn btn--solid btn--icon-only btn--loading" aria-busy="true" aria-label="Saving"></button>
```

## States

Hover, active, and focus are automatic. Focus shows the purple ring. Solid disabled
uses a muted palette; outline disabled drops to 25% opacity.

<div class="ds-demo">
  <button class="btn btn--solid">Solid</button>
  <button class="btn btn--solid" disabled>Solid disabled</button>
  <button class="btn btn--outline">Outline</button>
  <button class="btn btn--outline" disabled>Outline disabled</button>
</div>

```html
<button class="btn btn--solid" disabled>Disabled</button>
<button class="btn btn--outline" aria-disabled="true">Disabled link-style</button>
```

## API

| Class | Required | Description |
| --- | --- | --- |
| `.btn` | ✅ | Base button |
| `.btn--solid` | one variant | Primary — black fill, white text |
| `.btn--outline` | one variant | Secondary — transparent fill, black border/text |
| `.btn--accent` | optional | Purple modifier — pair with `.btn--solid` (purple tonal) or `.btn--outline` (purple outline) |
| `.btn--sm` / `.btn--lg` | optional | Small / large (default medium) |
| `.btn__icon` | optional | Icon (`<svg>`) inside a button — inherits text color, scales with font-size |
| `.btn--icon-only` | optional | Square icon-only button — pair with `aria-label` |
| `.btn--loading` | optional | Loading state — centered spinner, content hidden, clicks blocked; pair with `aria-busy="true"` |

## Tokens

| Part | Solid | Solid · accent | Outline |
| --- | --- | --- | --- |
| Background | `button.solid.bg` | `button.solid-accent.bg` (purple.50) | `button.outline.bg` (transparent) |
| Text | `button.solid.text` | `button.solid-accent.text` (purple.600) | `button.outline.text` |
| Border | — | — | `button.outline.border` |
| Hover bg | `button.solid.bg-hover` | `button.solid-accent.bg-hover` | `button.outline.bg-hover` |
| Disabled | `button.solid.bg-disabled` | `button.solid-accent.bg-disabled` | 25% opacity |

## Accessibility

- Use a real `<button>`, or `<a>` for navigation.
- Don't rely on color alone; keep the focus ring.
- Mark disabled state with `disabled` or `aria-disabled="true"`.
