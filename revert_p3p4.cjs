const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

code = code.replace(/<section className="landing-section landing-section--racing landing-section--process">/, '<section className="landing-section landing-section--light landing-section--process">');
code = code.replace(/<section className="landing-section landing-section--racing" id="earn">/, '<section className="landing-section landing-section--light" id="earn">');

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
