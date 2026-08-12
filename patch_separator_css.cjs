const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const newCSS = `
.game-marquee-container--racing {
  background: #000;
  border-top: 4px solid #ff003c;
  border-bottom: 4px solid #ff003c;
  box-shadow: 0 0 20px rgba(255, 0, 60, 0.4);
}

.game-marquee-container--racing .game-marquee-track {
  gap: 0px; /* Checkered pattern should repeat seamlessly */
}

.marquee-pixel-icon--racing {
  width: 48px !important;
  height: 48px !important;
  margin: 0;
  display: block;
}
`;

code = code + newCSS;
fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
