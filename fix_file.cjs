const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

// I need to replace the RacingHUD function and the `<RacingHUD />` usage correctly.
// Let's remove the broken RacingHUD function first.
const startIdx = code.indexOf('function RacingHUD() {');
const endIdx = code.indexOf('export default function DeveloperLanding()');
if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + code.substring(endIdx);
}

// Now replace the broken return <RacingHUD /> ... back to <RacingHUD /> where it belongs.
const brokenRegex = /<RacingHUD \/>[\s\S]*?<div className="landing-container relative-z">/;
code = code.replace(brokenRegex, '<div className="racing-hud"></div>\n          <div className="landing-container relative-z">');

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
