const fs = require('fs');
const cssPath = 'src/developer-portal/DeveloperPortal.css';
let css = fs.readFileSync(cssPath, 'utf8');

css += `
.portal-sidebar {
  transition: transform 300ms ease;
}
.portal-main {
  transition: margin-left 300ms ease;
}
.portal-menu-button {
  transition: transform 200ms ease;
}
.portal-menu-button:active {
  transform: scale(0.95);
}
`;

fs.writeFileSync(cssPath, css, 'utf8');
