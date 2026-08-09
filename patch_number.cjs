const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const additionalCSS = `
.feature-card__number {
  z-index: 3;
}
`;

code = code + additionalCSS;
fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
