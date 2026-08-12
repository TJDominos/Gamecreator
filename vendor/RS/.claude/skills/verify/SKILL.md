---
name: verify
description: How to runtime-verify RS components in a real browser (build, serve, drive with Playwright + CDP touch gestures).
---

# Verifying RS Design System changes

CSS/JS components have no app shell here — build a tiny harness page and
drive it in the pre-installed Chromium.

## Build

```bash
npm ci            # fresh containers have no node_modules
npm run build     # regenerates dist/ (tokens + design-system.css) — dist is committed
```

## Serve + drive

1. Make a harness dir (scratchpad), symlink the repo's `dist/` and `src/` into
   it, and write an `index.html` that loads `/dist/design-system.css` and
   imports the component module from `/src/js/<component>.js` (modules need
   http, not file://).
2. `python3 -m http.server 8123` from the harness dir.
3. Playwright is installed globally; Chromium is pre-fetched:

   ```bash
   NODE_PATH=/opt/node22/lib/node_modules node drive.js
   # PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers is already exported
   ```

## Gotchas that cost time

- **Touch gestures:** synthetic JS TouchEvents do NOT exercise
  `touch-action`/native scroll/`pointercancel`. Use a CDP session:
  `Input.dispatchTouchEvent` with a `touchStart` → stepped `touchMove`s
  (~12ms apart) → `touchEnd`, in a context created with
  `{ hasTouch: true, isMobile: true }`.
- Chrome only claims a native scroll after ~10px of slop; small jitters keep
  the pointer stream alive.
- The popup sheet's close transition takes 240ms + a 320ms fallback timer —
  wait ~600ms before asserting `hidden`.
- Popup drag-to-dismiss threshold is 80px (`THRESHOLD` in `src/js/popup.js`);
  gestures near the bottom edge can't physically reach it.
- `setPointerCapture` retargets the eventual `click` to the capture target in
  Chromium — mouse clicks on child controls silently die. Test button clicks
  with `page.click` (mouse), not just `page.tap`; touch taps hide this class
  of bug because their compat click is hit-test based.
