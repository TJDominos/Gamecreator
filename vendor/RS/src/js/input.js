/**
 * RS Design System — Input enhancer
 * Progressive behaviour for `.input` fields, opted in via data attributes:
 *
 *   data-format="number"    Positive integer. Illegal characters are dropped
 *                           and leading zeros stripped as you type; on blur
 *                           the value is clamped to the `min`/`max` attributes
 *                           and shown with thousand separators ("1234567" →
 *                           "1,234,567").
 *   data-format="currency"  Amount. Digits + one decimal point (max two
 *                           decimals) while typing; on blur clamped to
 *                           `min`/`max` and shown with thousand separators and
 *                           exactly two decimals ("1234.5" → "1,234.50").
 *   data-maxlength="30"     Soft length limit — typing past it is allowed
 *                           (never truncates), but the field turns invalid
 *                           (aria-invalid + danger ring) and the sibling
 *                           .input-field__count counter, if present, is kept
 *                           in sync and turns danger-red while over.
 *
 * The formatted text lives in `.value`; the canonical machine value is
 * mirrored to `data-value` ("1,234.50" → "1234.50") — read that on submit, or
 * call `rawValue(el)`. Formatting happens on blur; while focused the field
 * shows the plain unformatted number so caret behaviour stays native.
 *
 * Framework-agnostic, no dependencies.
 *
 *   import { initInputs } from '@tripletree/rs-design-system/input.js';
 *   initInputs();
 */

/** "1234567.89" → "1,234,567.89". */
function group(numStr) {
  const [int, dec] = numStr.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}

/** Keep only what the format allows; strip leading zeros ("007" → "7"). */
function sanitize(text, format) {
  let s = text.replace(/[^\d.]/g, '');
  if (format === 'number') {
    s = s.replace(/\./g, '');
  } else {
    // currency: first "." only, at most two decimals
    const i = s.indexOf('.');
    if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '').slice(0, 2);
  }
  // The lookahead keeps the lone zero of "0.50" intact.
  return s.replace(/^0+(?=\d)/, '');
}

/** Filter while typing, preserving the caret across dropped characters. */
function onType(el, format) {
  const typed = el.value;
  const clean = sanitize(typed, format);
  if (clean !== typed) {
    const caret = sanitize(typed.slice(0, el.selectionStart ?? typed.length), format).length;
    el.value = clean;
    el.setSelectionRange(caret, caret);
  }
  el.dataset.value = clean;
}

/** Clamp to min/max and apply the display format. Runs on blur. */
function commit(el, format) {
  const raw = sanitize(el.value, format);
  if (raw === '' || raw === '.') {
    el.value = '';
    delete el.dataset.value;
    return;
  }
  let n = Number(raw);
  const min = parseFloat(el.getAttribute('min'));
  const max = parseFloat(el.getAttribute('max'));
  if (!Number.isNaN(min) && n < min) n = min;
  if (!Number.isNaN(max) && n > max) n = max;
  const canonical = format === 'currency' ? n.toFixed(2) : String(Math.trunc(n));
  el.dataset.value = canonical;
  el.value = group(canonical);
}

/** Canonical unformatted value of an enhanced field ("1,234.50" → "1234.50"). */
export function rawValue(el) {
  return el?.dataset.value ?? el?.value ?? '';
}

function initSoftLimit(el) {
  const max = parseInt(el.dataset.maxlength, 10);
  if (!max) return;
  const count = el.closest('.input-field')?.querySelector('.input-field__count');
  const update = () => {
    const len = Array.from(el.value).length; // code points, so CJK/emoji count as 1
    const over = len > max;
    if (count) {
      count.textContent = `${len}/${max}`;
      count.classList.toggle('input-field__count--over', over);
    }
    if (over) {
      el.classList.add('input--invalid');
      el.setAttribute('aria-invalid', 'true');
      el.dataset.overLimit = 'true';
    } else if (el.dataset.overLimit === 'true') {
      // Only undo the invalid state we set ourselves.
      el.classList.remove('input--invalid');
      el.removeAttribute('aria-invalid');
      delete el.dataset.overLimit;
    }
  };
  el.addEventListener('input', update);
  update();
}

/** Enhance every [data-format] / [data-maxlength] field in `scope`. Idempotent. */
export function initInputs(scope = document) {
  scope
    .querySelectorAll('[data-format="number"], [data-format="currency"], [data-maxlength]')
    .forEach((el) => {
      if (el.dataset.inputReady === 'true') return;
      el.dataset.inputReady = 'true';

      const format = el.dataset.format;
      if (format === 'number' || format === 'currency') {
        if (!el.getAttribute('inputmode')) {
          el.setAttribute('inputmode', format === 'number' ? 'numeric' : 'decimal');
        }
        // While focused the field holds the plain number — native editing.
        el.addEventListener('focus', () => {
          el.value = el.value.replace(/,/g, '');
        });
        el.addEventListener('input', () => onType(el, format));
        el.addEventListener('blur', () => commit(el, format));
        commit(el, format); // format any server-rendered initial value
      }

      if (el.dataset.maxlength) initSoftLimit(el);
    });
}

if (typeof document !== 'undefined') {
  if (document.readyState !== 'loading') initInputs();
  else document.addEventListener('DOMContentLoaded', () => initInputs());
}

export default initInputs;
