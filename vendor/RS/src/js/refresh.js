/**
 * RS Design System — Refresh enhancer
 * Progressive behaviour for `.refresh` buttons (`[data-refresh]`):
 *   - spins two full turns when first enhanced (the view loaded → value refreshed)
 *   - spins again on every click, and emits a `refresh` event the app handles
 *     to actually re-fetch the value
 *   - `setRefreshing(el, true)` spins continuously for an async reload; pass
 *     false when the data lands
 *
 * Framework-agnostic, no dependencies. Honours prefers-reduced-motion (no spin,
 * but the `refresh` event still fires so data still reloads).
 *
 *   import { initRefreshers } from '@tripletree/rs-design-system/refresh.js';
 *   initRefreshers();
 *   document.querySelector('.refresh').addEventListener('refresh', reloadBalance);
 */

const REDUCED = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Spin the icon two full turns (no-op under reduced motion). */
export function spinOnce(el) {
  if (!el || REDUCED() || el.classList.contains('refresh--busy')) return;
  el.classList.remove('is-spinning');
  void el.offsetWidth; // reflow so the animation can restart mid-spin
  el.classList.add('is-spinning');
}

/** Continuous spin for an async reload; call again with false when it's done. */
export function setRefreshing(el, busy) {
  if (!el) return;
  el.classList.toggle('refresh--busy', !!busy);
  if (busy) el.setAttribute('aria-busy', 'true');
  else el.removeAttribute('aria-busy');
}

/** Enhance every [data-refresh] in `scope`. Idempotent. */
export function initRefreshers(scope = document) {
  scope.querySelectorAll('[data-refresh]').forEach((el) => {
    if (el.dataset.refreshReady === 'true') return;
    el.dataset.refreshReady = 'true';

    // Fallback a11y label so screen readers announce the control.
    if (!el.getAttribute('aria-label') && !el.textContent.trim()) {
      el.setAttribute('aria-label', 'Refresh');
    }

    el.addEventListener('animationend', () => el.classList.remove('is-spinning'));
    el.addEventListener('click', () => {
      spinOnce(el);
      el.dispatchEvent(new CustomEvent('refresh', { bubbles: true }));
    });

    // Spin once on load unless opted out with data-spin-on-load="false".
    if (el.dataset.spinOnLoad !== 'false') spinOnce(el);
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState !== 'loading') initRefreshers();
  else document.addEventListener('DOMContentLoaded', () => initRefreshers());
}

export default initRefreshers;
