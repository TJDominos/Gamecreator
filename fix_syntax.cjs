const fs = require('fs');

// Fix GamesList.tsx
let gamesListPath = 'src/developer-portal/games/GamesList.tsx';
let gamesListContent = fs.readFileSync(gamesListPath, 'utf8');

gamesListContent = gamesListContent.replace(
  '</div>    </div>      <CreateGameModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />    </div>  );}', 
  '    </div>\n      <CreateGameModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />\n    </div>\n  );\n}'
);
// Actually, let's just use regex to clean up the end of the file.
gamesListContent = gamesListContent.replace(/<\/div>\s*<\/div>\s*<CreateGameModal isOpen=\{createOpen\} onClose=\{\(\) => setCreateOpen\(false\)\} \/>\s*<\/div>\s*\);\s*\}/,
  '      </div>\n      <CreateGameModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />\n    </div>\n  );\n}'
);

fs.writeFileSync(gamesListPath, gamesListContent, 'utf8');

// Also check DeveloperPortal.tsx Dashboard function
let portalPath = 'src/developer-portal/DeveloperPortal.tsx';
let portalContent = fs.readFileSync(portalPath, 'utf8');
portalContent = portalContent.replace(/<\/section>\s*<CreateGameModal isOpen=\{createModalOpen\} onClose=\{\(\) => setCreateModalOpen\(false\)\} \/>\s*<\/div>\s*\);\s*\}/, 
  '</section>\n      <CreateGameModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />\n    </div>\n  );\n}'
);
fs.writeFileSync(portalPath, portalContent, 'utf8');

