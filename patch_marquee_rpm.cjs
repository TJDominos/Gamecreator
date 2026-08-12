const fs = require('fs');

// Update TSX
let codeTSX = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');
codeTSX = codeTSX.replace(
  '<text x="100" y="135" fill="#a1a1aa" fontSize="14" fontWeight="bold" textAnchor="middle">x1000 RPM</text>\n              </svg>',
  \`<text x="100" y="135" fill="#a1a1aa" fontSize="14" fontWeight="bold" textAnchor="middle">x1000 RPM</text>
                <g className="tachometer-needle">
                  <circle cx="100" cy="100" r="8" fill="#ff003c" />
                  <polygon points="96,100 104,100 100,25" fill="#ff003c" />
                </g>
              </svg>\`
);
fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', codeTSX);

// Update CSS
let codeCSS = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

// Remove red border from game-marquee-container--racing
codeCSS = codeCSS.replace(
  /.game-marquee-container--racing \{\s*background: #000;\s*border-top: 4px solid #ff003c;\s*border-bottom: 4px solid #ff003c;\s*box-shadow: 0 0 20px rgba\(255, 0, 60, 0.4\);\s*\}/g,
  \`.game-marquee-container--racing {
  background: #000;
}\`
);

// Add animation for tachometer-needle
const animCSS = \`
.tachometer-needle {
  transform-origin: 100px 100px;
  animation: revving 4s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
}

@keyframes revving {
  0% { transform: rotate(-120deg); }
  20% { transform: rotate(-30deg); }
  35% { transform: rotate(-70deg); }
  55% { transform: rotate(110deg); }
  65% { transform: rotate(90deg); }
  85% { transform: rotate(-120deg); }
  100% { transform: rotate(-120deg); }
}
\`;
codeCSS = codeCSS + animCSS;

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', codeCSS);
