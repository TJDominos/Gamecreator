import DefaultTheme from 'vitepress/theme';
import { inBrowser } from 'vitepress';
// The real, generated design-system stylesheet — demos on every page render
// with the exact tokens and component CSS that consumers ship.
import '../../../dist/design-system.css';
import './custom.css';
// The framework-agnostic Select enhancer, so the listbox demos are interactive.
import { initInputs } from '../../../src/js/input.js';
import { initSelects } from '../../../src/js/select.js';
import { initPopups } from '../../../src/js/popup.js';
import { initLoadings } from '../../../src/js/loading.js';
import { initRefreshers } from '../../../src/js/refresh.js';

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (!inBrowser) return;
    const run = () => setTimeout(() => { initInputs(); initSelects(); initPopups(); initLoadings(); initRefreshers(); }, 0);
    const original = router.onAfterRouteChanged;
    router.onAfterRouteChanged = (to) => {
      original?.(to);
      run();
    };
    run();
  },
};
