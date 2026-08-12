const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const regex = /\.hero-title-effect \{[\s\S]*?\}/;
const newCSS = `.hero-title-purple {
  color: var(--landing-purple);
}
.hero-title-dark {
  color: #2b2b36;
}`;

code = code.replace(regex, newCSS);
fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
