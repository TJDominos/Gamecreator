const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');
code = code.replace(/"\.\/developer-landing\/DeveloperLanding"/, '"./pages/home/DeveloperLanding"');
code = code.replace(/"\.\/developer-portal\/DeveloperPortal"/, '"./pages/dashboard/DeveloperPortal"');
code = code.replace(/"\.\/CreatorGuide"/, '"./pages/guides/CreatorGuide"');
code = code.replace(/"\.\/CreatorBounties"/, '"./pages/bounties/CreatorBounties"');
code = code.replace(/"\.\/PublicBountyDetail"/, '"./pages/bounties/PublicBountyDetail"');
fs.writeFileSync('src/main.tsx', code);
