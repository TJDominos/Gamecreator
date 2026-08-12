const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');
console.log(code.substring(0, 500)); // check where to insert RacingHUD
