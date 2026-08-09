const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const importRegex = /import \{\s*([^}]+)\s*\}\s*from\s*"lucide-react";/m;
const match = code.match(importRegex);
if (match) {
  let imports = match[1];
  if (!imports.includes('Ghost')) imports += ', Ghost';
  if (!imports.includes('Sword')) imports += ', Sword';
  if (!imports.includes('Crown')) imports += ', Crown';
  code = code.replace(importRegex, `import { ${imports} } from "lucide-react";`);
}

code = code.replace(/<CloudUpload aria-hidden="true" \/>/g, '<Ghost aria-hidden="true" />');
code = code.replace(/<Users aria-hidden="true" \/>/g, '<Sword aria-hidden="true" />');
code = code.replace(/<Trophy aria-hidden="true" \/>/g, '<Crown aria-hidden="true" />');

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
