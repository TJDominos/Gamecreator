const fs = require('fs');
let code = fs.readFileSync('src/components/CategorySidebar.tsx', 'utf8');
code = code.replace(/'\.\.\/developer-portal\/bounties\/bountyData'/, "'../pages/dashboard/bounties/bountyData'");
fs.writeFileSync('src/components/CategorySidebar.tsx', code);
