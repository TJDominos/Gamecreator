const fs = require('fs');
let css = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const regex = /\.landing-hero::after \{[\s\S]*?clip-path:[^;]+;/;
css = css.replace(regex, `.landing-hero::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 60px;
  background: var(--landing-ink);
  clip-path: polygon(0 100%, 0 70%, 45% 15%, 100% 35%, 100% 100%);`);
  
fs.writeFileSync('src/developer-landing/DeveloperLanding.css', css);
console.log("Updated CSS clip-path.");
