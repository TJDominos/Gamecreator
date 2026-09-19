import React, { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useParams, useLocation, Link } from "react-router";
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Rocket, 
  Settings, 
  Edit2, 
  Check, 
  Lock, 
  Github, 
  CheckCircle2, 
  ExternalLink, 
  ChevronDown, 
  Link2Off, 
  ArrowUpRight, 
  Copy 
} from "lucide-react";
import { getGameById, updateGame, GAMES_UPDATED_EVENT, type GameRepoInfo } from "./gameData";
import { githubApi } from "../../../services/githubApi";

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
  const [game, setGame] = useState(() => getGameById(gameId || ''));
  const emptyRepoInfo: GameRepoInfo = {
    repository: "",
    branch: "main",
    lastCommitSha: "",
    lastCommitMessage: "",
    lastSyncedAt: "",
    isSynced: false,
    syncMethod: "github_action",
    sandboxUrl: "",
  };
  const [repoInfo, setRepoInfo] = useState<GameRepoInfo>(emptyRepoInfo);
  const [isDisconnected, setIsDisconnected] = useState(true);
  const [showGithubMenu, setShowGithubMenu] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const isPublishTab = location.pathname.includes('/publish') || location.pathname.includes('/deployments');
  const sandboxUrl = repoInfo.sandboxUrl;
  const [copiedSandbox, setCopiedSandbox] = useState(false);

  const handleCopySandbox = () => {
    void navigator.clipboard?.writeText(sandboxUrl);
    setCopiedSandbox(true);
    setTimeout(() => setCopiedSandbox(false), 2000);
  };

  const refreshRepoInfo = async () => {
    if (!gameId) return;
    try {
      const res = await githubApi.getGameRepo(gameId);
      if (res.success && res.repo_info) {
        setRepoInfo(res.repo_info);
        setIsDisconnected(false);
      }
    } catch {
      setIsDisconnected(true);
    }
  };

  const initialName = location.state?.gameName || (game ? game.name : "New Game");
  const [gameName, setGameName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(initialName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [status, setStatus] = useState<GameStatus>(game?.status || 'DEVELOPMENT');

  useEffect(() => {
    const handleUpdate = () => {
      const g = getGameById(gameId || 'g_101');
      if (g) {
        setGame(g);
        setGameName(g.name);
        setStatus(g.status);
      }
    };
    window.addEventListener(GAMES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(GAMES_UPDATED_EVENT, handleUpdate);
  }, [gameId]);

  // Sync the current repository binding for the header.
  useEffect(() => {
    if (!gameId) return;
    let isMounted = true;

    githubApi.getGameRepo(gameId).then(res => {
      if (isMounted && res.success && res.repo_info) {
        setRepoInfo(res.repo_info);
        setIsDisconnected(false);
      }
    }).catch(() => setIsDisconnected(true));

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowGithubMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const isMetaLocked = ['PENDING_REVIEW', 'APPROVED', 'PUBLIC_ACTIVE', 'MAINTENANCE', 'ARCHIVED'].includes(status);

  const handleSaveName = async () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      try {
        if (gameId) await updateGame(gameId, { name: trimmed });
        setNameError(null);
        setGameName(trimmed);
      } catch (error) {
        setNameError(error instanceof Error ? error.message : "Unable to save game name");
        return;
      }
    } else {
      setTempName(gameName);
    }
    setIsEditing(false);
  };

  const handleStatusChange = async (newStatus: GameStatus) => {
    try {
      if (gameId) await updateGame(gameId, { status: newStatus });
      setStatus(newStatus);
    } catch (error) {
      setNameError(error instanceof Error ? error.message : "Unable to update game status");
    }
  };

  const handleUnlinkConfirm = async () => {
    if (!gameId) return;
    try {
      const response = await githubApi.unlinkGameRepo(gameId);
      if (!response.success) {
        throw new Error(response.message || "Failed to disconnect repository");
      }
      setShowUnlinkModal(false);
      setIsDisconnected(true);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Failed to disconnect repository");
    }
  };

  const hasActiveRepo = !isDisconnected && Boolean(repoInfo?.repository);

  return (
    <div className="game-console">
      <div style={{ marginBottom: '24px' }}>
        <Link to="/dashboard/games" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--portal-muted)', textDecoration: 'none', marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Games
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
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
            {nameError && (
              <div style={{ color: '#e53e3e', fontSize: '13px', marginTop: '6px', fontWeight: 500 }}>
                {nameError}
              </div>
            )}
          </div>

          {/* Header Action: GitHub dropdown on Publish tab, Sandbox button and link on Overview tab */}
          {isPublishTab ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                if (hasActiveRepo) {
                  setShowGithubMenu(prev => !prev);
                } else {
                  window.dispatchEvent(new CustomEvent("randseed:open-github-connect", { detail: { gameId } }));
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                background: '#111827',
                color: '#fff',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'background 0.15s ease'
              }}
            >
              <Github size={16} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {hasActiveRepo ? repoInfo.repository.split('/')[1] || repoInfo.repository : "GitHub"}
                </span>
                {hasActiveRepo && (
                  <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>
                    {repoInfo.branch}
                  </span>
                )}
              </div>
              {hasActiveRepo && <ChevronDown size={14} style={{ marginLeft: '4px', opacity: 0.8 }} />}
            </button>

            {/* Dropdown Card */}
            {showGithubMenu && hasActiveRepo && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '320px',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                  padding: '16px',
                  zIndex: 50
                }}
              >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#f3f4f6', display: 'grid', placeItems: 'center' }}>
                          <Github size={16} color="#111827" />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', wordBreak: 'break-all' }}>
                            {repoInfo.repository}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
                            branch: <strong>{repoInfo.branch}</strong>
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#16a34a', background: '#ecfdf5', padding: '2px 6px', borderRadius: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={11} /> Linked
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <a
                        href={`https://github.com/${repoInfo.repository}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#374151',
                          textDecoration: 'none',
                          background: '#f9fafb'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#f9fafb')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ExternalLink size={14} /> Open Repository
                        </span>
                        <ArrowUpRight size={12} color="#9ca3af" />
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setShowGithubMenu(false);
                          setShowUnlinkModal(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#dc2626',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Link2Off size={14} /> Disconnect Repo
                      </button>
                    </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <a 
              href={sandboxUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="primary-action" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
            >
              Open Sandbox <ExternalLink size={16} />
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <a 
                href={sandboxUrl} 
                target="_blank" 
                rel="noreferrer" 
                style={{ fontSize: '12px', color: 'var(--portal-purple)', textDecoration: 'underline', fontFamily: 'monospace' }}
              >
                {sandboxUrl}
              </a>
              <button
                type="button"
                onClick={handleCopySandbox}
                title="Copy sandbox URL"
                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: copiedSandbox ? '#16a34a' : 'var(--portal-muted)', display: 'inline-flex', alignItems: 'center' }}
              >
                {copiedSandbox ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

      <nav className="game-console-tabs" style={{ display: 'flex', alignItems: 'stretch', height: '45px', gap: '24px', borderBottom: '1px solid var(--portal-border)', marginBottom: '32px' }}>
        {[
          { to: `/dashboard/games/${gameId}`, end: true, label: "Overview", icon: LayoutDashboard },
          { to: `/dashboard/games/${gameId}/publish`, label: "Publish", icon: Rocket },
          { to: `/dashboard/games/${gameId}/settings`, label: "Settings", icon: Settings }
        ].map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              height: '45px',
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

      <Outlet context={{ status, setStatus: handleStatusChange }} />

      {/* Unlink Confirmation Modal */}
      {showUnlinkModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#ef4444' }}>
              <Link2Off size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
              Disconnect Repository?
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
              Are you sure you want to unlink <strong>{repoInfo.repository}</strong>? Automatic CI/CD deployments and webhooks will stop syncing.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowUnlinkModal(false)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'transparent', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnlinkConfirm}
                style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
