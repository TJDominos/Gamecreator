const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

code = code.replace(/<GameSeparator type="dark" reverse \/>/, '<GameSeparator type="dark" reverse variant="arcade" />');
code = code.replace(/<GameSeparator type="dark" \/>/, '<GameSeparator type="dark" variant="platform" />');
code = code.replace(/<GameSeparator type="light" reverse \/>/, '<GameSeparator type="light" reverse variant="rpg" />');
code = code.replace(/<GameSeparator type="dark" \/>/, '<GameSeparator type="dark" variant="puzzle" />'); // wait, the 4th is before footer

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
