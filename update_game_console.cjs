const fs = require('fs');

let consolePath = 'src/developer-portal/games/GameConsole.tsx';
let console = fs.readFileSync(consolePath, 'utf8');

// Replace the imports to include Edit2 and Check
console = console.replace('import { ArrowLeft, LayoutDashboard, Rocket, MessageSquare, Settings } from "lucide-react";', 'import { ArrowLeft, LayoutDashboard, Rocket, MessageSquare, Settings, Edit2, Check } from "lucide-react";');
// Just to be safe if MessageSquareStar was reverted or modified:
console = console.replace(/import \{ ArrowLeft, LayoutDashboard, Rocket, .*?, Settings \} from "lucide-react";/, 'import { ArrowLeft, LayoutDashboard, Rocket, MessageSquare, Settings, Edit2, Check } from "lucide-react";');

// Update component body for inline editing
const newComponentStart = `export function GameConsole(): React.ReactElement {
  const { gameId } = useParams();
  const location = useLocation();
  const initialName = location.state?.gameName || (gameId === "g_101" ? "Neon Dash" : gameId === "g_102" ? "Space Miner" : "New Game");
  
  const [gameName, setGameName] = React.useState(initialName);
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempName, setTempName] = React.useState(initialName);

  const handleSaveName = () => {
    if (tempName.trim()) {
      setGameName(tempName.trim());
    } else {
      setTempName(gameName);
    }
    setIsEditing(false);
  };`;

console = console.replace(/export function GameConsole\(\): React\.ReactElement \{\n\s*const \{ gameId \} = useParams\(\);\n\s*const location = useLocation\(\);\n\s*const gameName = .*?;/, newComponentStart);

// Update H1 title element
const oldH1 = `<h1 style={{ fontSize: '28px', margin: 0 }}>{gameName} <span style={{ fontSize: '16px', color: 'var(--portal-muted)', fontWeight: 400 }}>({gameId})</span></h1>`;
const newH1 = `
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="text" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)} 
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  style={{ fontSize: '28px', fontWeight: 700, padding: '4px 8px', border: '2px solid var(--portal-purple)', borderRadius: '8px', outline: 'none', background: '#fff', width: '250px' }} 
                />
                <button onClick={handleSaveName} style={{ background: 'var(--portal-purple)', color: '#fff', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <h1 style={{ fontSize: '28px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                {gameName} 
                <span style={{ fontSize: '16px', color: 'var(--portal-muted)', fontWeight: 400 }}>({gameId})</span>
                <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', border: 'none', color: 'var(--portal-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: '4px' }}>
                  <Edit2 size={16} />
                </button>
              </h1>
            )}
          </div>`;

console = console.replace(oldH1, newH1.trim());

fs.writeFileSync(consolePath, console, 'utf8');

