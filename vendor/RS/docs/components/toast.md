# Toast

A transient notification. `.toast` is a dark translucent surface (**black 65%**)
with light text — it sits over content and auto-dismisses. Showing, hiding, and
timing are app-managed; the design system provides the surface and an optional
stack.

Width is content-sized between **200px and 384px** and clamped to the viewport —
short toasts stay compact, longer ones grow then wrap, and on a narrow screen the
toast shrinks with a ~16px gutter each side. Same behaviour on mobile and desktop.

## Basic

<div class="ds-demo" style="background:linear-gradient(120deg,var(--color-purple-50),#fff)">
  <div class="toast">Saved to your library.</div>
</div>

```html
<div class="toast" role="status">Saved to your library.</div>
```

## With action

<div class="ds-demo" style="flex-direction:column; align-items:flex-start; background:linear-gradient(120deg,var(--color-purple-50),#fff)">
  <div class="toast">
    <span>Changes saved successfully.</span>
  </div>
  <div class="toast">
    <span>Profile updated.</span>
    <a class="btn btn--sm btn--solid btn--accent" href="#">Undo</a>
  </div>
</div>

```html
<div class="toast" role="status">
  <span>Profile updated.</span>
  <a class="btn btn--sm btn--solid btn--accent" href="#">Undo</a>
</div>
```

## Positioning

Stack toasts in a fixed `.toast-viewport` (bottom-centre by default):

```html
<div class="toast-viewport">
  <div class="toast" role="status">Uploaded.</div>
  <div class="toast" role="status">Saved.</div>
</div>
```

## API

| Class | Required | Description |
| --- | --- | --- |
| `.toast` | ✅ | The notification surface (black 65% + light text) |
| `.toast-viewport` | optional | Fixed, centred stack for live toasts |

## Tokens

| Part | Token |
| --- | --- |
| Background | `toast.bg` — `color.black-alpha.65` (#000000 @ 65%) |
| Text / icon | `toast.text` (white) |
| Radius | `radius.lg` (12px) |
| Width | `toast.min-width` (200px) → `toast.max-width` (384px), content-sized · clamped to `calc(100vw − 2rem)` |
| Min height | `toast.min-height` (60px) — grows with content |

## Accessibility

- Use `role="status"` (polite) for informational toasts, `role="alert"` for errors.
- Keep toasts brief; give actionable toasts enough time to read and act before auto-dismissing.
- Don't put essential, non-repeatable information only in a toast.
