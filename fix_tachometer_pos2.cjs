const fs = require('fs');
let css = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const regex = /\.racing-hud__tachometer \{[\s\S]*?\}/;
css = css.replace(regex, `.racing-hud__tachometer {
  position: absolute;
  top: 316px;
  left: max(24px, calc(50% - 590px));
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  opacity: 0.8;
  filter: drop-shadow(0 0 10px rgba(0, 210, 255, 0.3));
}`);

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', css);
console.log("Fixed tachometer perfectly.");
