const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

// Ensure font weights and colors match image
code = code.replace('.landing-hero h1 {\n  max-width: 710px;\n  margin: 0;\n  font-size: 40px;\n  font-weight: 800;\n  letter-spacing: -0.065em;\n  line-height: 0.98;\n}', '.landing-hero h1 {\n  max-width: 710px;\n  margin: 0;\n  font-size: 48px;\n  font-weight: 800;\n  letter-spacing: -0.04em;\n  line-height: 1.1;\n}');

code = code.replace('.landing-hero__lede {\n  max-width: 610px;\n  margin: 30px 0 0;\n  color: #4d4d58;\n  font-size: 18px;\n  line-height: 1.75;\n}', '.landing-hero__lede {\n  max-width: 500px;\n  margin: 30px 0 0;\n  color: #62626c;\n  font-size: 16px;\n  line-height: 1.5;\n  font-weight: 400;\n}');

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', code);
