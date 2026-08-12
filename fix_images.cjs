const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const img1 = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'; // Steering wheel
const img2 = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=600'; // Car dashboard/gauge
const img3 = 'https://images.unsplash.com/photo-1532981019623-f3277685a498?auto=format&fit=crop&q=80&w=600'; // Racing/f1 timing

code = code.replace(/https:\/\/images\.unsplash\.com\/photo-1580273916550-e323be2ae537\?auto=format&fit=crop&q=80&w=600/, img1);
code = code.replace(/https:\/\/images\.unsplash\.com\/photo-1552084117-56a98ea889dc\?auto=format&fit=crop&q=80&w=600/, img2);
code = code.replace(/https:\/\/images\.unsplash\.com\/photo-1541348263662-e068362d8217\?auto=format&fit=crop&q=80&w=600/, img3);

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
