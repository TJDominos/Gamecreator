const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

if (!code.includes('import AdminPortal from "./pages/AdminPortal"')) {
  // Insert import at the top
  code = code.replace(
    'import { SsoLoginFrame } from "./components/SsoLoginFrame";',
    'import { SsoLoginFrame } from "./components/SsoLoginFrame";\nimport AdminPortal from "./pages/AdminPortal";'
  );
  
  // Insert routing logic for /admin
  const beforeReturn = code.indexOf('return (\n    <>\n      <DeveloperPortal />');
  if (beforeReturn !== -1) {
    const routingLogic = 
`  if (location.pathname.startsWith("/admin")) {
    return (
      <>
        <AdminPortal />
        <VersionUpdateBanner />
      </>
    );
  }

  `;
    code = code.substring(0, beforeReturn) + routingLogic + code.substring(beforeReturn);
    fs.writeFileSync('src/main.tsx', code);
    console.log("Fixed main.tsx");
  } else {
    console.log("Could not find insertion point in main.tsx");
  }
}
