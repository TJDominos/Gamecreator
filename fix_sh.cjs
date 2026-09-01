const fs = require('fs');
let code = fs.readFileSync('src/components/SiteHeader.tsx', 'utf8');
code = code.replace(/"\.\.\/developer-landing\/DeveloperLanding\.css"/, '"../pages/home/DeveloperLanding.css"');
fs.writeFileSync('src/components/SiteHeader.tsx', code);
