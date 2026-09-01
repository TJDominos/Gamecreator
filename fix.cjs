const fs = require('fs');
let code = fs.readFileSync('src/CreatorBounties.tsx', 'utf8');
code = code.replace(/                        }}\n                        onClick={\(e\) => {\n                          e\.stopPropagation\(\);\n                          navigate\(\`\\\/dashboard\\\/bounties\\\/\$\{bounty\.id\}\`\);\n                        }}\n                        }}/g, 
`                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(\`/dashboard/bounties/\${bounty.id}\`);
                        }}`);
fs.writeFileSync('src/CreatorBounties.tsx', code, 'utf8');
