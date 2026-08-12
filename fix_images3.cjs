const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

// The original image for AI Skills was 200. I'll revert it back to that one, or use a known good steering wheel image. 
// Known good images from unsplash (with source.unsplash.com redirects or specific URLs)
// Let's use a reliable placeholder service if unsplash fails.
const img1 = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'; 
const img2 = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=600'; 

// Let's see if we can use a steering wheel image from wikimedia or just rely on unsplash.
// Actually, `1549399542-7e3f8b79c341` might return 200 on images.unsplash.com (since 403 was on unsplash.com/photos/...)
