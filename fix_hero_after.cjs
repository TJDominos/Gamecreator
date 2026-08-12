const fs = require('fs');
let css = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const regex = /\.landing-hero::after \{[\s\S]*?\}/;
css = css.replace(regex, `.landing-hero::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 140px;
  background: var(--landing-ink);
  clip-path: polygon(0 100%, 0 70%, 75% 20%, 100% 35%, 100% 100%);
  content: "";
  z-index: 0;
}`);

// Ensure hero deck is above the after element
const deckRegex = /\.hero-game-stage \{[\s\S]*?\}/;
if (css.match(deckRegex)) {
  css = css.replace(deckRegex, `.hero-game-stage {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 520px;
  perspective: 1200px;
}`);
}

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', css);
console.log("Updated clip-path and z-index.");
