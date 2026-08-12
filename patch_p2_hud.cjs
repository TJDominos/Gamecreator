const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const hudHTML = `
        {/* P2: The AI-Powered Iteration Loop */}
        <section className="landing-section landing-section--racing" id="grow">
          <div className="racing-hud">
            <div className="racing-hud__speedometer">
              <svg viewBox="0 0 200 200" className="racing-hud__gauge">
                <circle cx="100" cy="100" r="90" fill="rgba(0,0,0,0.6)" stroke="#333" strokeWidth="4"/>
                <path d="M 30 150 A 90 90 0 1 1 170 150" fill="none" stroke="#ff003c" strokeWidth="8" strokeLinecap="round" strokeDasharray="300" strokeDashoffset="100" />
                <text x="100" y="110" fill="#fff" fontSize="48" fontWeight="900" fontStyle="italic" textAnchor="middle">222</text>
                <text x="100" y="135" fill="#a1a1aa" fontSize="14" fontWeight="bold" textAnchor="middle">KM/H</text>
                <text x="145" y="80" fill="#ff003c" fontSize="24" fontWeight="900" fontStyle="italic">6</text>
              </svg>
            </div>
            <div className="racing-hud__gear">
              <svg viewBox="0 0 100 100" className="racing-hud__cog">
                <circle cx="50" cy="50" r="30" fill="none" stroke="#fff" strokeWidth="12" strokeDasharray="10 15"/>
                <circle cx="50" cy="50" r="20" fill="rgba(255,255,255,0.2)" stroke="#fff" strokeWidth="4"/>
                <text x="50" y="56" fill="#fff" fontSize="18" fontWeight="bold" textAnchor="middle">N2O</text>
              </svg>
            </div>
            <div className="racing-hud__tire">
               <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="#111" stroke="#333" strokeWidth="15" strokeDasharray="12 4"/>
                  <circle cx="50" cy="50" r="25" fill="#222" stroke="#444" strokeWidth="2"/>
                  <circle cx="50" cy="50" r="8" fill="#555"/>
                  <circle cx="35" cy="50" r="3" fill="#888"/>
                  <circle cx="65" cy="50" r="3" fill="#888"/>
                  <circle cx="50" cy="35" r="3" fill="#888"/>
                  <circle cx="50" cy="65" r="3" fill="#888"/>
               </svg>
            </div>
          </div>
          <div className="landing-container relative-z">`;

code = code.replace(/\{\/\* P2: The AI-Powered Iteration Loop \*\/\}\s*<section className="landing-section landing-section--racing" id="grow">\s*<div className="landing-container">/m, hudHTML);

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
