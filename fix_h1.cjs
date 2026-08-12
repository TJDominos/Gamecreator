const fs = require('fs');
let css = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

css = css.replace(/\.landing-hero__copy \{[\s\S]*?\}/, `.landing-hero__copy {
  position: relative;
  z-index: 2;
  max-width: 800px;
}`);

css = css.replace(/\.landing-hero h1 \{[\s\S]*?\}/, `.landing-hero h1 {
  max-width: 800px;
  margin: 0;
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.1;
}`);

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', css);
console.log("Fixed H1 width.");
