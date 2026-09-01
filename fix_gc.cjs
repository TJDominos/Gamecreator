const fs = require('fs');
let code = fs.readFileSync('src/components/GameCard.tsx', 'utf8');
code = code.replace(/"\.\.\/developer-landing\/DeveloperLanding\.css"/, '"../pages/home/DeveloperLanding.css"');
fs.writeFileSync('src/components/GameCard.tsx', code);
