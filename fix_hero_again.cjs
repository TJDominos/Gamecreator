const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const startIndex = code.indexOf('{/* P1: Hero section */}');
const endIndex = code.indexOf('<section className="capability-strip"');

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* P1: Hero section */}
        <section className="landing-hero" id="home">
          <div className="landing-container">
            <div className="landing-hero__grid">
              
              <div className="landing-hero__copy">
                <h1>
                  <span style={{ color: 'var(--landing-purple)' }}>Games are an expression of</span>{' '}
                  <span style={{ color: '#2b2b36' }}>your</span><br />
                  <span style={{ color: 'var(--landing-purple)' }}>worldview</span>
                </h1>
                
                <p className="landing-hero__lede">
                  Launch faster, connect with players, and let real-time feedback<br />shape your next hit
                </p>
              </div>
              
              <HeroGameDeck />
            </div>
          </div>
        </section>

        `;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  
  // Also fix capability strip
  const capStart = code.indexOf('<section className="capability-strip"');
  const capEnd = code.indexOf('</section>', capStart) + '</section>'.length;
  
  const capReplacement = `<section className="capability-strip" aria-label="Platform capabilities">
          <div className="landing-container capability-strip__grid">
            <div>
              <strong style={{ color: '#d9a8ff' }}>Full AI<br />Integration</strong>
            </div>
            <div>
              <strong style={{ color: '#ffb366' }}>Instant<br />Publishing</strong>
            </div>
            <div>
              <strong style={{ color: '#4dd2ff' }}>In-App<br />Purchase</strong>
            </div>
            <div>
              <strong style={{ color: '#66b3ff' }}>Public Verifiable<br />Randomness</strong>
            </div>
          </div>
        </section>`;
        
  code = code.substring(0, capStart) + capReplacement + code.substring(capEnd);
  
  fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
  console.log("Updated DeveloperLanding.tsx");
} else {
  console.log("Could not find boundaries.");
}
