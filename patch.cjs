const fs = require('fs');
let code = fs.readFileSync('src/CreatorBounties.tsx', 'utf8');

const sidebarMatch = /<div className="guide-nav__section">\s*<h3>Game Categories<\/h3>\s*<ul style=\{\{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' \}\}>[\s\S]*?<\/ul>\s*<\/div>/;

if (sidebarMatch.test(code)) {
    code = code.replace(sidebarMatch, '<div className="guide-nav__section border-none !p-0 !bg-transparent">\n              <CategorySidebar variant="sidebar-with-counts" activeCategory={activeCategory} onSelectCategory={setActiveCategory} />\n            </div>');
} else {
    console.error("Could not find sidebar block");
}

fs.writeFileSync('src/CreatorBounties.tsx', code);
