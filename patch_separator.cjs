const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

// Update GameSeparator props
code = code.replace(/variant\?: 'arcade' \| 'rpg' \| 'platform' \| 'puzzle'/g, "variant?: 'arcade' | 'rpg' | 'platform' | 'puzzle' | 'racing'");

// Update GameSeparator logic
const logicRegex = /const iconSet = variant === 'arcade'.*?;\s*return \(/;
const newLogic = `
  const racings = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon marquee-pixel-icon--racing" key="1" style={{width: '32px', height: '32px'}}><rect width="8" height="8" fill="#fff"/><rect x="8" width="8" height="8" fill="#111"/><rect y="8" width="8" height="8" fill="#111"/><rect x="8" y="8" width="8" height="8" fill="#fff"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon marquee-pixel-icon--racing" key="2" style={{width: '32px', height: '32px'}}><rect width="8" height="8" fill="#fff"/><rect x="8" width="8" height="8" fill="#111"/><rect y="8" width="8" height="8" fill="#111"/><rect x="8" y="8" width="8" height="8" fill="#fff"/></svg>
  ];
  const iconSet = variant === 'arcade' ? arcades : variant === 'rpg' ? rpgs : variant === 'platform' ? platforms : variant === 'racing' ? racings : puzzles;
  
  return (`;

code = code.replace(logicRegex, newLogic);

// Change the first GameSeparator right above <section id="grow">
code = code.replace(/<GameSeparator type="dark" reverse variant="arcade" \/>/, '<GameSeparator type="racing" reverse variant="racing" />');

// Change the second GameSeparator right below <section id="grow">
code = code.replace(/<GameSeparator type="dark" variant="platform" \/>/, '<GameSeparator type="racing" variant="racing" />');


fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
