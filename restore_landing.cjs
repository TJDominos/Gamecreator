const fs = require('fs');

let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

// The code before line 242 is intact.
// Let's cut at line 240.
const importIdx = code.indexOf('import { SiteHeader }');
const topCode = code.substring(0, importIdx + 'import { SiteHeader } from "../components/SiteHeader";\n'.length);

const hudComponent = `
function RacingHUD() {
  const [rpm, setRpm] = useState(0);
  
  useEffect(() => {
    let animationFrameId;
    let startTime = Date.now();
    const duration = 4000;
    
    const keyframes = [
      { time: 0, rpm: 0.1 },
      { time: 0.2, rpm: 0.75 },
      { time: 0.35, rpm: 0.3 },
      { time: 0.55, rpm: 0.95 },
      { time: 0.65, rpm: 0.8 },
      { time: 0.85, rpm: 0.1 },
      { time: 1.0, rpm: 0.1 }
    ];

    function animate() {
      const now = Date.now();
      let t = ((now - startTime) % duration) / duration;
      
      let currentRpm = 0.1;
      for (let i = 0; i < keyframes.length - 1; i++) {
        const k1 = keyframes[i];
        const k2 = keyframes[i + 1];
        if (t >= k1.time && t <= k2.time) {
          const progress = (t - k1.time) / (k2.time - k1.time);
          const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
          currentRpm = k1.rpm + (k2.rpm - k1.rpm) * ease;
          break;
        }
      }
      setRpm(currentRpm);
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const needleRotation = -120 + rpm * 240;
  const displaySpeed = Math.floor(180 + rpm * 80);
  const gear = rpm < 0.4 ? 4 : rpm < 0.8 ? 5 : 6;
  const displayRpm = (rpm * 10).toFixed(1);

  return (
    <div className="racing-hud">
      <div className="racing-hud__speedometer">
        <svg viewBox="0 0 200 200" className="racing-hud__gauge">
          <circle cx="100" cy="100" r="90" fill="rgba(0,0,0,0.6)" stroke="#333" strokeWidth="4"/>
          <path d="M 30 150 A 90 90 0 1 1 170 150" fill="none" stroke="#ff003c" strokeWidth="8" strokeLinecap="round" strokeDasharray="300" strokeDashoffset="100" />
          <text x="100" y="110" fill="#fff" fontSize="48" fontWeight="900" fontStyle="italic" textAnchor="middle">{displaySpeed}</text>
          <text x="100" y="135" fill="#a1a1aa" fontSize="14" fontWeight="bold" textAnchor="middle">KM/H</text>
          <text x="145" y="80" fill="#ff003c" fontSize="24" fontWeight="900" fontStyle="italic">{gear}</text>
        </svg>
      </div>
      <div className="racing-hud__tachometer">
        <svg viewBox="0 0 200 200" className="racing-hud__gauge">
          <circle cx="100" cy="100" r="90" fill="rgba(0,0,0,0.6)" stroke="#333" strokeWidth="4"/>
          <path d="M 40 160 A 85 85 0 1 1 160 160" fill="none" stroke="#fff" strokeWidth="10" strokeDasharray="2 12" />
          <path d="M 140 50 A 85 85 0 0 1 160 160" fill="none" stroke="#ff003c" strokeWidth="10" />
          <text x="100" y="110" fill="#fff" fontSize="48" fontWeight="900" fontStyle="italic" textAnchor="middle">{displayRpm}</text>
          <text x="100" y="135" fill="#a1a1aa" fontSize="14" fontWeight="bold" textAnchor="middle">x1000 RPM</text>
          <g style={{ transform: \`rotate(\${needleRotation}deg)\`, transformOrigin: '100px 100px' }}>
            <circle cx="100" cy="100" r="8" fill="#ff003c" />
            <polygon points="96,100 104,100 100,25" fill="#ff003c" />
          </g>
        </svg>
      </div>
    </div>
  );
}
`;

const developerLandingBody = `
export default function DeveloperLanding(): React.ReactElement {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isWalletConnectModalOpen, setIsWalletConnectModalOpen] = useState(false);

  const openSignInModal = () => {
    if (user) {
      navigate(getPortalPath(true));
    } else {
      setIsWalletConnectModalOpen(true);
    }
  };

  const handleWalletConnectClose = () => {
    setIsWalletConnectModalOpen(false);
  };

  return (
    <div className="landing-page">
      <SiteHeader />
      <main>
        {/* P1: Hero section */}
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

        <GameSeparator type="dark" reverse variant="arcade" />
        
        {/* P2: The AI-Powered Iteration Loop */}
        <section className="landing-section landing-section--racing" id="grow">
          <RacingHUD />
`;

const endOfFile = code.substring(code.indexOf('<div className="landing-container relative-z">'));

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', topCode + '\n' + hudComponent + '\n' + developerLandingBody + endOfFile);
