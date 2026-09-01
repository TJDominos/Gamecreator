import React, { useState } from "react";
import { Github, CheckCircle2, Lock, Trash2, Archive, AlertTriangle } from "lucide-react";
import { useOutletContext, useNavigate } from "react-router";
import { GameStatus } from "./GameConsole";

export function GameSettings(): React.ReactElement {
  const { status, setStatus } = useOutletContext<{ status: GameStatus, setStatus: (s: GameStatus) => void }>();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);

  const isPipelineLocked = ['PENDING_REVIEW', 'APPROVED', 'PUBLIC_ACTIVE', 'MAINTENANCE', 'ARCHIVED'].includes(status);
  const canHardDelete = ['DRAFT', 'DEVELOPMENT'].includes(status);
  const canArchive = ['PRIVATE_TESTING', 'REJECTED', 'APPROVED', 'MAINTENANCE'].includes(status);

  return (
    <div style={{ maxWidth: '700px' }}>
      
      <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>CI/CD & Repository</h2>

      <p style={{ color: 'var(--portal-muted)', fontSize: '14px', marginBottom: '24px' }}>
        Connect your GitHub repository to enable automatic Sandbox deployments and version management.
      </p>

      {isPipelineLocked && (
        <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
          <Lock size={16} /> Pipeline configuration is locked while game is in {status} status.
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '24px', opacity: isPipelineLocked ? 0.7 : 1, pointerEvents: isPipelineLocked ? 'none' : 'auto' }}>
        {!connected ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Github size={48} style={{ margin: '0 auto 16px', color: 'var(--portal-ink)' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Connect GitHub Repository</h3>
            <p style={{ color: 'var(--portal-muted)', fontSize: '13px', maxWidth: '400px', margin: '0 auto 24px' }}>
              We strongly recommend authorizing <strong>only select repositories</strong> specific to this game.
            </p>
            <button className="primary-action" onClick={() => setConnected(true)}>
              Authorize GitHub App
            </button>
          </div>
        ) : (
          <div className="onboarding-form">
            <div className="field--wide" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#167c73', background: '#e1f4f1', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <CheckCircle2 size={18} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Connected to RandSeedStudio/neon-dash-client</span>
            </div>

            <div className="field">
              <span>Sandbox Listening Branch</span>
              <input type="text" defaultValue="main" disabled={isPipelineLocked} />
              <small>This branch will automatically deploy to Sandbox on push.</small>
            </div>
            
            <div className="field">
              <span>Node.js Version</span>
              <select disabled={isPipelineLocked} style={{ width: '100%', padding: '11px 12px', background: isPipelineLocked ? '#f2f0f3' : '#fbfafc', border: '1px solid #dcd7e0', borderRadius: '9px', fontSize: '12px' }}>
                <option>20.x (Recommended)</option>
                <option>18.x</option>
              </select>
            </div>

            <div className="field">
              <span>Monorepo Root Directory</span>
              <input type="text" defaultValue="./" disabled={isPipelineLocked} />
              <small>If your game is in a subfolder (e.g. packages/client).</small>
            </div>

            <div className="field">
              <span>Build Command</span>
              <input type="text" defaultValue="npm run build" disabled={isPipelineLocked} />
            </div>

            <div className="field--wide">
              <span>Output Directory</span>
              <input type="text" defaultValue="dist" disabled={isPipelineLocked} />
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
