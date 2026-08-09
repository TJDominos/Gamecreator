const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const additionalCSS = `
.process-list__icon--image {
  background: transparent !important;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 0;
  width: 54px;
  height: 54px;
}

.process-list__icon--image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
`;

code = code + additionalCSS;
fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
