const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

code = code.replace(/\.capability-strip__grid strong \{\s*margin-bottom: 2px;\s*font-size: 31px;/m, '.capability-strip__grid strong {\n  margin-bottom: 2px;\n  font-size: 20px;');

code = code.replace(/\.capability-strip__grid strong \{ font-size: 25px; \}/g, '.capability-strip__grid strong { font-size: 18px; }');

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
