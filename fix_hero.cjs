const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const regex = /\{\/\* P1: Hero section \*\/\}[\s\S]*?<section className="capability-strip"/;

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
                  <span className="hero-title-effect">Build and scale</span>
                  <br />
                  your next <em>hit game</em>.
                </h1>
                
                <p className="landing-hero__lede">
                  The all-in-one platform for game developers. Integrate AI, launch instantly, and monetize your creations.
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

        <section className="capability-strip"`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
