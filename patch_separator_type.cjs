const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

code = code.replace(/type\?: 'dark' \| 'light'/g, "type?: 'dark' | 'light' | 'racing'");

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
