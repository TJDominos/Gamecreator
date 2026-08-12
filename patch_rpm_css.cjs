const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const gearRegex = /\.racing-hud__gear\s*\{[\s\S]*?\}/;

const tachometerCSS = `.racing-hud__tachometer {
  position: absolute;
  top: 150px;
  left: -20px;
  width: 200px;
  height: 200px;
  opacity: 0.8;
  filter: drop-shadow(0 0 10px rgba(0, 210, 255, 0.3));
}`;

code = code.replace(gearRegex, tachometerCSS);
fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
