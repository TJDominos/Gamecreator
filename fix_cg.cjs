const fs = require('fs');
let code = fs.readFileSync('src/pages/guides/CreatorGuide.tsx', 'utf8');
code = code.replace(/"\.\/components\/SiteHeader"/, '"../../components/SiteHeader"');
fs.writeFileSync('src/pages/guides/CreatorGuide.tsx', code);
