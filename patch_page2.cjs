const fs = require('fs');
let code = fs.readFileSync('src/developer-landing/DeveloperLanding.tsx', 'utf8');

const featuresRegex = /const aiIterationFeatures = \[[\s\S]*?\];/;
const newFeatures = `const aiIterationFeatures = [
  {
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600",
    title: "AI Skills",
    text: "Integrate specialized AI capabilities directly into your workflow to automate complex development tasks.",
  },
  {
    image: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=600",
    title: "Sandbox Environment",
    text: "Safely test and iterate on your game mechanics in a fully isolated, production-mirrored sandbox.",
  },
  {
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600",
    title: "Live Game Data",
    text: "Harness real-time analytics and player metrics to continuously refine and optimize your game.",
  },
];`;

code = code.replace(featuresRegex, newFeatures);

const sectionHeaderRegex = /<p className="landing-eyebrow">The AI-Powered Iteration Loop<\/p>\s*<h2>Build, test, and refine at the speed of thought<\/h2>\s*<p>\s*Leverage our AI tools to rapidly prototype, iterate on game\s*mechanics, and process real-time player data, ensuring your\s*game evolves faster than ever before.\s*<\/p>/m;

const newSectionHeader = `<p className="landing-eyebrow">The AI-Powered Iteration Loop</p>
              <h2>End-to-End AI Integration</h2>
              <p>
                Structured APIs and rules that empower any AI toolchain to manage everything from initial code integration and testing to deployment and live data management.
              </p>`;

code = code.replace(sectionHeaderRegex, newSectionHeader);

const renderRegex = /\{aiIterationFeatures\.map\(\(\{\s*icon:\s*Icon,\s*title,\s*text\s*\}\s*,\s*index\)\s*=>\s*\([\s\S]*?<\/article>\s*\)\)\}/m;

const newRender = `{aiIterationFeatures.map(({ image, title, text }, index) => (
                <article className="feature-card feature-card--with-image" key={title}>
                  <span className="feature-card__number">0{index + 1}</span>
                  <div className="feature-card__image-container">
                    <img src={image} alt={title} className="feature-card__image" />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}`;

code = code.replace(renderRegex, newRender);

fs.writeFileSync('src/developer-landing/DeveloperLanding.tsx', code);
