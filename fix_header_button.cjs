const fs = require('fs');
let css = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const regex = /\.landing-nav__publish \{[\s\S]*?\}/;
css = css.replace(regex, `.landing-nav__publish {
  height: 40px;
  min-height: 40px;
  padding: 0 20px;
  font-size: 14px;
  border-radius: 9999px;
  background: var(--landing-purple) !important;
  box-shadow: none !important;
}`);

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', css);
console.log("Updated header button.");
