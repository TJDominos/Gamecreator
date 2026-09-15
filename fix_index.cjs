const fs = require('fs');
let code = fs.readFileSync('worker/src/index.ts', 'utf8');

if (!code.includes('handleAdminRoutes')) {
  code = code.replace(
    'import { handleGameRoutes } from "./routes/games";',
    'import { handleGameRoutes } from "./routes/games";\nimport { handleAdminRoutes } from "./routes/admin";'
  );
  
  code = code.replace(
    '      const authRes = await handleAuthRoutes(request, env);',
    '      const adminRes = await handleAdminRoutes(request, env);\n      if (adminRes) return adminRes;\n\n      const authRes = await handleAuthRoutes(request, env);'
  );
  fs.writeFileSync('worker/src/index.ts', code);
  console.log("Updated worker index.ts");
}
