const fs = require('fs');
let code = fs.readFileSync('src/pages/home/DeveloperLanding.tsx', 'utf8');
code = code.replace(/"\.\.\/components\/Footer"/, '"../../components/Footer"');
code = code.replace(/"\.\.\/components\/WalletConnectModal"/, '"../../components/WalletConnectModal"');
code = code.replace(/"\.\.\/components\/GameCard"/, '"../../components/GameCard"');
code = code.replace(/"\.\.\/components\/SiteHeader"/, '"../../components/SiteHeader"');
code = code.replace(/"\.\.\/auth\/AuthContext"/, '"../../auth/AuthContext"');
code = code.replace(/"\.\.\/assets\/Logos"/, '"../../assets/Logos"');
fs.writeFileSync('src/pages/home/DeveloperLanding.tsx', code);
