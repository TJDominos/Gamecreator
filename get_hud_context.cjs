const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');
const lines = code.split('\n');
const startIndex = lines.findIndex(l => l.includes('<section className="landing-section landing-section--racing" id="grow">'));
console.log(lines.slice(startIndex, startIndex + 10).join('\n'));
