const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

// Replace the Ghost icon with an image
code = code.replace(/<div className="process-list__icon">\s*<Ghost aria-hidden="true" \/>\s*<\/div>/, `<div className="process-list__icon process-list__icon--image">
                  <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=150" alt="Private Preview" />
                </div>`);

// Replace Sword with image
code = code.replace(/<div className="process-list__icon">\s*<Sword aria-hidden="true" \/>\s*<\/div>/, `<div className="process-list__icon process-list__icon--image">
                  <img src="https://images.unsplash.com/photo-1560529870-1efaaf6c2214?auto=format&fit=crop&q=80&w=150" alt="Grey Release" />
                </div>`);

// Replace Crown with image
code = code.replace(/<div className="process-list__icon">\s*<Crown aria-hidden="true" \/>\s*<\/div>/, `<div className="process-list__icon process-list__icon--image">
                  <img src="https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=150" alt="Scale to a Hit" />
                </div>`);

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
