const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPortal.tsx', 'utf8');

if (!code.includes('import { UserAdmin } from "./admin/UserAdmin"')) {
  code = code.replace(
    'import { RequireAdmin } from "../auth/RequireAdmin";',
    'import { RequireAdmin } from "../auth/RequireAdmin";\nimport { UserAdmin } from "./admin/UserAdmin";'
  );
  
  const userAdminRegex = /function UserAdmin\(\) \{[\s\S]*?\}\n/g;
  code = code.replace(userAdminRegex, '');
  
  fs.writeFileSync('src/pages/AdminPortal.tsx', code);
  console.log("Updated AdminPortal.tsx");
}
