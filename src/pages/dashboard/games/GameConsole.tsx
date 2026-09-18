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
  RefreshCw, 
  ShieldCheck, 
  ArrowUpRight, 
  AlertCircle,
  Copy 
} from "lucide-react";
import { getGameById, updateGame, isGameNameUnique, GAMES_UPDATED_EVENT, type GameRepoInfo } from "./gameData";
import { githubApi } from "../../../services/githubApi";

const GITHUB_APP_SLUG = "RDcreatordev";

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
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  // Connect modal state
  const [repoInput, setRepoInput] = useState("");
  const [branchInput, setBranchInput] = useState("main");
  const [buildDirInput, setBuildDirInput] = useState("dist");
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [installUrl, setInstallUrl] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const isPublishTab = location.pathname.includes('/publish') || location.pathname.includes('/deployments');
  const sandboxUrl = repoInfo.sandboxUrl;
  const [copiedSandbox, setCopiedSandbox] = useState(false);

  const handleCopySandbox = () => {
    void navigator.clipboard?.writeText(sandboxUrl);
    setCopiedSandbox(true);
    setTimeout(() => setCopiedSandbox(false), 2000);
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

  // Sync install info & game repo from API
  useEffect(() => {
    if (!gameId) return;
    let isMounted = true;
    githubApi.getInstallInfo(gameId).then(info => {
      if (isMounted && info.install_url) setInstallUrl(info.install_url);
    }).catch(() => {});

    githubApi.getGameRepo(gameId).then(res => {
      if (isMounted && res.success && res.repo_info) {
        setRepoInfo(res.repo_info);
        setIsDisconnected(false);
      }
    }).catch(() => setIsDisconnected(true));

    return () => { isMounted = false; };
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

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      if (!isGameNameUnique(trimmed, gameId)) {
        setNameError(`Game Name "${trimmed}" is already taken. Game names must be unique.`);
        return;
      }
      setNameError(null);
      setGameName(trimmed);
      if (gameId) {
        updateGame(gameId, { name: trimmed });
      }
    } else {
      setTempName(gameName);
    }
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: GameStatus) => {
    setStatus(newStatus);
    if (gameId) {
      updateGame(gameId, { status: newStatus });
    }
  };

  const handleLinkRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) {
      setLinkError("Repository name is required.");
      return;
    }
    setIsLinking(true);
    setLinkError(null);
    if (!gameId) {
      setLinkError("A game is required before connecting a repository.");
      return;
    }
    try {
      const res = await githubApi.linkGameRepo(gameId, {
        repository: repoInput.trim(),
        branch: branchInput.trim() || 'main',
        build_dir: buildDirInput.trim() || 'dist',
        installation_id: Number(new URLSearchParams(window.location.search).get("installation_id")) || undefined,
      });
      if (res && res.success && res.binding) {
        setRepoInfo(prev => ({
          ...prev,
          repository: res.binding.repository,
          branch: res.binding.branch,
          lastSyncedAt: "Never",
          isSynced: false
        }));
        setIsDisconnected(false);
        setShowConnectModal(false);
      } else {
        setLinkError(res.error || "Failed to link repository.");
      }
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Failed to link repository");
    } finally {
      setIsLinking(false);
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
      setLinkError(err instanceof Error ? err.message : "Failed to disconnect repository");
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
              onClick={() => setShowGithubMenu(prev => !prev)}
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
              <ChevronDown size={14} style={{ marginLeft: '4px', opacity: 0.8 }} />
            </button>

            {/* Dropdown Card */}
            {showGithubMenu && (
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
                {hasActiveRepo ? (
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
                          setShowConnectModal(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#374151',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <RefreshCw size={14} /> Switch / Reconnect Repo
                      </button>

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
                ) : (
                  <div>
                    <div style={{ textAlign: 'center', padding: '8px 4px 16px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f3f4f6', display: 'grid', placeItems: 'center', margin: '0 auto 8px' }}>
                        <Github size={20} color="#6b7280" />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>No Repository Connected</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        Connect your GitHub repo to trigger automatic builds and deploys.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGithubMenu(false);
                        setShowConnectModal(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 14px',
                        background: '#111827',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Github size={14} /> Connect Repository
                    </button>
                  </div>
                )}
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

      <nav className="game-console-tabs" style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--portal-border)', marginBottom: '32px' }}>
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

      {/* Connect Modal */}
      {showConnectModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.6)', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '18px', padding: '32px', maxWidth: '540px', width: '100%', textAlign: 'left', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f3ff', display: 'grid', placeItems: 'center', color: '#7c3aed' }}>
                  <Github size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>Connect GitHub Repository</h3>
                  <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>via GitHub App: {GITHUB_APP_SLUG}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
              >
                &times;
              </button>
            </div>

            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#16a34a" /> Step 1: Authorize {GITHUB_APP_SLUG}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Grant repository access to the official RandSeed GitHub App.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (installUrl) window.open(installUrl, "_blank", "noopener,noreferrer");
                  }}
                  disabled={!installUrl}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    background: '#111827',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    border: 'none',
                    cursor: installUrl ? 'pointer' : 'not-allowed',
                    opacity: installUrl ? 1 : 0.5
                  }}
                >
                  <span>Authorize on GitHub</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>

            <form onSubmit={handleLinkRepository}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Step 2: Select Repository <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={repoInput}
                    onChange={e => setRepoInput(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box', appearance: 'none', backgroundColor: '#fff', cursor: 'pointer' }}
                  >
                    <option value="" disabled>Select an authorized repository...</option>
                    {repoInfo.repository && <option value={repoInfo.repository}>{repoInfo.repository}</option>}
                  </select>
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Branch
                  </label>
                  <input
                    type="text"
                    placeholder="main"
                    value={branchInput}
                    onChange={e => setBranchInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Build Output Dir
                  </label>
                  <input
                    type="text"
                    placeholder="dist"
                    value={buildDirInput}
                    onChange={e => setBuildDirInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {linkError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{linkError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'transparent', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLinking}
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: isLinking ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isLinking ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{isLinking ? "Connecting..." : "Link Repository"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
