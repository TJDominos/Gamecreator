const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/DeveloperPortal.tsx', 'utf8');
code = code.replace(/"\.\.\/auth\/AuthContext"/, '"../../auth/AuthContext"');
code = code.replace(/"\.\.\/components\/WltLogo"/, '"../../components/WltLogo"');
code = code.replace(/"\.\.\/components\/PortalHeader"/, '"../../components/PortalHeader"');
code = code.replace(/"\.\.\/components\/OnboardingHeader"/, '"../../components/OnboardingHeader"');
fs.writeFileSync('src/pages/dashboard/DeveloperPortal.tsx', code);
