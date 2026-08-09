const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const regex = /<p className="landing-eyebrow">From Concept to hit<\/p>\s*<h2>\s*Immediately grey release\.\s*<br \/>\s*No waiting period\.\s*<\/h2>/m;

const newString = `<h2>
                Immediately grey release.
                <br />
                No waiting period
              </h2>`;

code = code.replace(regex, newString);
fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
