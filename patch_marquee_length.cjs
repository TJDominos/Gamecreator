const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

code = code.replace(/\{\[\.\.\.Array\(20\)\]\.map\(/g, '{[...Array(60)].map(');

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
