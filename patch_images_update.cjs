const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

// Update images to better match reference
code = code.replace(/https:\/\/images.unsplash.com\/photo-1518709268805-4e9042af9f23\?auto=format&fit=crop&q=80&w=150/, 'https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?auto=format&fit=crop&q=80&w=200');
code = code.replace(/https:\/\/images.unsplash.com\/photo-1560529870-1efaaf6c2214\?auto=format&fit=crop&q=80&w=150/, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=200');
code = code.replace(/https:\/\/images.unsplash.com\/photo-1614728263952-84ea256f9679\?auto=format&fit=crop&q=80&w=150/, 'https://images.unsplash.com/photo-1581822261290-991b38693d1b?auto=format&fit=crop&q=80&w=200');

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
