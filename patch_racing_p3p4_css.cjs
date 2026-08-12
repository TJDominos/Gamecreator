const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const newCSS = `
/* RACING THEME FOR PAGE 3 */
.landing-section--racing .process-list li {
  border-top-color: rgba(255, 255, 255, 0.1);
}
.landing-section--racing .process-list li:last-child {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}
.landing-section--racing .process-list__step {
  color: #ff003c;
  font-style: italic;
  font-size: 16px;
}
.landing-section--racing .process-list h3 {
  color: #ffffff;
  font-style: italic;
  text-transform: uppercase;
}
.landing-section--racing .process-list p {
  color: #a1a1aa;
}
.landing-section--racing .process-list__icon--image {
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 15px rgba(0, 210, 255, 0.2) !important;
}

/* RACING THEME FOR PAGE 4 */
.landing-section--racing .earning-card {
  background: rgba(20, 25, 32, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 3px solid #ff003c;
}
.landing-section--racing .earning-card:hover {
  background: rgba(30, 36, 46, 0.9);
  border-color: rgba(0, 210, 255, 0.5);
  box-shadow: 0 10px 30px rgba(0, 210, 255, 0.2);
}
.landing-section--racing .earning-card h3 {
  color: #ffffff;
  font-style: italic;
  text-transform: uppercase;
}
.landing-section--racing .earning-card p {
  color: #a1a1aa;
}
.landing-section--racing .earning-card__icon {
  background: rgba(255, 0, 60, 0.1) !important;
  color: #ff003c !important;
  border: 1px solid rgba(255, 0, 60, 0.3);
}
.landing-section--racing .landing-eyebrow {
  color: #ff003c;
}

/* Game Separators */
.landing-section--racing + .game-separator {
  background: #0d1117;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.landing-section--racing + .game-separator::before,
.landing-section--racing + .game-separator::after {
  opacity: 0.2;
}
`;

code = code + newCSS;

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
