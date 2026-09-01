const fs = require('fs');
let code = fs.readFileSync('src/developer-portal/bounties/BountyDetail.tsx', 'utf8');
code = code.replace(
  "    </div>\n  );\n}",
  "        </div>\n      </div>\n    </div>\n  );\n}"
);
fs.writeFileSync('src/developer-portal/bounties/BountyDetail.tsx', code);
