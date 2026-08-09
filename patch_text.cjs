const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

code = code.replace(/<h1>[\s\S]*?AI Game Launchpad[\s\S]*?<\/h1>/, `<h1>
                <span className="hero-title-effect">Games are an expression of your worldview</span>
              </h1>`);

// Capability strip replacement
code = code.replace(/<section className="capability-strip"[\s\S]*?<\/section>/, `<section className="capability-strip" aria-label="Platform capabilities">
          <div className="landing-container capability-strip__grid">
            <div>
              <strong>AI Loop</strong>
              <span>full integration cycle</span>
            </div>
            <div>
              <strong>Instant</strong>
              <span>from upload to publish</span>
            </div>
            <div>
              <strong>Monetize</strong>
              <span>flexible earning models</span>
            </div>
            <div>
              <strong>VRF</strong>
              <span>verifiable randomness</span>
            </div>
          </div>
        </section>`);

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
