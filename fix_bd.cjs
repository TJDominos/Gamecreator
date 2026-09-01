const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/bounties/BountyDetail.tsx', 'utf8');
code = code.replace(/'\.\.\/\.\.\/components\/CategorySidebar'/, "'../../../components/CategorySidebar'");
fs.writeFileSync('src/pages/dashboard/bounties/BountyDetail.tsx', code);
