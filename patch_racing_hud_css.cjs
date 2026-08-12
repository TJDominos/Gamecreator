const fs = require('fs');

let css = fs.readFileSync('src/developer-landing/DeveloperLanding.css', 'utf8');

css = css.replace(/\.tachometer-needle \{[\s\S]*?@keyframes revving \{[\s\S]*?\}/m, '/* Removed CSS animation in favor of JS */');

fs.writeFileSync('src/developer-landing/DeveloperLanding.css', css);
