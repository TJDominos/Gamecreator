const fs = require('fs');

// 1. Update PortalHeader.tsx
const headerPath = 'src/components/PortalHeader.tsx';
let headerContent = fs.readFileSync(headerPath, 'utf8');

headerContent = headerContent.replace(/<div[^>]*>\s*<small>Creator Portal<\/small>\s*<strong>\{pageName\}<\/strong>\s*<\/div>/, '');
fs.writeFileSync(headerPath, headerContent, 'utf8');

// 2. Update DeveloperPortal.tsx
const portalPath = 'src/developer-portal/DeveloperPortal.tsx';
let portalContent = fs.readFileSync(portalPath, 'utf8');

if (!portalContent.includes('sidebarPinned')) {
  portalContent = portalContent.replace('const [menuOpen, setMenuOpen] = useState(false);', 'const [menuOpen, setMenuOpen] = useState(false);\n  const [sidebarPinned, setSidebarPinned] = useState(true);');
  
  // Add class to sidebar based on sidebarPinned
  portalContent = portalContent.replace('<aside className={`portal-sidebar ${menuOpen ? "is-open" : ""}`}>', '<aside className={`portal-sidebar ${menuOpen ? "is-open" : ""} ${!sidebarPinned ? "is-unpinned" : ""}`}>');
  
  // Add class to main based on sidebarPinned
  portalContent = portalContent.replace('<div className="portal-main">', '<div className={`portal-main ${!sidebarPinned ? "is-unpinned" : ""}`}>');
  
  // Also pass toggle logic to PortalHeader onMenuClick
  portalContent = portalContent.replace('onMenuClick={() => setMenuOpen(true)}', 'onMenuClick={() => { if (window.innerWidth > 900) { setSidebarPinned(!sidebarPinned); } else { setMenuOpen(true); } }}');
  
  fs.writeFileSync(portalPath, portalContent, 'utf8');
}

// 3. Update CSS
const cssPath = 'src/developer-portal/DeveloperPortal.css';
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('.portal-sidebar.is-unpinned')) {
  css += `
.portal-sidebar.is-unpinned {
  transform: translateX(-100%);
}
.portal-main.is-unpinned {
  margin-left: 0;
}
@media (min-width: 901px) {
  .portal-main.is-unpinned .portal-menu-button {
    display: grid;
    width: 38px;
    height: 38px;
    place-items: center;
    background: transparent;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
    margin-right: 16px;
    color: var(--portal-ink);
  }
  .portal-main:not(.is-unpinned) .portal-menu-button {
    display: grid;
    width: 38px;
    height: 38px;
    place-items: center;
    background: transparent;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
    margin-right: 16px;
    color: var(--portal-ink);
  }
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
}
