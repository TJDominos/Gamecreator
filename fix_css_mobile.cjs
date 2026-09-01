const fs = require('fs');
const cssPath = 'src/developer-portal/DeveloperPortal.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(
  '.portal-sidebar.is-unpinned {\n  transform: translateX(-100%);\n}',
  `@media (min-width: 901px) {
  .portal-sidebar.is-unpinned {
    transform: translateX(-100%);
  }
}`
);

fs.writeFileSync(cssPath, css, 'utf8');
