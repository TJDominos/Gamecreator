const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const targetLede = '<p className="landing-hero__lede">\n                  Launch faster, connect with players, and let real-time feedback shape your next hit\n                </p>';

const actionsCode = `
                <div className="landing-actions" style={{ marginTop: '34px' }}>
                  <button className="button button--primary button--large" style={{ backgroundColor: 'var(--landing-purple)', color: '#fff', padding: '0 24px', minHeight: '52px', borderRadius: '12px', fontSize: '15px', fontWeight: '700' }} onClick={openSignInModal}>
                    Start Building <ArrowRight aria-hidden="true" size={18} style={{ marginLeft: '8px' }} />
                  </button>
                </div>
`;

if (code.includes(targetLede) && !code.includes('Start Building')) {
  code = code.replace(targetLede, targetLede + actionsCode);
  fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
  console.log("Added buttons back.");
} else {
  console.log("Buttons already exist or lede not found.");
}
