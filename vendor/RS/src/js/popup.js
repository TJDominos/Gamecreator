/**
 * RS Design System — Popup (bottom sheet)
 *
 * Progressively enhances markup of the shape:
 *
 *   <button class="btn btn--solid" data-popup-open="settings">Open</button>
 *   <div class="popup" id="settings" hidden>
 *     <div class="popup__overlay" data-popup-close></div>
 *     <div class="popup__sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
 *       <h2 id="settings-title">Settings</h2>
 *       <button class="btn btn--outline" data-popup-close>Close</button>
 *     </div>
 *   </div>
 *
 * Usage:
 *   import { initPopups } from '@tripletree/rs-design-system/popup.js';
 *   initPopups();
 *
 * Open via a `[data-popup-open="<id>"]` trigger; dismiss by tapping the overlay,
 * any `[data-popup-close]`, pressing Escape, or swiping the sheet down. Emits
 * `popup:open` / `popup:close` CustomEvents on the popup element. Idempotent.
 */

const THRESHOLD = 80; // px of downward drag that dismisses the sheet
const openers = new WeakMap(); // per popup: element to restore focus to on close
let prevBodyOverflow = ""; // body's inline overflow before the first popup locked it
let bodyLocked = false;

function openPopups() {
  return Array.from(document.querySelectorAll(".popup.is-open"));
}

function open(popup) {
  if (!popup || popup.classList.contains("is-open")) return;
  openers.set(popup, document.activeElement);
  popup.hidden = false;
  // force reflow so the transition runs from the hidden state
  void popup.offsetWidth;
  popup.classList.add("is-open");
  if (!bodyLocked) {
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    bodyLocked = true;
  }
  const sheet = popup.querySelector(".popup__sheet");
  if (sheet) {
    if (!sheet.hasAttribute("tabindex")) sheet.setAttribute("tabindex", "-1");
    sheet.focus();
  }
  popup.dispatchEvent(new CustomEvent("popup:open", { bubbles: true }));
}

function close(popup) {
  if (!popup || !popup.classList.contains("is-open")) return;
  popup.classList.remove("is-open");
  const sheet = popup.querySelector(".popup__sheet");
  if (sheet) sheet.style.transform = "";
  const done = () => {
    popup.hidden = true;
    sheet && sheet.removeEventListener("transitionend", done);
  };
  if (sheet) {
    sheet.addEventListener("transitionend", done, { once: true });
    setTimeout(done, 320); // fallback if transitionend doesn't fire
  } else {
    done();
  }
  if (!openPopups().length && bodyLocked) {
    document.body.style.overflow = prevBodyOverflow;
    bodyLocked = false;
  }
  popup.dispatchEvent(new CustomEvent("popup:close", { bubbles: true }));
  const opener = openers.get(popup);
  openers.delete(popup);
  if (opener && typeof opener.focus === "function") {
    // restore only if focus is in this popup (or nowhere) — closing a popup
    // underneath a stacked one must not steal focus from the top one
    const active = document.activeElement;
    if (!active || active === document.body || popup.contains(active)) opener.focus();
  }
}

// Pointer drag-down on the sheet → dismiss past THRESHOLD, else snap back.
// The sheet's CSS is `touch-action: pan-y`, so overflowing content scrolls
// natively on touch. A cancelable touchmove claims the gesture for the drag
// when it starts at the top and moves down — without that preventDefault the
// browser would treat it as a pan and pointercancel the drag.
function attachSwipe(popup) {
  const sheet = popup.querySelector(".popup__sheet");
  if (!sheet) return;
  let startY = null;
  let dy = 0;
  let gesture = null; // per touch gesture: "drag" (JS-owned) or "scroll" (native)
  sheet.addEventListener("pointerdown", (e) => {
    // only start a drag from the top of the scroll area
    if (sheet.scrollTop > 0) return;
    startY = e.clientY;
    dy = 0;
    sheet.style.transition = "none";
  });
  sheet.addEventListener("pointermove", (e) => {
    if (startY === null) return;
    dy = Math.max(0, e.clientY - startY);
    // capture only once a drag is actually underway — capturing on pointerdown
    // retargets the eventual click to the sheet, breaking plain clicks on
    // buttons inside it
    if (dy > 4 && !sheet.hasPointerCapture(e.pointerId)) sheet.setPointerCapture(e.pointerId);
    sheet.style.transform = `translateY(${dy}px)`;
  });
  const end = () => {
    if (startY === null) return;
    sheet.style.transition = "";
    sheet.style.transform = "";
    if (dy > THRESHOLD) close(popup);
    startY = null;
    gesture = null;
  };
  sheet.addEventListener("pointerup", end);
  sheet.addEventListener("pointercancel", end);
  sheet.addEventListener(
    "touchmove",
    (e) => {
      if (startY === null) return; // no candidate drag (started while scrolled)
      if (gesture === null) {
        const delta = e.touches[0].clientY - startY;
        if (Math.abs(delta) < 3) return; // contact jitter — too early to classify
        gesture = delta > 0 ? "drag" : "scroll";
      }
      if (gesture === "drag") e.preventDefault(); // keep the native pan from cancelling the drag
    },
    { passive: false }
  );
}

function enhance(popup) {
  if (popup.dataset.popupReady === "true") return;
  // Don't mark ready until the sheet exists — if the inner markup renders
  // after the wrapper, a later initPopups() pass must still enhance it.
  if (!popup.querySelector(".popup__sheet")) return;
  popup.dataset.popupReady = "true";
  popup.addEventListener("click", (e) => {
    if (e.target.closest("[data-popup-close]")) close(popup);
  });
  attachSwipe(popup);
}

/** Enhance every popup + wire its triggers within `scope` (defaults to document). */
export function initPopups(scope = document) {
  scope.querySelectorAll(".popup").forEach(enhance);
  scope.querySelectorAll("[data-popup-open]").forEach((trigger) => {
    if (trigger.dataset.popupTriggerReady === "true") return;
    trigger.dataset.popupTriggerReady = "true";
    trigger.addEventListener("click", () => {
      const popup = document.getElementById(trigger.getAttribute("data-popup-open"));
      open(popup);
    });
  });
}

// Global Escape (top-most popup) + auto-init, registered once.
if (typeof document !== "undefined" && !document.documentElement.dataset.popupGlobal) {
  document.documentElement.dataset.popupGlobal = "true";
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const open = openPopups();
      if (open.length) close(open[open.length - 1]);
    }
  });
  if (document.readyState !== "loading") initPopups();
  else document.addEventListener("DOMContentLoaded", () => initPopups());
}

export default initPopups;
