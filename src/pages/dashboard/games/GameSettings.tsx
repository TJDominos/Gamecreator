import React, { useState } from "react";
import { Github, CheckCircle2, Lock, Trash2, Archive, AlertTriangle, Sliders } from "lucide-react";
import { useOutletContext, useNavigate, useParams } from "react-router";
import { GameStatus } from "./GameConsole";
import { getGameById } from "./gameData";
import { GitHubSyncCard } from "./GitHubSyncCard";

export function GameSettings(): React.ReactElement {
  const { status, setStatus } = useOutletContext<{ status: GameStatus, setStatus: (s: GameStatus) => void }>();
  const { gameId } = useParams();
  const navigate = useNavigate();
  const game = getGameById(gameId || 'g_101');
  const [showAdvancedBuild, setShowAdvancedBuild] = useState(false);

  const isPipelineLocked = ['PENDING_REVIEW', 'APPROVED', 'PUBLIC_ACTIVE', 'MAINTENANCE', 'ARCHIVED'].includes(status);
  const canHardDelete = ['DRAFT', 'DEVELOPMENT'].includes(status);
  const canArchive = ['PRIVATE_TESTING', 'REJECTED', 'APPROVED', 'MAINTENANCE'].includes(status);

  return (
    <div style={{ maxWidth: '720px' }}>
      
      <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>CI/CD & Repository</h2>

      <p style={{ color: 'var(--portal-muted)', fontSize: '14px', marginBottom: '24px' }}>
        Connect and manage the Git repository linked with this game for automatic Sandbox deployments and version control.
      </p>

      {isPipelineLocked && (
        <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
          <Lock size={16} /> Pipeline configuration is locked while game is in {status} status.
        </div>
      )}

      {/* Primary GitHub Sync & CI/CD Card matching design reference */}
      <GitHubSyncCard 
        gameId={gameId || 'g_101'} 
        gameName={game?.name || 'Neon Dash'}
        initialRepoInfo={game?.repoInfo}
        isLocked={isPipelineLocked}
      />

      {/* Advanced Build & Monorepo Configuration */}
      <div style={{ marginTop: '24px', background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '16px', padding: '24px' }}>
        <div 
          onClick={() => setShowAdvancedBuild(!showAdvancedBuild)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={18} color="var(--portal-purple)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Advanced Build Settings</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--portal-muted)' }}>Node runtime, monorepo subfolder, and artifact outputs.</p>
            </div>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--portal-purple)', fontWeight: 600 }}>
            {showAdvancedBuild ? 'Hide' : 'Configure'} &rarr;
          </span>
        </div>

        {showAdvancedBuild && (
          <div className="onboarding-form" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0edf4' }}>
            <div className="field">
              <span>Sandbox Listening Branch</span>
              <input type="text" defaultValue={game?.repoInfo?.branch || "main"} disabled={isPipelineLocked} />
              <small>This branch triggers automatic deployment to the Sandbox on push.</small>
            </div>
            
            <div className="field">
              <span>Node.js Version</span>
              <select disabled={isPipelineLocked} style={{ width: '100%', padding: '11px 12px', background: isPipelineLocked ? '#f2f0f3' : '#fbfafc', border: '1px solid #dcd7e0', borderRadius: '9px', fontSize: '12px' }}>
                <option>20.x (LTS - Recommended)</option>
                <option>22.x (Current)</option>
                <option>18.x</option>
              </select>
            </div>

            <div className="field">
              <span>Monorepo Root Directory</span>
              <input type="text" defaultValue="./" disabled={isPipelineLocked} />
              <small>If your game is inside a package subdirectory (e.g. packages/client).</small>
            </div>

            <div className="field">
              <span>Build Command</span>
              <input type="text" defaultValue="npm run build" disabled={isPipelineLocked} />
            </div>

            <div className="field--wide">
              <span>Output Directory</span>
              <input type="text" defaultValue="dist" disabled={isPipelineLocked} />
              <small>Directory uploaded to the Sandbox runner (e.g. dist, build, out).</small>
            </div>

            <div className="onboarding-actions" style={{ marginTop: '24px' }}>
              <button className="primary-action" disabled={isPipelineLocked}>Save Configuration</button>
            </div>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: '20px', marginBottom: '8px', marginTop: '48px', color: '#e53e3e' }}>Danger Zone</h2>
      <p style={{ color: 'var(--portal-muted)', fontSize: '14px', marginBottom: '24px' }}>
        Destructive actions and visibility controls, governed by the game's current status.
      </p>

      <div style={{ background: '#fff', border: '1px solid #fed7d7', borderRadius: '12px', overflow: 'hidden' }}>
        {canHardDelete ? (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e53e3e' }}>
                <Trash2 size={16} /> Hard Delete Game
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--portal-muted)' }}>Permanently remove this game. Available because status is {status}.</p>
            </div>
            <button onClick={() => {
              alert("Game deleted.");
              navigate("/dashboard/games");
            }} style={{ padding: '8px 16px', background: '#e53e3e', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Hard Delete</button>
          </div>
        ) : (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: canArchive ? '#e53e3e' : 'var(--portal-muted)' }}>
                <Archive size={16} /> Archive / Delist Game
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--portal-muted)', maxWidth: '400px' }}>
                {status === 'PENDING_REVIEW' ? 'Action locked. You must withdraw from review before archiving.' :
                 status === 'PUBLIC_ACTIVE' ? 'Action locked. Game must enter Maintenance mode before it can be archived.' :
                 status === 'ARCHIVED' ? 'Game is already archived and read-only.' :
                 'Remove this game from the public catalog. Existing sandbox links are invalidated.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {status === 'PENDING_REVIEW' && (
                 <button onClick={() => setStatus('DEVELOPMENT')} style={{ padding: '8px 16px', background: '#f59e0b', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Withdraw Review</button>
              )}
              {status === 'PUBLIC_ACTIVE' && (
                 <button onClick={() => setStatus('MAINTENANCE')} style={{ padding: '8px 16px', background: '#f59e0b', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Enter Maintenance</button>
              )}
              <button 
                onClick={() => setStatus('ARCHIVED')}
                disabled={!canArchive} 
                style={{ 
                  padding: '8px 16px', 
                  background: canArchive ? 'transparent' : '#f2f0f3', 
                  border: canArchive ? '1px solid #e53e3e' : '1px solid transparent', 
                  color: canArchive ? '#e53e3e' : 'var(--portal-muted)', 
                  borderRadius: '8px', 
                  fontWeight: 600, 
                  cursor: canArchive ? 'pointer' : 'not-allowed' 
                }}>Archive Game</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

