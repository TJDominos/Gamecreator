const fs = require('fs');
let css = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const regex = /\.racing-hud__tachometer \{[\s\S]*?\}/;
css = css.replace(regex, `.racing-hud__tachometer {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-80%, -80%);
  width: 200px;
  height: 200px;
  opacity: 0.8;
  filter: drop-shadow(0 0 10px rgba(0, 210, 255, 0.3));
  pointer-events: none;
  z-index: 10;
}`);

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', css);
console.log("Fixed tachometer CSS.");
