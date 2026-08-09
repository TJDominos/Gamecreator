const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const separatorRegex = /function GameSeparator\([\s\S]*?\}\s*function getPortalPath/m;

const newSeparator = `function GameSeparator({ reverse = false, type = 'dark', variant = 'arcade' }: { reverse?: boolean, type?: 'dark' | 'light', variant?: 'arcade' | 'rpg' | 'platform' | 'puzzle' }) {
  const arcades = [
    <svg viewBox="0 0 11 8" className="marquee-pixel-icon" key="1"><path d="M2,0 h1 v1 h-1 z M8,0 h1 v1 h-1 z M3,1 h1 v1 h-1 z M7,1 h1 v1 h-1 z M2,2 h7 v1 h-7 z M1,3 h2 v1 h-2 z M4,3 h3 v1 h-3 z M8,3 h2 v1 h-2 z M0,4 h11 v1 h-11 z M0,5 h1 v1 h-1 z M2,5 h7 v1 h-7 z M10,5 h1 v1 h-1 z M0,6 h1 v1 h-1 z M2,6 h1 v1 h-1 z M8,6 h1 v1 h-1 z M10,6 h1 v1 h-1 z M3,7 h2 v1 h-2 z M6,7 h2 v1 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 13 13" className="marquee-pixel-icon" key="2"><path d="M4,0 h5 v1 h-5 z M2,1 h9 v1 h-9 z M1,2 h11 v1 h-11 z M1,3 h11 v1 h-11 z M0,4 h13 v1 h-13 z M0,5 h13 v1 h-13 z M0,6 h6 v1 h-6 z M0,7 h4 v1 h-4 z M0,8 h6 v1 h-6 z M0,9 h13 v1 h-13 z M1,10 h11 v1 h-11 z M2,11 h9 v1 h-9 z M4,12 h5 v1 h-5 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M8,0 l1,5 h5 l-4,3 l1,5 l-4,-3 l-4,3 l1,-5 l-4,-3 h5 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 3 2" className="marquee-pixel-icon" key="4"><path d="M1,0 h1 v1 h-1 z M0,1 h3 v1 h-3 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 10 10" className="marquee-pixel-icon" key="5"><path d="M2,0 h6 v1 h-6 z M1,1 h8 v1 h-8 z M0,2 h10 v6 h-10 z M1,8 h8 v1 h-8 z M2,9 h6 v1 h-6 z M3,2 h4 v6 h-4 z" fill="currentColor" opacity="0.5"/><path d="M4,2 h2 v6 h-2 z" fill="currentColor"/></svg>
  ];
  
  const rpgs = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M14,0 h2 v2 l-9,9 l-2,-2 z M2,11 l-2,3 l2,2 l3,-2 l-1,-1 l2,-2 l-1,-1 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 11 9" className="marquee-pixel-icon" key="2"><path d="M1,0 h2 v1 h-2 z M8,0 h2 v1 h-2 z M0,1 h4 v1 h-4 z M7,1 h4 v1 h-4 z M0,2 h11 v1 h-11 z M0,3 h11 v1 h-11 z M1,4 h9 v1 h-9 z M2,5 h7 v1 h-7 z M3,6 h5 v1 h-5 z M4,7 h3 v1 h-3 z M5,8 h1 v1 h-1 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 10 12" className="marquee-pixel-icon" key="3"><path d="M3,0 h4 v1 h-4 z M4,1 h2 v2 h-2 z M3,3 h4 v1 h-4 z M2,4 h6 v1 h-6 z M1,5 h8 v1 h-8 z M0,6 h10 v5 h-10 z M1,11 h8 v1 h-8 z M2,6 h6 v4 h-6 z" fill="currentColor" fillRule="evenodd"/></svg>,
    <svg viewBox="0 0 10 11" className="marquee-pixel-icon" key="4"><path d="M1,0 h8 v1 h-8 z M0,1 h10 v6 h-10 z M1,7 h8 v1 h-8 z M2,8 h6 v1 h-6 z M3,9 h4 v1 h-4 z M4,10 h2 v1 h-2 z" fill="currentColor"/></svg>
  ];
  
  const platforms = [
    <svg viewBox="0 0 10 14" className="marquee-pixel-icon" key="1"><path d="M3,0 h4 v1 h-4 z M2,1 h6 v1 h-6 z M1,2 h8 v1 h-8 z M0,3 h10 v8 h-10 z M1,11 h8 v1 h-8 z M2,12 h6 v1 h-6 z M3,13 h4 v1 h-4 z M4,3 h2 v8 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M5,0 h6 v1 h-6 z M3,1 h10 v1 h-10 z M2,2 h12 v1 h-12 z M1,3 h14 v1 h-14 z M0,4 h16 v5 h-16 z M2,9 h12 v1 h-12 z M3,10 h10 v1 h-10 z M5,11 h6 v5 h-6 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 15 15" className="marquee-pixel-icon" key="3"><path d="M7,0 h1 v4 h4 v1 h-3 v2 h3 v1 h-4 v4 h-1 v-4 h-3 v-1 h3 v-2 h-4 v-1 h4 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M0,0 h16 v16 h-16 z M2,2 h12 v12 h-12 z" fill="currentColor" fillRule="evenodd"/></svg>
  ];
  
  const puzzles = [
    <svg viewBox="0 0 15 10" className="marquee-pixel-icon" key="1"><path d="M0,0 h15 v5 h-15 z M5,5 h5 v5 h-5 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 10 15" className="marquee-pixel-icon" key="2"><path d="M0,0 h5 v15 h-5 z M5,10 h5 v5 h-5 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 14 12" className="marquee-pixel-icon" key="3"><path d="M3,0 h8 v1 h-8 z M1,1 h12 v1 h-12 z M0,2 h14 v3 h-14 z M1,5 h12 v1 h-12 z M2,6 h10 v1 h-10 z M3,7 h8 v1 h-8 z M4,8 h6 v1 h-6 z M5,9 h4 v1 h-4 z M6,10 h2 v1 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 15 10" className="marquee-pixel-icon" key="4"><path d="M0,0 h10 v5 h-10 z M5,5 h10 v5 h-10 z" fill="currentColor"/></svg>
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
