const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const newCSS = `
/* RACING THEME FOR PAGE 2 */
.landing-section--racing {
  background: #0d1117;
  color: #e5e7eb;
  position: relative;
  overflow: hidden;
}

.landing-section--racing::before {
  content: "";
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: 
    linear-gradient(to right, rgba(0, 210, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 210, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.5;
  pointer-events: none;
}

.landing-section--racing::after {
  content: "";
  position: absolute;
  bottom: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(0deg, #0d1117 0%, transparent 60%);
  pointer-events: none;
}

.landing-section--racing .section-heading h2 {
  color: #ffffff;
  font-style: italic;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(0, 210, 255, 0.3);
}

.landing-section--racing .section-heading p {
  color: #9ca3af;
}

.landing-section--racing .feature-card {
  background: rgba(20, 25, 32, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border-bottom: 3px solid #ff003c;
}

.landing-section--racing .feature-card::after {
  display: none;
}

.landing-section--racing .feature-card__number {
  color: #ff003c;
  font-size: 24px;
  font-style: italic;
  font-weight: 900;
  top: 16px;
  right: 20px;
}

.landing-section--racing .feature-card h3 {
  color: #ffffff;
  font-style: italic;
  text-transform: uppercase;
  margin-top: 8px;
}

.landing-section--racing .feature-card p {
  color: #a1a1aa;
}

.landing-section--racing .feature-card__image-container {
  border: 2px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.landing-section--racing .feature-card__image {
  filter: contrast(1.1) saturate(1.2);
}
`;

code = code + newCSS;

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
