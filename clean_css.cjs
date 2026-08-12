const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

const badStart = code.indexOf('/* Removed CSS animation in favor of JS */');
if (badStart !== -1) {
  code = code.substring(0, badStart);
}

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
