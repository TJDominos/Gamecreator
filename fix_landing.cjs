const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const regex = /\{\/\* P1: Hero section \*\/\}[\s\S]*?<GameSeparator type="dark" reverse variant="arcade" \/>/;

const replacement = `{/* P1: Hero section */}
        <section className="landing-section landing-section--dark landing-section--hero">
          <div className="landing-container">
            <div className="hero-content">
              <h1>
                Build and scale<br />your next hit game.
              </h1>
              <p className="hero-content__description">
                The all-in-one platform for game developers. Integrate AI, launch instantly, and monetize your creations.
              </p>
              <div className="landing-actions">
                <button
                  className="button button--primary button--large"
                  onClick={openSignInModal}
                >
                  Start Building <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </div>
            <HeroGameDeck />
          </div>
        </section>

        <section className="capability-strip" aria-label="Platform capabilities">
          <div className="landing-container capability-strip__grid">
            <div>
              <strong>Full AI Integration</strong>
            </div>
            <div>
              <strong>Instant Publishing</strong>
            </div>
            <div>
              <strong>Live Analytics</strong>
            </div>
            <div>
              <strong>Global Monetization</strong>
            </div>
          </div>
        </section>

        <GameSeparator type="racing" variant="racing" />`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
