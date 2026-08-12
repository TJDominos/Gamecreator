const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

code = code.replace(/<strong style=\{\{ color: '#d9a8ff' \}\}>/g, '<strong>');
code = code.replace(/<strong style=\{\{ color: '#ffb366' \}\}>/g, '<strong>');
code = code.replace(/<strong style=\{\{ color: '#4dd2ff' \}\}>/g, '<strong>');
code = code.replace(/<strong style=\{\{ color: '#66b3ff' \}\}>/g, '<strong>');

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
console.log("Removed inline colors for pillars");
