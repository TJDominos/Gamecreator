const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

code = code.replace(/<section className="landing-section landing-section--light" id="grow">/, '<section className="landing-section landing-section--racing" id="grow">');

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
