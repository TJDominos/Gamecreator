const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

code = code.replace(/https:\/\/images.unsplash.com\/photo-1605379399642-870262d3d051\?auto=format&fit=crop&q=80&w=600/, 'https://images.unsplash.com/photo-1547038577-bc800d0810d3?auto=format&fit=crop&q=80&w=600');
code = code.replace(/https:\/\/images.unsplash.com\/photo-1511512578047-dfb367046420\?auto=format&fit=crop&q=80&w=600/, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600');
code = code.replace(/https:\/\/images.unsplash.com\/photo-1542751371-adc38448a05e\?auto=format&fit=crop&q=80&w=600/, 'https://images.unsplash.com/photo-1582269926867-b5049386c9d2?auto=format&fit=crop&q=80&w=600');

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
