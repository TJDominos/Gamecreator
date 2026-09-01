const fs = require('fs');
let code = fs.readFileSync('src/pages/bounties/PublicBountyDetail.tsx', 'utf8');
code = code.replace(/'\.\/components\/SiteHeader'/, "'../../components/SiteHeader'");
code = code.replace(/'\.\/developer-portal\/bounties\/BountyDetail'/, "'../dashboard/bounties/BountyDetail'");
fs.writeFileSync('src/pages/bounties/PublicBountyDetail.tsx', code);
