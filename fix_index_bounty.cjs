const fs = require('fs');
let code = fs.readFileSync('worker/src/index.ts', 'utf8');

if (!code.includes('handleBountyRoutes')) {
  code = code.replace(
    'import { handleAdminRoutes } from "./routes/admin";',
    'import { handleAdminRoutes } from "./routes/admin";\nimport { handleBountyRoutes } from "./routes/bounties";'
  );
  
  code = code.replace(
    '      const adminRes = await handleAdminRoutes(request, env);',
    '      const bountyRes = await handleBountyRoutes(request, env);\n      if (bountyRes) return bountyRes;\n\n      const adminRes = await handleAdminRoutes(request, env);'
  );
  fs.writeFileSync('worker/src/index.ts', code);
  console.log("Updated worker index.ts with bounties");
}
