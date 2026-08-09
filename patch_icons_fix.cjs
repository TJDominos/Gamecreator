const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

code = code.replace(/, Ghost, Sword, Crown/g, 'Ghost, Sword, Crown');
fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
