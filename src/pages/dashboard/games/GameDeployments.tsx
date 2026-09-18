import React, { useEffect, useState } from "react";
import { GitCommit, ExternalLink, ShieldCheck, Globe, Clock, Github, Play, RefreshCw, AlertTriangle, CheckCircle2, Terminal } from "lucide-react";
import { useParams, Link } from "react-router";
import { getGameById, validateGameForPrivatePublish, updateGame, GAMES_UPDATED_EVENT } from "./gameData";
import { githubApi, type DeploymentRecord, type PrivateReleaseResponse } from "../../../services/githubApi";
import { GitHubSyncCard } from "./GitHubSyncCard";

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(timestamp);
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusStyle(status: string): React.CSSProperties {
  if (status === "published") return { background: "#e6f6ec", color: "#1e874b" };
  if (["failed", "cancelled", "superseded"].includes(status)) return { background: "#fef2f2", color: "#b91c1c" };
  if (["building", "uploading", "publishing", "queued"].includes(status)) return { background: "#fff1d9", color: "#8a5314" };
  return { background: "#eef2ff", color: "#4f46e5" };
}

export function GameDeployments(): React.ReactElement {
  const [privateLinkModal, setPrivateLinkModal] = useState<string | null>(null);
  const [privateExpiryDays, setPrivateExpiryDays] = useState<number | null>(7);
  const [privateRelease, setPrivateRelease] = useState<PrivateReleaseResponse | null>(null);
  const [privateReleaseError, setPrivateReleaseError] = useState<string | null>(null);
  const [isCreatingPrivateRelease, setIsCreatingPrivateRelease] = useState(false);
  const [isRevokingPrivateRelease, setIsRevokingPrivateRelease] = useState(false);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { gameId } = useParams();
  
  const [game, setGame] = useState(() => getGameById(gameId || 'g_101'));

  // Name resolution state if unique check fails
  const [editNameInput, setEditNameInput] = useState(game?.name || '');
  const [nameSaveMsg, setNameSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      const g = getGameById(gameId || 'g_101');
      if (g) {
        setGame(g);
        setEditNameInput(g.name);
      }
    };
    window.addEventListener(GAMES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(GAMES_UPDATED_EVENT, handleUpdate);
  }, [gameId]);

  const validation = game ? validateGameForPrivatePublish(game) : { valid: true, errors: [] };

  const closePrivateLinkModal = () => {
    setPrivateLinkModal(null);
    setPrivateExpiryDays(7);
    setPrivateRelease(null);
    setPrivateReleaseError(null);
    setIsCreatingPrivateRelease(false);
    setIsRevokingPrivateRelease(false);
    setNameSaveMsg(null);
  };

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId || !editNameInput.trim()) return;
    const res = updateGame(gameId, { name: editNameInput.trim() });
    if (res) {
      setGame(res);
      setNameSaveMsg("Game name updated. Re-checking uniqueness...");
      setTimeout(() => setNameSaveMsg(null), 3000);
    }
  };

  const createPrivateRelease = async () => {
    if (!gameId || !privateLinkModal) return;
    
    // Check game name uniqueness and validity before private publish
    const currentGame = getGameById(gameId);
    if (currentGame) {
      const check = validateGameForPrivatePublish(currentGame);
      if (!check.valid) {
        setPrivateReleaseError(`Cannot publish: ${check.errors.join(' ')}`);
        return;
      }
    }

    setIsCreatingPrivateRelease(true);
    setPrivateReleaseError(null);
    try {
      const response = await githubApi.createPrivateRelease(gameId, privateLinkModal, privateExpiryDays);
      setPrivateRelease(response);
    } catch (error) {
      setPrivateReleaseError(error instanceof Error ? error.message : "Unable to create private link");
    } finally {
      setIsCreatingPrivateRelease(false);
    }
  };

  const revokePrivateRelease = async () => {
    if (!gameId || !privateRelease?.release_id) return;
    setIsRevokingPrivateRelease(true);
    setPrivateReleaseError(null);
    try {
      await githubApi.revokePrivateRelease(gameId, privateRelease.release_id);
      setPrivateRelease({ ...privateRelease, revoked: true });
    } catch (error) {
      setPrivateReleaseError(error instanceof Error ? error.message : "Unable to revoke private link");
    } finally {
      setIsRevokingPrivateRelease(false);
    }
  };

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    let intervalId: number | undefined;

    const loadDeployments = async () => {
      try {
        const response = await githubApi.listDeployments(gameId);
        if (!cancelled) {
          setDeployments(response.deployments || []);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Unable to load deployments");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadDeployments();
    intervalId = window.setInterval(() => void loadDeployments(), 3000);
    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [gameId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* GitHub Repository Connection & CI/CD Card */}
      <GitHubSyncCard 
        gameId={gameId || 'g_101'} 
        gameName={game?.name || 'Neon Dash'}
      />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', margin: '0 0 8px' }}>Deployments & Versions</h2>
            <p style={{ color: 'var(--portal-muted)', fontSize: '14px', margin: 0 }}>Manage Sandbox builds, generate private test links, and submit for audit.</p>
          </div>
        </div>

        {isLoading && (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--portal-muted)' }}><RefreshCw size={18} className="spin" /> Loading deployments...</div>
        )}
        {loadError && !isLoading && (
          <div style={{ padding: '20px', border: '1px solid #fecaca', background: '#fff7f7', color: '#991b1b', borderRadius: '12px' }}>{loadError}</div>
        )}
        {!isLoading && !loadError && deployments.length === 0 && (
          <div style={{ padding: '36px', textAlign: 'center', border: '1px dashed var(--portal-border)', borderRadius: '12px', color: 'var(--portal-muted)' }}>No deployments yet.</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {deployments.map(dep => (
            <div key={dep.id} style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f2f0f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--portal-muted)' }}>
                    <GitCommit size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {dep.commit_message || "Deployment"}
                      <span className="status-pill" style={statusStyle(dep.status)}>{statusLabel(dep.status)}</span>
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--portal-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {formatDate(dep.created_at)}</span>
                      <span style={{ fontFamily: 'monospace' }}>{dep.commit_sha.slice(0, 12)}</span>
                      {dep.error_message && <span style={{ color: '#b91c1c' }}>{dep.error_message}</span>}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {dep.status === 'published' && (
                    <>
                      <button className="primary-action" style={{ background: 'transparent', color: 'var(--portal-purple)', border: '1px solid var(--portal-purple)' }} onClick={() => setPrivateLinkModal(dep.id)}>
                        <ExternalLink size={16} /> Private Link
                      </button>
                      <button className="primary-action">
                        <ShieldCheck size={16} /> Submit Audit
                      </button>
                    </>
                  )}
                  {['pending', 'queued', 'building', 'uploading', 'publishing'].includes(dep.status) && (
                    <button className="primary-action" disabled style={{ opacity: 0.5 }}>
                      <Clock size={16} /> Under Review
                    </button>
                  )}
                  {dep.status === 'failed' && (
                    <button className="primary-action" style={{ background: '#1e874b', color: '#fff' }}>
                      <RefreshCw size={16} /> Build Failed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Local SDK Initialization terminal hint */}
      <div style={{ background: 'var(--portal-ink)', color: '#fff', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={20} /> Initialize Context Locally
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)', maxWidth: '500px' }}>
            To start developing, initialize the Randseed SDK and machine-reference context in your project root.
          </p>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 20px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
          npx @randseed/agent-init
        </div>
      </div>

      {privateLinkModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', width: '520px', maxWidth: '92vw' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px' }}>Create Private Link (Private Publish)</h3>
            <p style={{ color: 'var(--portal-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Generate a secure link for closed testing without changing the public release pointer.
            </p>

            {/* Game Name Uniqueness Gate */}
            {!validation.valid ? (
              <div style={{ marginBottom: '20px', padding: '16px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                  <AlertTriangle size={18} color="#d97706" />
                  <span>Name Verification Required for Private Publish</span>
                </div>
                <div style={{ fontSize: '13px', color: '#78350f', marginBottom: '12px', lineHeight: 1.5 }}>
                  {validation.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
                
                {/* Inline Name Rename Field */}
                <form onSubmit={handleUpdateName} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input 
                    type="text" 
                    value={editNameInput} 
                    onChange={(e) => setEditNameInput(e.target.value)} 
                    placeholder="Enter unique game name..." 
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #dcd7e0', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <button type="submit" style={{ padding: '8px 14px', background: 'var(--portal-purple)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                    Save Name
                  </button>
                </form>
                {nameSaveMsg && (
                  <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> {nameSaveMsg}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '13px' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>Game name <strong>"{game?.name}"</strong> is verified and unique on Randseed.</span>
              </div>
            )}

            {privateReleaseError && <div style={{ marginBottom: '16px', padding: '10px 12px', border: '1px solid #fecaca', background: '#fff7f7', color: '#991b1b', borderRadius: '8px', fontSize: '13px' }}>{privateReleaseError}</div>}
            
            {privateRelease?.url && !privateRelease.revoked && (
              <div style={{ marginBottom: '20px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input value={privateRelease.url} readOnly style={{ flex: 1, minWidth: 0, padding: '9px 10px', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px' }} />
                  <button className="primary-action" onClick={() => void navigator.clipboard?.writeText(privateRelease.url || "")}>Copy</button>
                </div>
                <button style={{ marginTop: '10px', padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: '12px' }} disabled={isRevokingPrivateRelease} onClick={() => void revokePrivateRelease()}>
                  {isRevokingPrivateRelease ? 'Revoking...' : 'Revoke link'}
                </button>
              </div>
            )}
            {privateRelease?.revoked && <div style={{ marginBottom: '20px', color: '#b91c1c', fontSize: '13px' }}>This private link has been revoked.</div>}
            
            <div className="onboarding-form">
              <div className="field">
                <span>Link Validity</span>
                <select value={privateExpiryDays === null ? 'permanent' : String(privateExpiryDays)} onChange={(event) => setPrivateExpiryDays(event.target.value === 'permanent' ? null : Number(event.target.value))} disabled={Boolean(privateRelease?.url)} style={{ width: '100%', padding: '11px 12px', background: '#fbfafc', border: '1px solid #dcd7e0', borderRadius: '9px', fontSize: '12px' }}>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button style={{ padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--portal-muted)' }} onClick={closePrivateLinkModal}>Close</button>
              <button 
                className="primary-action" 
                disabled={isCreatingPrivateRelease || Boolean(privateRelease?.url) || !validation.valid} 
                onClick={() => void createPrivateRelease()}
                title={!validation.valid ? "Resolve game name uniqueness and profile requirements first" : ""}
              >
                {isCreatingPrivateRelease ? 'Generating...' : 'Generate Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
