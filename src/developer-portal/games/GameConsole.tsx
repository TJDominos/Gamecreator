import React from "react";
import { NavLink, Outlet, useParams, useLocation } from "react-router";
import { ArrowLeft, LayoutDashboard, Rocket, MessageSquare, Settings, Edit2, Check, Lock } from "lucide-react";
import { Link } from "react-router";

export type GameStatus = 'DRAFT' | 'DEVELOPMENT' | 'PRIVATE_TESTING' | 'PENDING_REVIEW' | 'REJECTED' | 'APPROVED' | 'PUBLIC_ACTIVE' | 'MAINTENANCE' | 'ARCHIVED';

export const StatusLabels: Record<GameStatus, string> = {
  DRAFT: 'Draft',
  DEVELOPMENT: 'Development',
  PRIVATE_TESTING: 'Private Testing',
  PENDING_REVIEW: 'Pending Review',
  REJECTED: 'Rejected',
  APPROVED: 'Approved',
  PUBLIC_ACTIVE: 'Public Active',
  MAINTENANCE: 'Maintenance',
  ARCHIVED: 'Archived'
};

export function GameConsole(): React.ReactElement {
  const { gameId } = useParams();
  const location = useLocation();
  const initialName = location.state?.gameName || (gameId === "g_101" ? "Neon Dash" : gameId === "g_102" ? "Space Miner" : "New Game");
  
  const [gameName, setGameName] = React.useState(initialName);
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempName, setTempName] = React.useState(initialName);
  const [status, setStatus] = React.useState<GameStatus>('DEVELOPMENT');

  const isMetaLocked = ['PENDING_REVIEW', 'APPROVED', 'PUBLIC_ACTIVE', 'MAINTENANCE', 'ARCHIVED'].includes(status);

  const handleSaveName = () => {
    if (tempName.trim()) {
      setGameName(tempName.trim());
    } else {
      setTempName(gameName);
    }
    setIsEditing(false);
  };

  return (
    <div className="game-console">
      <div style={{ marginBottom: '24px' }}>
        <Link to="/dashboard/games" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--portal-muted)', textDecoration: 'none', marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Games
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                {isMetaLocked ? (
                  <div title="Name editing is locked in current status" style={{ color: '#e53e3e', display: 'grid', placeItems: 'center', padding: '4px' }}>
                    <Lock size={16} />
                  </div>
                ) : (
                  <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', border: 'none', color: 'var(--portal-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: '4px' }}>
                    <Edit2 size={16} />
                  </button>
                )}
              </h1>
            )}
            <span className="status-pill" style={{ background: '#f2f0f3', color: 'var(--portal-ink)', border: '1px solid #e5e2e8', fontWeight: 600 }}>
              {StatusLabels[status]}
            </span>
          </div>
          <a href={`https://randseed.org/sandbox/${gameId}`} target="_blank" rel="noreferrer" className="primary-action" style={{ textDecoration: 'none' }}>
            Open Sandbox
          </a>
        </div>
      </div>

      <nav className="game-console-tabs" style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--portal-border)', marginBottom: '32px' }}>
        {[
          { to: `/dashboard/games/${gameId}`, end: true, label: "Overview", icon: LayoutDashboard },
          { to: `/dashboard/games/${gameId}/deployments`, label: "Deployments", icon: Rocket },
          
          { to: `/dashboard/games/${gameId}/settings`, label: "Settings", icon: Settings }
        ].map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 4px',
              fontSize: '14px',
              fontWeight: 500,
              color: isActive ? 'var(--portal-purple)' : 'var(--portal-muted)',
              borderBottom: isActive ? '2px solid var(--portal-purple)' : '2px solid transparent',
              textDecoration: 'none',
              marginBottom: '-1px'
            })}
          >
            <tab.icon size={16} /> {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ status, setStatus }} />
    </div>
  );
}
