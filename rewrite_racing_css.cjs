const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const splitIndex = code.indexOf('/* RACING THEME FOR PAGE 2 */');
if (splitIndex !== -1) {
  code = code.substring(0, splitIndex);
}

const newCSS = `
/* RACING THEME FOR PAGE 2 */
.landing-section--racing {
  background-image: url('https://images.unsplash.com/photo-1517781534062-8e1da4a047aa?auto=format&fit=crop&q=80&w=2000');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color: #e5e7eb;
  position: relative;
  overflow: hidden;
}

.landing-section--racing::before {
  content: "";
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(13, 17, 23, 0.7); /* Dark overlay for readability */
  pointer-events: none;
  z-index: 1;
}

.landing-section--racing .relative-z {
  position: relative;
  z-index: 2;
}

/* HUD Overlay */
.racing-hud {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.racing-hud__speedometer {
  position: absolute;
  bottom: 20px;
  right: 40px;
  width: 200px;
  height: 200px;
  opacity: 0.8;
  filter: drop-shadow(0 0 10px rgba(255, 0, 60, 0.5));
}

.racing-hud__gear {
  position: absolute;
  top: 150px;
  left: -20px;
  width: 150px;
  height: 150px;
  opacity: 0.3;
  transform: rotate(-15deg);
  animation: spin 10s linear infinite;
}

.racing-hud__tire {
  position: absolute;
  top: 40%;
  right: -30px;
  width: 120px;
  height: 120px;
  opacity: 0.2;
  transform: rotate(45deg);
}

@keyframes spin {
  100% { transform: rotate(345deg); }
}

.landing-section--racing .section-heading h2 {
  color: #ffffff;
  font-style: italic;
  text-transform: uppercase;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

.landing-section--racing .section-heading p {
  color: #d1d5db;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}

.landing-section--racing .feature-card {
  background: rgba(15, 20, 25, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  border-bottom: 4px solid #ff003c;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  transition: all 0.3s ease;
}

.landing-section--racing .feature-card::after {
  display: none;
}

.landing-section--racing .feature-card:hover {
  transform: translateY(-5px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 15px 40px rgba(255, 0, 60, 0.2);
}

.landing-section--racing .feature-card__number {
  color: #ff003c;
  font-size: 28px;
  font-style: italic;
  font-weight: 900;
  top: 20px;
  right: 24px;
  text-shadow: 0 0 10px rgba(255, 0, 60, 0.5);
}

.landing-section--racing .feature-card h3 {
  color: #ffffff;
  font-style: italic;
  text-transform: uppercase;
  margin-top: 12px;
}

.landing-section--racing .feature-card p {
  color: #e5e7eb;
}

.landing-section--racing .feature-card__image-container {
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
}
`;

code = code + newCSS;

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
