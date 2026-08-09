const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

code = code.replace(/grid-template-columns: 42px 60px 1fr;/g, 'grid-template-columns: 42px 76px 1fr;');

const additionalCSS = `
.process-list__icon--image {
  width: 64px !important;
  height: 64px !important;
  border-radius: 16px !important;
  box-shadow: 0 6px 16px rgba(0,0,0,0.12) !important;
  border: 1px solid rgba(16, 16, 20, 0.08);
}
`;

code = code + additionalCSS;
fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
