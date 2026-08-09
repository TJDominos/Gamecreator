const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

code = code.replace(/font-size: clamp\(42px, 4\.4vw, 64px\);/g, 'font-size: 40px;');
code = code.replace(/\.closing-cta h2 \{ font-size: clamp\(46px, 5vw, 72px\); \}/g, '');

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
