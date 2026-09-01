const fs = require('fs');
const cssPath = 'src/developer-portal/DeveloperPortal.css';
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('.portal-date-hidden-input')) {
  css += `
.portal-date-hidden-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.portal-date-hidden-input::-webkit-calendar-picker-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  padding: 0;
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
}
