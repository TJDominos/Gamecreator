/**
 * RS Design System — Loading (progress bar)
 *
 * Progressively enhances markup of the shape:
 *
 *   <div class="loading" data-loading data-progress="0">
 *     <div class="loading__bar"><div class="loading__bar-fill"></div></div>
 *     <p class="loading__label" data-template="Loading… {value}%"></p>
 *   </div>
 *
 * Usage:
 *   import { initLoadings, setLoadingProgress } from '@tripletree/rs-design-system/loading.js';
 *   initLoadings();                       // enhance every [data-loading]
 *   setLoadingProgress(el, 86);          // move the bar, ARIA + label follow
 *
 * Each call is idempotent. Reaching 100 emits a `loading:complete`
 * CustomEvent on the wrapper (once).
 */

/** Move the bar to `value` (0–100); ARIA and the percent label follow. */
export function setLoadingProgress(root, value) {
  if (!root) return; // tolerate query misses, like setRefreshing/spinOnce
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  root.style.setProperty('--loading-progress', String(clamped));

  const bar = root.querySelector('.loading__bar');
  if (bar) bar.setAttribute('aria-valuenow', String(Math.round(clamped)));

  const label = root.querySelector('.loading__label');
  if (label) {
    const template = label.dataset.template;
    if (template) label.textContent = template.replace('{value}', String(Math.round(clamped)));
  }

  if (clamped >= 100 && root.dataset.loadingDone !== 'true') {
    root.dataset.loadingDone = 'true';
    root.dispatchEvent(new CustomEvent('loading:complete', { bubbles: true }));
  } else if (clamped < 100) {
    delete root.dataset.loadingDone;
  }
}

function enhance(root) {
  if (root.dataset.loadingReady === 'true') return;

  const bar = root.querySelector('.loading__bar');
  // Don't mark ready until the bar exists — if the inner markup renders
  // after the wrapper, a later init pass must still enhance it.
  if (!bar) return;
  root.dataset.loadingReady = 'true';

  // ARIA scaffolding.
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  // Indeterminate bars omit aria-valuenow (set per-update below when known).
  if (bar.classList.contains('loading__bar--indeterminate')) {
    bar.removeAttribute('aria-valuenow');
  }
  if (!bar.hasAttribute('aria-label') && !bar.hasAttribute('aria-labelledby')) {
    const label = root.querySelector('.loading__label');
    if (label) {
      if (!label.id) label.id = `loading-label-${Math.round(performance.now())}`;
      bar.setAttribute('aria-labelledby', label.id);
    } else {
      bar.setAttribute('aria-label', 'Loading');
    }
  }

  if (!root.querySelector('.loading__bar--indeterminate')) {
    setLoadingProgress(root, root.dataset.progress ?? 0);
  }
}

/** Enhance every [data-loading] within `scope` (defaults to the document). */
export function initLoadings(scope = document) {
  scope.querySelectorAll('[data-loading]').forEach(enhance);
}

// Auto-init when loaded as a plain module/script.
if (typeof document !== 'undefined' && !document.documentElement.dataset.loadingGlobal) {
  document.documentElement.dataset.loadingGlobal = 'true';
  if (document.readyState !== 'loading') initLoadings();
  else document.addEventListener('DOMContentLoaded', () => initLoadings());
}

export default initLoadings;
