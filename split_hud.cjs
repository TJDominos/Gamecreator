const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

// Replace RacingHUD with two components
const hudRegex = /function RacingHUD\(\) \{[\s\S]*?\}\n\n/m;
const match = code.match(hudRegex);
if (match) {
  const hudCode = match[0];
  
  // Create TachometerWidget and SpeedometerWidget
  const tachometerCode = `
function TachometerWidget() {
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

  const displayRpm = (rpm * 9).toFixed(1);
  const needleRotation = -45 + (rpm * 270);

  return (
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
  );
}

function SpeedometerWidget() {
  const [rpm, setRpm] = useState(0); // reuse rpm for speed simulation
  
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

  const speed = Math.floor(rpm * 280);
  const displaySpeed = speed.toString().padStart(3, '0');
  const gear = rpm < 0.2 ? '1' : rpm < 0.4 ? '2' : rpm < 0.6 ? '3' : rpm < 0.8 ? '4' : '5';

  return (
    <div className="racing-hud__speedometer">
      <svg viewBox="0 0 200 200" className="racing-hud__gauge">
        <circle cx="100" cy="100" r="90" fill="rgba(0,0,0,0.6)" stroke="#333" strokeWidth="4"/>
        <path d="M 30 150 A 90 90 0 1 1 170 150" fill="none" stroke="#ff003c" strokeWidth="8" strokeLinecap="round" strokeDasharray="300" strokeDashoffset="100" />
        <text x="100" y="110" fill="#fff" fontSize="48" fontWeight="900" fontStyle="italic" textAnchor="middle">{displaySpeed}</text>
        <text x="100" y="135" fill="#a1a1aa" fontSize="14" fontWeight="bold" textAnchor="middle">KM/H</text>
        <text x="145" y="80" fill="#ff003c" fontSize="24" fontWeight="900" fontStyle="italic">{gear}</text>
      </svg>
    </div>
  );
}
`;
  
  code = code.replace(hudRegex, tachometerCode + '\n' + speedometerCode + '\n');
}

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
console.log('done');
