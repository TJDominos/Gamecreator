const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const startIndex = code.indexOf('{/* P1: Hero section */}');
const endIndex = code.indexOf('<section className="capability-strip"');

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* P1: Hero section */}
        <section className="landing-hero" id="home">
          <div className="landing-hero__shape landing-hero__shape--one"></div>
          <div className="landing-hero__shape landing-hero__shape--two"></div>
          
          <div className="landing-container">
            <div className="landing-hero__grid">
              
              <div className="landing-hero__copy">
                <div className="landing-eyebrow">
                  <span>
                    <Sparkles size={14} />
                  </span>
                  RSDev Game Engine
                </div>
                
                <h1>
                  <span className="hero-title-effect">Games are an expression</span>
                  <br />
                  of your <em>worldview</em>.
                </h1>
                
                <p className="landing-hero__lede">
                  The all-in-one platform for game developers. Integrate AI, launch instantly, and turn your unique vision into a reality.
                </p>
                
                <div className="landing-actions">
                  <button className="button button--primary button--large" onClick={openSignInModal}>
                    Start Building <ArrowRight aria-hidden="true" />
                  </button>
                </div>
                
                <div className="landing-hero__proof">
                  <span>
                    <Check size={12} strokeWidth={3} /> No credit card required
                  </span>
                  <span>
                    <Check size={12} strokeWidth={3} /> Publish instantly
                  </span>
                </div>
              </div>
              
              <HeroGameDeck />
            </div>
          </div>
        </section>

        `;
  
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
  console.log("Replaced successfully.");
} else {
  console.log("Could not find boundaries.");
}
