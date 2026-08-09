const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

// Remove eyebrow
code = code.replace(/<p className="landing-eyebrow">The AI-Powered Iteration Loop<\/p>\s*/g, '');

// Update images
const featuresRegex = /const aiIterationFeatures = \[[\s\S]*?\];/;
const newFeatures = `const aiIterationFeatures = [
  {
    image: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&q=80&w=600",
    title: "AI Skills",
    text: "Integrate specialized AI capabilities directly into your workflow to automate complex development tasks.",
  },
  {
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600",
    title: "Sandbox Environment",
    text: "Safely test and iterate on your game mechanics in a fully isolated, production-mirrored sandbox.",
  },
  {
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600",
    title: "Live Game Data",
    text: "Harness real-time analytics and player metrics to continuously refine and optimize your game.",
  },
];`;

code = code.replace(featuresRegex, newFeatures);

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
