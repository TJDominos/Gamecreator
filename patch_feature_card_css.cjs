const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const additionalCSS = `
.feature-card__image-container {
  width: 100%;
  height: 160px;
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(16, 16, 20, 0.05);
  position: relative;
  z-index: 2;
}

.feature-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 400ms ease;
}

.feature-card:hover .feature-card__image {
  transform: scale(1.05);
}

.feature-card--with-image {
  padding-top: 24px;
}
`;

code = code + additionalCSS;
fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
