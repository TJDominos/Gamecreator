const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const target1 = '<GameSeparator type="racing" variant="racing" />';
const target2 = '{/* P3: From Concept to hit */}';
const target3 = '<section className="landing-section landing-section--light landing-section--process">';

const regex = /<GameSeparator type="racing" variant="racing" \/>\s*\{\/\* P3: From Concept to hit \*\/\}/;

code = code.replace(regex, '<GameSeparator type="dark" reverse variant="arcade" />\n        {/* P3: From Concept to hit */}');
fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
