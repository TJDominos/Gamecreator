const fs = require('fs');
let code = fs.readFileSync('src/CreatorBounties.tsx', 'utf8');

// 1. Remove CATEGORIES
code = code.replace(/const CATEGORIES = \[\s*\{ name: 'Arcade',[\s\S]*?\];\n\n/, '');

// 2. Remove getOpenCount and allOpenCount
code = code.replace(/  const getOpenCount = \(catName: string\) => \{\n    return MOCK_BOUNTIES\.filter\(b => b\.category === catName && b\.state === 'OPEN'\)\.length;\n  \};\n\n  const allOpenCount = MOCK_BOUNTIES\.filter\(b => b\.state === 'OPEN'\)\.length;\n/, '');

// 3. Replace the sidebar block
const sidebarMatch = /            <div className="guide-nav-box">\n              <h3 style=\{\{ fontSize: '12px', textTransform: 'uppercase', color: 'var\(--portal-muted\)', marginBottom: '16px', letterSpacing: '0\.05em' \}\}>Game Categories<\/h3>\n              <ul style=\{\{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' \}\}>[\s\S]*?<\/ul>\n            <\/div>/;

if (sidebarMatch.test(code)) {
    code = code.replace(sidebarMatch, '            <div className="guide-nav-box border-none !p-0 !bg-transparent">\n              <CategorySidebar variant="sidebar-with-counts" activeCategory={activeCategory} onSelectCategory={setActiveCategory} />\n            </div>');
} else {
    console.error("Could not find sidebar block");
}

// 4. Import CategorySidebar
code = code.replace("import { SiteHeader } from './components/SiteHeader';", "import { SiteHeader } from './components/SiteHeader';\nimport { CategorySidebar } from './components/CategorySidebar';");

fs.writeFileSync('src/CreatorBounties.tsx', code);
