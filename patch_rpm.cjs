const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const n2oRegex = /<div className="racing-hud__gear">[\s\S]*?<\/div>/;

const tachometerSVG = `<div className="racing-hud__tachometer">
              <svg viewBox="0 0 200 200" className="racing-hud__gauge">
                <circle cx="100" cy="100" r="90" fill="rgba(0,0,0,0.6)" stroke="#333" strokeWidth="4"/>
                <path d="M 40 160 A 85 85 0 1 1 160 160" fill="none" stroke="#fff" strokeWidth="10" strokeDasharray="2 12" />
                <path d="M 140 50 A 85 85 0 0 1 160 160" fill="none" stroke="#ff003c" strokeWidth="10" />
                <text x="100" y="110" fill="#fff" fontSize="48" fontWeight="900" fontStyle="italic" textAnchor="middle">7.5</text>
                <text x="100" y="135" fill="#a1a1aa" fontSize="14" fontWeight="bold" textAnchor="middle">x1000 RPM</text>
              </svg>
            </div>`;

code = code.replace(n2oRegex, tachometerSVG);

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
