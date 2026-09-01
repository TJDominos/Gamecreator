const fs = require('fs');
let code = fs.readFileSync('src/pages/bounties/CreatorBounties.tsx', 'utf8');
code = code.replace(/'\.\/developer-portal\/bounties\/bountyData'/, "'../dashboard/bounties/bountyData'");
code = code.replace(/'\.\/components\/SiteHeader'/, "'../../components/SiteHeader'");
code = code.replace(/'\.\/components\/CategorySidebar'/, "'../../components/CategorySidebar'");
code = code.replace(/'\.\/CreatorGuide\.css'/, "'../guides/CreatorGuide.css'");
fs.writeFileSync('src/pages/bounties/CreatorBounties.tsx', code);
