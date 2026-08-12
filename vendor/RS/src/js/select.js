/**
 * RS Design System — Select (JS-driven listbox)
 *
 * Progressively enhances markup of the shape:
 *
 *   <div class="select select--form" data-select>
 *     <button type="button" class="select__trigger" aria-haspopup="listbox" aria-expanded="false">
 *       <span class="select__value select__value--placeholder">Choose an option…</span>
 *       <span class="select__caret" aria-hidden="true"></span>
 *     </button>
 *     <ul class="select__panel" role="listbox" tabindex="-1" hidden>
 *       <li class="select__option" role="option" data-value="london">London</li>
 *     </ul>
 *   </div>
 *
 * Optional: add `data-name="city"` on the wrapper to mirror the chosen value
 * into a hidden <input> so the control participates in form submission.
 *
 * Usage:
 *   import { initSelects } from '@tripletree/rs-design-system/select.js';
 *   initSelects();                 // enhance every [data-select] on the page
 *   initSelects(myContainer);      // …or within a subtree
 *
 * Each call is idempotent — already-enhanced controls are skipped. Emits a
 * `select:change` CustomEvent ({ detail: { value, label } }) on the wrapper.
 *
 * Behaviour beyond open/close/choose:
 *   - the panel flips above the trigger when there's no room below
 *   - the active option is exposed via aria-activedescendant
 *   - type-ahead: printable characters jump to the next matching option
 *   - the placeholder style on .select__value clears on first selection
 */

const OPTION = '.select__option';
const CLOSE_FALLBACK_MS = 150; // safety net past the 100ms close animation

const typeahead = new WeakMap(); // root -> { buffer, timer }
const closing = new WeakMap(); // panel -> { done, timer }

function closeAll(except) {
  document.querySelectorAll('.select__trigger[aria-expanded="true"]').forEach((t) => {
    if (t !== except) collapse(t.closest('.select'));
  });
}

function options(root) {
  return Array.from(root.querySelectorAll(OPTION)).filter(
    (o) => o.getAttribute('aria-disabled') !== 'true'
  );
}

function setActive(root, el) {
  const panel = root.querySelector('.select__panel');
  root.querySelectorAll(OPTION).forEach((o) => o.removeAttribute('data-active'));
  if (el) {
    el.setAttribute('data-active', 'true');
    if (panel && el.id) panel.setAttribute('aria-activedescendant', el.id);
    el.scrollIntoView({ block: 'nearest' });
  } else if (panel) {
    panel.removeAttribute('aria-activedescendant');
  }
}

function activeOption(root) {
  return root.querySelector(`${OPTION}[data-active="true"]`);
}

/* Cancel an in-flight close animation (e.g. when reopening immediately). */
function cancelClose(panel) {
  const pending = closing.get(panel);
  if (!pending) return;
  closing.delete(panel);
  clearTimeout(pending.timer);
  panel.removeEventListener('animationend', pending.done);
  delete panel.dataset.closing;
}

/* Flip the panel above the trigger when the space below can't fit it. */
function position(trigger, panel) {
  panel.classList.remove('select__panel--up');
  const rect = trigger.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom;
  if (below < panel.offsetHeight + 8 && rect.top > below) {
    panel.classList.add('select__panel--up');
  }
}

function expand(root) {
  const trigger = root.querySelector('.select__trigger');
  const panel = root.querySelector('.select__panel');
  if (!trigger || !panel || trigger.disabled) return;
  closeAll(trigger);
  cancelClose(panel);
  panel.hidden = false;
  position(trigger, panel);
  trigger.setAttribute('aria-expanded', 'true');
  const current = root.querySelector(`${OPTION}[aria-selected="true"]`);
  setActive(root, current || options(root)[0]);
  panel.focus();
}

function collapse(root) {
  if (!root) return;
  const trigger = root.querySelector('.select__trigger');
  const panel = root.querySelector('.select__panel');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  setActive(root, null);
  if (!panel || panel.hidden || closing.has(panel)) return;

  // Play the fade-out (CSS [data-closing]) before actually hiding; a timer
  // covers the case where no animation runs (prefers-reduced-motion).
  const done = (e) => {
    if (e && e.target !== panel) return;
    cancelClose(panel);
    panel.hidden = true;
    panel.classList.remove('select__panel--up');
  };
  panel.addEventListener('animationend', done);
  closing.set(panel, { done, timer: setTimeout(done, CLOSE_FALLBACK_MS) });
  panel.dataset.closing = 'true';
}

function choose(root, option) {
  if (!option || option.getAttribute('aria-disabled') === 'true') return;
  root.querySelectorAll(OPTION).forEach((o) => o.setAttribute('aria-selected', 'false'));
  option.setAttribute('aria-selected', 'true');

  const label = option.textContent.trim();
  const value = option.dataset.value ?? label;
  const valueEl = root.querySelector('.select__value');
  if (valueEl) {
    valueEl.textContent = label;
    valueEl.classList.remove('select__value--placeholder');
  }

  const hidden = root.querySelector('input[type="hidden"]');
  if (hidden) hidden.value = value;

  root.dispatchEvent(
    new CustomEvent('select:change', { bubbles: true, detail: { value, label } })
  );

  const trigger = root.querySelector('.select__trigger');
  collapse(root);
  if (trigger) trigger.focus();
}

