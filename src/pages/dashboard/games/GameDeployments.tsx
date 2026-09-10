import React, { useEffect, useState } from "react";
import { GitCommit, ExternalLink, ShieldCheck, Globe, Clock, Github, Play, RefreshCw } from "lucide-react";
import { useParams, Link } from "react-router";
import { getGameById } from "./gameData";
import { githubApi, type DeploymentRecord, type PrivateReleaseResponse } from "../../../services/githubApi";

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
  const game = getGameById(gameId || 'g_101');
  const repoInfo = game?.repoInfo;

  const closePrivateLinkModal = () => {
    setPrivateLinkModal(null);
    setPrivateExpiryDays(7);
    setPrivateRelease(null);
    setPrivateReleaseError(null);
    setIsCreatingPrivateRelease(false);
    setIsRevokingPrivateRelease(false);
  };

  const createPrivateRelease = async () => {
    if (!gameId || !privateLinkModal) return;
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
    <div>
      {/* Connected GitHub & Sandbox Quick Bar */}
      {repoInfo && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Github size={18} color="#111827" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{repoInfo.repository}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 8px', background: '#f3f4f6', borderRadius: '10px', fontSize: '12px', color: '#4b5563' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
              {repoInfo.branch}
            </span>
            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 500, background: '#ecfdf5', padding: '2px 8px', borderRadius: '10px' }}>
              Automatic GitHub Actions sync active
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to={`/dashboard/games/${gameId}/settings`} style={{ fontSize: '13px', color: 'var(--portal-purple)', textDecoration: 'none', fontWeight: 500 }}>
              Sync Settings &rarr;
            </Link>
            <a href={repoInfo.sandboxUrl || `https://randseed.org/${gameId}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#111827', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
              <Play size={12} fill="#fff" /> Sandbox Link
            </a>
          </div>
        </div>
      )}

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

      {privateLinkModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '20px' }}>Create Private Link</h3>
            <p style={{ color: 'var(--portal-muted)', fontSize: '13px', marginBottom: '24px' }}>
              Generate a secure link for closed testing without changing the public release pointer.
            </p>
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
              <button className="primary-action" disabled={isCreatingPrivateRelease || Boolean(privateRelease?.url)} onClick={() => void createPrivateRelease()}>
                {isCreatingPrivateRelease ? 'Generating...' : 'Generate Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
