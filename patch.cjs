const fs = require('fs');
let css = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

css = css.replace(/\.game-marquee-container--dark \{[\s\S]*?\}/, `.game-marquee-container--dark {
  background: var(--landing-ink);
  color: #cfa9ff;
  border-top: 4px solid var(--landing-purple);
  border-bottom: 4px solid var(--landing-purple);
  box-shadow: 0 0 20px rgba(97,54,154,0.3);
}`);

css = css.replace(/\.game-marquee-container--light \{[\s\S]*?\}/, `.game-marquee-container--light {
  background: var(--landing-purple);
  color: #fff;
  border-top: 4px solid var(--landing-teal);
  border-bottom: 4px solid var(--landing-teal);
  box-shadow: 0 0 20px rgba(57,170,161,0.3);
}`);

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', css);
