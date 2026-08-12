const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const regex = /<span className="hero-title-dark">your<\/span><br \/>\s*<span className="hero-title-purple">worldview<\/span>/;
code = code.replace(regex, '<span className="hero-title-dark">your</span> <span className="hero-title-purple">worldview</span>');
fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
console.log("Fixed worldview.");
