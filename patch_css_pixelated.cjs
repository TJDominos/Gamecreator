const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

code = code.replace(/\.process-list__icon--image img \{/g, '.process-list__icon--image img {\n  image-rendering: pixelated;');

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
