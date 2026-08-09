const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

code = code.replace(/https:\/\/images.unsplash.com\/photo-1580234811497-9df7fd2f357e\?auto=format&fit=crop&q=80&w=200/, 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Princess&backgroundColor=ffdfba');
code = code.replace(/https:\/\/images.unsplash.com\/photo-1550745165-9bc0b252726f\?auto=format&fit=crop&q=80&w=200/, 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Knight&backgroundColor=baffc9');
code = code.replace(/https:\/\/images.unsplash.com\/photo-1581822261290-991b38693d1b\?auto=format&fit=crop&q=80&w=200/, 'https://api.dicebear.com/9.x/pixel-art/svg?seed=King&backgroundColor=bae1ff');

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
