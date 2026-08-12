const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

// Replace AI Skills image
code = code.replace(/https:\/\/images\.unsplash\.com\/photo-1547038577-bc800d0810d3\?auto=format&fit=crop&q=80&w=600/, 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600');

// Replace Sandbox image (assemble gauge)
code = code.replace(/https:\/\/images\.unsplash\.com\/photo-1511919884226-fd3cad34687c\?auto=format&fit=crop&q=80&w=600/, 'https://images.unsplash.com/photo-1552084117-56a98ea889dc?auto=format&fit=crop&q=80&w=600'); // Dash/gauge

// Replace Live Game Data image (f1 ranks)
code = code.replace(/https:\/\/images\.unsplash\.com\/photo-1582269926867-b5049386c9d2\?auto=format&fit=crop&q=80&w=600/, 'https://images.unsplash.com/photo-1541348263662-e068362d8217?auto=format&fit=crop&q=80&w=600');

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