/* Type-ahead: accumulate printable keys for 500ms and move the active option
   to the next label starting with the buffer (wrapping past the end). */
function onTypeahead(root, char, open) {
  const state = typeahead.get(root) ?? { buffer: '', timer: 0 };
  clearTimeout(state.timer);
  state.buffer += char.toLowerCase();
  state.timer = setTimeout(() => {
    state.buffer = '';
  }, 500);
  typeahead.set(root, state);

  const opts = options(root);
  const from = opts.indexOf(activeOption(root));
  // A repeated single letter cycles through matches; a growing buffer stays.
  const start = state.buffer.length > 1 ? Math.max(from, 0) : from + 1;
  for (let step = 0; step < opts.length; step++) {
    const option = opts[(start + step) % opts.length];
    if (option.textContent.trim().toLowerCase().startsWith(state.buffer)) {
      if (!open) expand(root);
      setActive(root, option);
      return;
    }
  }
}

function onKeydown(root, e) {
  const trigger = root.querySelector('.select__trigger');
  const open = trigger?.getAttribute('aria-expanded') === 'true';
  const opts = options(root);
  if (!opts.length) return;

  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowUp': {
      e.preventDefault();
      if (!open) return expand(root);
      const cur = activeOption(root);
      let i = opts.indexOf(cur);
      i = e.key === 'ArrowDown' ? Math.min(opts.length - 1, i + 1) : Math.max(0, i - 1);
      setActive(root, opts[i] ?? opts[0]);
      break;
    }
    case 'Home':
      if (open) { e.preventDefault(); setActive(root, opts[0]); }
      break;
    case 'End':
      if (open) { e.preventDefault(); setActive(root, opts[opts.length - 1]); }
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (open) choose(root, activeOption(root));
      else expand(root);
      break;
    case 'Escape':
      if (open) { e.preventDefault(); collapse(root); trigger.focus(); }
      break;
    case 'Tab':
      if (open) collapse(root);
      break;
    default:
      if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        onTypeahead(root, e.key, open);
      }
      break;
  }
}

function enhance(root) {
  if (root.dataset.selectReady === 'true') return;

  const trigger = root.querySelector('.select__trigger');
  const panel = root.querySelector('.select__panel');
  // Don't mark ready until the required parts exist — if the inner markup
  // renders after the wrapper, a later init pass must still enhance it.
  if (!trigger || !panel) return;
  root.dataset.selectReady = 'true';

  // ARIA scaffolding.
  if (!panel.id) panel.id = `select-panel-${Math.round(performance.now())}-${options(root).length}`;
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-controls', panel.id);
  if (!trigger.hasAttribute('aria-expanded')) trigger.setAttribute('aria-expanded', 'false');
  panel.setAttribute('role', 'listbox');
  if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
  root.querySelectorAll(OPTION).forEach((o, i) => {
    o.setAttribute('role', 'option');
    if (!o.id) o.id = `${panel.id}-opt-${i}`;
    if (!o.hasAttribute('aria-selected')) o.setAttribute('aria-selected', 'false');
  });

  // Nothing preselected → the trigger text is a placeholder.
  const valueEl = root.querySelector('.select__value');
  if (valueEl && !root.querySelector(`${OPTION}[aria-selected="true"]`)) {
    valueEl.classList.add('select__value--placeholder');
  }

  // Optional hidden input for form submission.
  if (root.dataset.name && !root.querySelector('input[type="hidden"]')) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = root.dataset.name;
    const selected = root.querySelector(`${OPTION}[aria-selected="true"]`);
    input.value = selected ? selected.dataset.value ?? selected.textContent.trim() : '';
    root.appendChild(input);
  }

  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') === 'true';
    open ? collapse(root) : expand(root);
  });

  panel.addEventListener('click', (e) => {
    const option = e.target.closest(OPTION);
    if (option) {
      // A wrapping <label> would otherwise forward this click to its labelable
      // control (the trigger button) and immediately reopen the panel.
      e.preventDefault();
      choose(root, option);
    }
  });

  panel.addEventListener('mousemove', (e) => {
    const option = e.target.closest(OPTION);
    if (option && option.getAttribute('aria-disabled') !== 'true') setActive(root, option);
  });

  root.addEventListener('keydown', (e) => onKeydown(root, e));
}

/** Enhance every [data-select] within `scope` (defaults to the document). */
export function initSelects(scope = document) {
  scope.querySelectorAll('[data-select]').forEach(enhance);
}

// Close on outside click at the document level (registered once).
if (typeof document !== 'undefined' && !document.documentElement.dataset.selectGlobal) {
  document.documentElement.dataset.selectGlobal = 'true';
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.select')) closeAll(null);
  });
  // Auto-init when loaded as a plain module/script.
  if (document.readyState !== 'loading') initSelects();
  else document.addEventListener('DOMContentLoaded', () => initSelects());
}

export default initSelects;
