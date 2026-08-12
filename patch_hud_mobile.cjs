const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const newCSS = `
@media (max-width: 768px) {
  .racing-hud__tachometer {
    top: 20px;
    left: -40px;
    width: 120px;
    height: 120px;
  }
  .racing-hud__speedometer {
    bottom: 10px;
    right: 10px;
    width: 120px;
    height: 120px;
  }
  .racing-hud__tire {
    display: none;
  }
  .game-marquee-container--racing {
    height: 24px;
  }
  .marquee-pixel-icon--racing {
    width: 24px !important;
    height: 24px !important;
  }
}
`;

code = code + newCSS;
fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
