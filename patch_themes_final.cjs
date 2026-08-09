const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const separatorRegex = /function GameSeparator\([\s\S]*?\}\s*function getPortalPath/m;

const newSeparator = `function GameSeparator({ reverse = false, type = 'dark', variant = 'arcade' }: { reverse?: boolean, type?: 'dark' | 'light', variant?: 'arcade' | 'rpg' | 'platform' | 'puzzle' }) {
  // Fighting / Arcade (Street Fighter inspired)
  const arcades = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M3,12 h10 v2 h-10 z M2,14 h12 v2 h-12 z M7,4 h2 v8 h-2 z M6,2 h4 v2 h-4 z M11,10 h2 v2 h-2 z M13,8 h2 v2 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M1,4 h2 l2,5 l2,-5 h2 l-3,8 h-2 z M9,4 h5 v2 h-3 v2 h3 v4 h-5 v-2 h3 v-2 h-3 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M10,4 h2 v8 h-2 z M12,6 h2 v4 h-2 z M6,4 h4 v8 h-4 z M4,6 h2 v4 h-2 z M2,7 h2 v2 h-2 z M0,7 h1 v2 h-1 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M0,6 h16 v4 h-16 z M1,7 h14 v2 h-14 z" fill="currentColor" fillRule="evenodd"/><path d="M1,7 h6 v2 h-6 z" fill="currentColor"/></svg>
  ];
  
  // Creature / RPG (Pokémon inspired)
  const rpgs = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M5,1 h6 v2 h-6 z M3,3 h10 v2 h-10 z M1,5 h4 v2 h-4 z M11,5 h4 v2 h-4 z M1,9 h4 v2 h-4 z M11,9 h4 v2 h-4 z M3,11 h2 v2 h-2 z M11,11 h2 v2 h-2 z M5,13 h6 v2 h-6 z M5,5 h6 v1 h-6 z M5,10 h6 v1 h-6 z M5,6 h1 v4 h-1 z M10,6 h1 v4 h-1 z M7,7 h2 v2 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M8,1 h4 l-3,6 h4 l-8,8 v-5 h-3 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M3,1 h10 v14 h-10 z M4,2 h8 v6 h-8 z" fill="currentColor" fillRule="evenodd"/><path d="M4,10 h3 v3 h-3 z M5,9 h1 v5 h-1 z M10,11 h2 v2 h-2 z M11,9 h2 v2 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M7,1 h2 v2 h2 v2 h2 v4 h-2 v2 h-2 v2 h-2 v2 h-2 v-2 h-2 v-2 h-2 v-2 h-2 v-4 h2 v-2 h2 v-2 z M7,3 h2 v10 h-2 z M5,7 h6 v2 h-6 z" fill="currentColor" fillRule="evenodd"/></svg>
  ];
  
  // Jump & Run (Super Mario inspired)
  const platforms = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M2,2 h12 v12 h-12 z M6,4 h6 v4 h-2 v2 h-4 v-2 h2 v-2 h-2 z M7,11 h2 v2 h-2 z M3,3 h1 v1 h-1 z M12,3 h1 v1 h-1 z M3,12 h1 v1 h-1 z M12,12 h1 v1 h-1 z" fill="currentColor" fillRule="evenodd"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M5,2 h6 v2 h-6 z M3,4 h10 v2 h-10 z M1,6 h14 v4 h-14 z M3,10 h10 v2 h-10 z M5,12 h6 v4 h-6 z M4,6 h2 v2 h-2 z M10,6 h2 v2 h-2 z M7,4 h2 v2 h-2 z" fill="currentColor" fillRule="evenodd"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M2,4 h12 v4 h-12 z M4,8 h8 v8 h-8 z M3,5 h1 v2 h-1 z M5,9 h1 v7 h-1 z" fill="currentColor" fillRule="evenodd"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M5,1 h6 v2 h-6 z M3,3 h10 v10 h-10 z M5,13 h6 v2 h-6 z M6,4 h4 v8 h-4 z" fill="currentColor" fillRule="evenodd"/></svg>
  ];
  
  // Voxel / Sandbox (Minecraft inspired)
  const puzzles = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M2,12 h2 v2 h-2 z M4,10 h2 v2 h-2 z M6,8 h2 v2 h-2 z M8,6 h2 v2 h-2 z M10,4 h2 v2 h-2 z M8,2 h2 v2 h-2 z M10,0 h4 v2 h-4 z M14,2 h2 v4 h-2 z M12,4 h2 v2 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M2,12 h2 v2 h-2 z M4,10 h2 v2 h-2 z M6,8 h2 v2 h-2 z M8,6 h2 v2 h-2 z M10,4 h2 v2 h-2 z M12,2 h2 v2 h-2 z M14,0 h2 v2 h-2 z M10,6 h2 v2 h-2 z M6,10 h2 v2 h-2 z M4,14 h2 v2 h-2 z M0,10 h2 v2 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M2,2 h12 v12 h-12 z M3,4 h3 v3 h-3 z M10,4 h3 v3 h-3 z M6,8 h4 v2 h2 v4 h-2 v-2 h-4 v2 h-2 v-4 h2 z" fill="currentColor" fillRule="evenodd"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M2,3 h4 v2 h-4 z M10,3 h4 v2 h-4 z M1,5 h14 v4 h-14 z M3,9 h10 v2 h-10 z M5,11 h6 v2 h-6 z M7,13 h2 v2 h-2 z" fill="currentColor"/></svg>
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
