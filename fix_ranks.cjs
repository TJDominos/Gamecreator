const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const regex = /<div className="feature-grid">\s*\{aiIterationFeatures\.map\(\(\{ image, title, text \}, index\) => \([\s\S]*?\}\)\}\s*<\/div>/;

const newHTML = `
            <div className="feature-grid">
              {aiIterationFeatures.map(({ image, title, text }, index) => {
                if (title === "Live Game Data") {
                  return (
                    <article className="feature-card feature-card--with-image" key={title}>
                      <span className="feature-card__number">0{index + 1}</span>
                      <div className="feature-card__image-container f1-timing-board" style={{ backgroundColor: '#111', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#fff', fontFamily: 'monospace', fontSize: '14px', borderBottom: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', borderBottom: '1px solid #333', paddingBottom: '4px', textTransform: 'uppercase', fontSize: '12px' }}>
                          <span style={{ width: '30px' }}>POS</span>
                          <span style={{ flex: 1 }}>DRIVER</span>
                          <span style={{ width: '60px', textAlign: 'right' }}>GAP</span>
                          <span style={{ width: '80px', textAlign: 'right' }}>LAP</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ width: '30px', fontWeight: 'bold' }}>1</span>
                          <span style={{ flex: 1, color: '#facc15' }}>VER</span>
                          <span style={{ width: '60px', textAlign: 'right' }}>-</span>
                          <span style={{ width: '80px', textAlign: 'right', color: '#c084fc' }}>1:14.204</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ width: '30px', fontWeight: 'bold' }}>2</span>
                          <span style={{ flex: 1, color: '#facc15' }}>NOR</span>
                          <span style={{ width: '60px', textAlign: 'right' }}>+0.231</span>
                          <span style={{ width: '80px', textAlign: 'right' }}>1:14.435</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ width: '30px', fontWeight: 'bold' }}>3</span>
                          <span style={{ flex: 1 }}>LEC</span>
                          <span style={{ width: '60px', textAlign: 'right' }}>+0.589</span>
                          <span style={{ width: '80px', textAlign: 'right' }}>1:14.793</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ width: '30px', fontWeight: 'bold' }}>4</span>
                          <span style={{ flex: 1 }}>HAM</span>
                          <span style={{ width: '60px', textAlign: 'right' }}>+0.812</span>
                          <span style={{ width: '80px', textAlign: 'right' }}>1:15.016</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ width: '30px', fontWeight: 'bold' }}>5</span>
                          <span style={{ flex: 1 }}>SAI</span>
                          <span style={{ width: '60px', textAlign: 'right' }}>+1.104</span>
                          <span style={{ width: '80px', textAlign: 'right' }}>1:15.308</span>
                        </div>
                      </div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </article>
                  );
                }

                return (
                  <article className="feature-card feature-card--with-image" key={title}>
                    <span className="feature-card__number">0{index + 1}</span>
                    <div className="feature-card__image-container">
                      <img src={image} alt={title} className="feature-card__image" />
                    </div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                );
              })}
            </div>`;

code = code.replace(regex, newHTML);

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
