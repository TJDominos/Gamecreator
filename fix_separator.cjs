const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const targetStr = `        </section>

        <GameSeparator type="racing" variant="racing" />
        
        {/* P2: The AI-Powered Iteration Loop */}`;

const replaceStr = `        </section>

        <GameSeparator type="dark" reverse variant="arcade" />
        
        {/* P2: The AI-Powered Iteration Loop */}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
console.log("Restored purple separator.");
