const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const titleRegex = /<h2>\s*Immediately grey release\s*<br \/>\s*No waiting period\s*<\/h2>/m;
code = code.replace(titleRegex, `<h2>
                Immediate release
                <br />
                No waiting period
              </h2>`);

const processListRegex = /<ol className="process-list">[\s\S]*?<\/ol>/m;
const newProcessList = `<ol className="process-list">
              <li>
                <span className="process-list__step">01</span>
                <div className="process-list__icon">
                  <CloudUpload aria-hidden="true" />
                </div>
                <div>
                  <h3>Private Preview</h3>
                  <p>Invite a select audience to playtest, gather early reviews, and build your wishlist.</p>
                </div>
              </li>
              <li>
                <span className="process-list__step">02</span>
                <div className="process-list__icon">
                  <Users aria-hidden="true" />
                </div>
                <div>
                  <h3>Grey Release</h3>
                  <p>
                    Roll out to a controlled player base to safely test mechanics, balance, and stability.
                  </p>
                </div>
              </li>
              <li>
                <span className="process-list__step">03</span>
                <div className="process-list__icon">
                  <Trophy aria-hidden="true" />
                </div>
                <div>
                  <h3>Scale to a Hit</h3>
                  <p>
                    Launch globally with confidence and begin monetizing your polished game.
                  </p>
                </div>
              </li>
            </ol>`;

code = code.replace(processListRegex, newProcessList);

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
