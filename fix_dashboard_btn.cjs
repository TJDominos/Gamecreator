const fs = require('fs');
const path = 'src/developer-portal/DeveloperPortal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the Link with a button in Dashboard
const oldLink = `<Link className="primary-action" to="/dashboard/games">\n          <Plus /> Create game\n        </Link>`;
const newBtn = `
        <button className="primary-action" onClick={() => {
          const newId = "g_" + Math.floor(Math.random() * 1000);
          window.location.href = "/dashboard/games/" + newId + "/settings";
        }}>
          <Plus /> Create game
        </button>
`.trim();

// Note: Instead of window.location.href, better to use navigate, but getting navigate inside the component requires adding the hook.
// Let's check if useNavigate is already in Dashboard.
