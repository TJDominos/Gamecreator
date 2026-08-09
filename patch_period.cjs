const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

code = code.replace(/Immediately grey release\./g, 'Immediately grey release');

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
