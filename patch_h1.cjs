const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

code = code.replace(/<h1 className="hero-title-effect">\s*AI Game Launchpad\s*<\/h1>/, `<h1 className="hero-title-effect">
                Games are an expression of your worldview
              </h1>`);

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
