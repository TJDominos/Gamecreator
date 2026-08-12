const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const regex = /<section className="capability-strip"[\s\S]*?<\/section>/m;

const newSection = `<section className="capability-strip" aria-label="Platform capabilities">
          <div className="landing-container capability-strip__grid">
            <div>
              <strong>Full AI Integration</strong>
            </div>
            <div>
              <strong>Instant Publishing</strong>
            </div>
            <div>
              <strong>In-App Purchase</strong>
            </div>
            <div>
              <strong>Public Verifiable Randomness</strong>
            </div>
          </div>
        </section>`;

code = code.replace(regex, newSection);
fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
