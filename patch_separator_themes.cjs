const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const separatorRegex = /function GameSeparator\([\s\S]*?\}\s*function getPortalPath/m;

const newSeparator = `function GameSeparator({ reverse = false, type = 'dark', variant = 'arcade' }: { reverse?: boolean, type?: 'dark' | 'light', variant?: 'arcade' | 'rpg' | 'platform' | 'puzzle' }) {
  // Fighting / Arcade (Generic, Inspired by Street Fighter)
  const arcades = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M4,2 h8 v4 h-8 z M2,6 h12 v6 h-12 z M4,12 h8 v2 h-8 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M10,4 h4 v8 h-4 z M6,2 h4 v12 h-4 z M2,4 h4 v8 h-4 z M0,6 h2 v4 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M2,10 h12 v4 h-12 z M4,6 h2 v4 h-2 z M3,4 h4 v2 h-4 z M10,8 h2 v2 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M1,2 h3 v3 h-3 z M2,5 h3 v3 h-3 z M3,8 h3 v3 h-3 z M2,11 h3 v3 h-3 z M1,14 h3 v3 h-3 z M10,2 h4 v2 h-4 z M9,5 h4 v2 h-4 z M10,8 h4 v2 h-4 z M11,11 h4 v2 h-4 z M10,14 h4 v2 h-4 z" fill="currentColor"/></svg>
  ];
  
  // Creature / RPG (Generic, Inspired by Pokémon)
  const rpgs = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M5,1 h6 v2 h-6 z M3,3 h10 v2 h-10 z M1,5 h14 v2 h-14 z M1,9 h14 v2 h-14 z M3,11 h10 v2 h-10 z M5,13 h6 v2 h-6 z M0,7 h5 v2 h-5 z M11,7 h5 v2 h-5 z M6,6 h4 v4 h-4 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M7,1 h2 v2 h-2 z M6,3 h4 v2 h-4 z M5,5 h6 v2 h-6 z M4,7 h8 v2 h-8 z M3,9 h10 v4 h-10 z M5,13 h6 v2 h-6 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M7,1 h2 v2 h-2 z M6,3 h4 v2 h-4 z M5,5 h6 v2 h-6 z M4,7 h8 v4 h-8 z M5,11 h6 v2 h-6 z M6,13 h4 v2 h-4 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M7,1 h2 v2 h-2 z M6,3 h4 v2 h-4 z M4,5 h8 v2 h-8 z M2,7 h12 v2 h-12 z M4,9 h8 v2 h-8 z M6,11 h4 v2 h-4 z M7,13 h2 v2 h-2 z" fill="currentColor"/></svg>
  ];
  
  // Jump & Run (Generic, Inspired by Super Mario)
  const platforms = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M5,1 h6 v2 h-6 z M3,3 h10 v2 h-10 z M1,5 h14 v5 h-14 z M4,10 h8 v2 h-8 z M5,12 h6 v3 h-6 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M5,0 h6 v2 h-6 z M3,2 h10 v2 h-10 z M2,4 h12 v8 h-12 z M3,12 h10 v2 h-10 z M5,14 h6 v2 h-6 z M7,4 h2 v8 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M2,2 h12 v4 h-12 z M4,6 h8 v10 h-8 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M8,0 l2,5 h5 l-4,3 l1,5 l-4,-3 l-4,3 l1,-5 l-4,-3 h5 z" fill="currentColor"/></svg>
  ];
  
  // Voxel / Sandbox (Generic, Inspired by Minecraft)
  const puzzles = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M2,2 h12 v12 h-12 z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M2,6 h12 v2 h-12 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M12,0 h4 v4 h-2 v-2 h-2 z M10,2 h2 v2 h-2 z M8,4 h2 v2 h-2 z M6,6 h2 v2 h-2 z M4,8 h2 v2 h-2 z M2,10 h2 v2 h-2 z M0,12 h4 v4 h-2 v-2 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M4,1 h8 v3 h-8 z M1,4 h14 v4 h-14 z M3,8 h10 v4 h-10 z M6,12 h4 v3 h-4 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M2,3 h4 v3 h-4 z M10,3 h4 v3 h-4 z M1,6 h14 v3 h-14 z M3,9 h10 v3 h-10 z M6,12 h4 v3 h-4 z" fill="currentColor"/></svg>
  ];

  const iconSet = variant === 'arcade' ? arcades : variant === 'rpg' ? rpgs : variant === 'platform' ? platforms : puzzles;

  return (
    <div className={\`game-marquee-container game-marquee-container--\${type}\`} aria-hidden="true">
      <div className={\`game-marquee-track \${reverse ? 'reverse' : ''}\`}>
        {[...Array(20)].map((_, i) => (
           <React.Fragment key={i}>
             {iconSet}
           </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function getPortalPath`;

code = code.replace(separatorRegex, newSeparator);
fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
