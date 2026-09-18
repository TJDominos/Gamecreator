import React, { useEffect, useState } from "react";
import {
  GitCommit,
  ExternalLink,
  ShieldCheck,
  Globe,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Lock,
  Radio,
  Check,
  Tag,
  Copy,
  AlertCircle,
  Link2,
  Trash2,
  Sparkles,
  Layers,
  Calendar,
  Eye,
  Rocket,
  GitBranch,
  MoreHorizontal
} from "lucide-react";
import { useParams, Link } from "react-router";
import {
  getGameById,
  validateGameForPrivatePublish,
  validateGameForPublicPublish,
  updateGame,
  GAMES_UPDATED_EVENT,
  type Game
} from "./gameData";
import {
  githubApi,
  type DeploymentRecord,
  type PrivateReleaseResponse,
  type ActivePrivateReleaseInfo
} from "../../../services/githubApi";
import { gameApi } from "../../../services/gameApi";
import { GitHubSyncCard } from "./GitHubSyncCard";

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusStyle(status: string): React.CSSProperties {
  if (status === "published") return { background: "#e6f6ec", color: "#1e874b", border: "1px solid #bbf7d0" };
  if (["failed", "cancelled", "superseded"].includes(status)) return { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" };
  if (["building", "uploading", "publishing", "queued"].includes(status)) return { background: "#fff1d9", color: "#8a5314", border: "1px solid #fed7aa" };
  return { background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe" };
}

export function Publish(): React.ReactElement {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | undefined>(() => getGameById(gameId || 'g_101'));

  // Deployments list & loading
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Single selected deployment for publishing / custom player-facing version
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);

  // Active private release state from backend (1:1 constraint)
  const [activePrivateRelease, setActivePrivateRelease] = useState<ActivePrivateReleaseInfo | null>(null);
  const [activeReleaseUrl, setActiveReleaseUrl] = useState<string | null>(null);
  const [isLoadingActiveRelease, setIsLoadingActiveRelease] = useState(true);

  // Modals & form state
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [showGoPublicModal, setShowGoPublicModal] = useState(false);
  const [showReplaceConfirmModal, setShowReplaceConfirmModal] = useState(false);

  const [privateExpiryDays, setPrivateExpiryDays] = useState<number | null>(7);
  const [isPublishingPrivate, setIsPublishingPrivate] = useState(false);
  const [isPublishingPublic, setIsPublishingPublic] = useState(false);
  const [publicConfirmVersion, setPublicConfirmVersion] = useState("");
  const [shortNameInput, setShortNameInput] = useState(game?.shortName || "");
  const [privateConfirmVersion, setPrivateConfirmVersion] = useState("");
  const [isRevokingPrivateRelease, setIsRevokingPrivateRelease] = useState(false);
  const [showDelistModal, setShowDelistModal] = useState(false);
  const [delistReason, setDelistReason] = useState("");
  const [isDelisting, setIsDelisting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Player-facing display version customization
  const [customVersionInput, setCustomVersionInput] = useState(game?.displayVersion || game?.version || "v1.0.0");
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [versionSaveSuccess, setVersionSaveSuccess] = useState(false);

  // Name inline rename state if validation fails
  const [editNameInput, setEditNameInput] = useState(game?.name || '');
  const [nameSaveMsg, setNameSaveMsg] = useState<string | null>(null);

  // Validation
  const validation = game ? validateGameForPrivatePublish(game) : { valid: true, errors: [] };

  // Sync game data from global event
  useEffect(() => {
    const handleUpdate = () => {
      const g = getGameById(gameId || 'g_101');
      if (g) {
        setGame(g);
        setEditNameInput(g.name);
        setShortNameInput(g.shortName || "");
        if (!isEditingVersion) {
          setCustomVersionInput(g.displayVersion || g.version || "v1.0.0");
        }
      }
    };
    window.addEventListener(GAMES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(GAMES_UPDATED_EVENT, handleUpdate);
  }, [gameId, isEditingVersion]);

  // Load deployments
  const loadDeployments = async () => {
    if (!gameId) return;
    try {
      const response = await githubApi.listDeployments(gameId);
      const list = response.deployments || [];
      setDeployments(list);
      setLoadError(null);

      // Auto-select the latest published deployment if none is selected yet
      setSelectedDeploymentId((prev) => {
        if (prev && list.some(d => d.id === prev)) return prev;
        const firstPublished = list.find(d => d.status === "published");
        return firstPublished ? firstPublished.id : (list[0]?.id || null);
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load version history");
    } finally {
      setIsLoading(false);
    }
  };

  // Load active private release from backend
  const loadActivePrivateRelease = async () => {
    if (!gameId) return;
    try {
      setIsLoadingActiveRelease(true);
      const res = await githubApi.getActivePrivateRelease(gameId);
      if (res.success) {
        setActivePrivateRelease(res.active_release || null);
      }
    } catch {
      // Backend may be running without D1 in mock environment, fallback to local state gracefully
    } finally {
      setIsLoadingActiveRelease(false);
    }
  };

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    void loadDeployments();
    void loadActivePrivateRelease();

    const intervalId = window.setInterval(() => {
      if (!cancelled) {
        void loadDeployments();
      }
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [gameId]);

  // Handle saving the creator's customized player-facing display version
  const handleSaveDisplayVersion = () => {
    if (!gameId) return;
    const trimmed = customVersionInput.trim() || "v1.0.0";
    const res = updateGame(gameId, {
      displayVersion: trimmed,
      version: trimmed
    });
    if (res) {
      setGame(res);
      setVersionSaveSuccess(true);
      setIsEditingVersion(false);
      setTimeout(() => setVersionSaveSuccess(false), 2500);
    }
  };

  // Inline rename if game name uniqueness failed
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

  // Trigger Private Publish Flow
  const handleInitiatePrivatePublish = () => {
    setModalError(null);
    if (!selectedDeploymentId) {
      setModalError("Please select a deployment version first.");
      return;
    }

    // Check if an active private release already exists
    if (activePrivateRelease) {
      setShowReplaceConfirmModal(true);
      return;
    }

    setShowPrivateModal(true);
  };

  // Confirm creating or replacing private publish release
  const handleExecutePrivatePublish = async (forceReplace: boolean = false) => {
    if (!gameId || !selectedDeploymentId) return;

    // Check game profile requirements
    const currentGame = getGameById(gameId);
    if (currentGame) {
      const check = validateGameForPrivatePublish(currentGame);
      if (!check.valid) {
        setModalError(`Cannot publish: ${check.errors.join(' ')}`);
        return;
      }
    }

    setIsPublishingPrivate(true);
    setModalError(null);
    try {
      const response = await githubApi.createPrivateRelease(
        gameId,
        selectedDeploymentId,
        privateExpiryDays,
        forceReplace
      );

      if (response.success && response.url) {
        setActiveReleaseUrl(response.url);
        setActivePrivateRelease({
          id: response.release_id || `pr_${Date.now()}`,
          deployment_id: selectedDeploymentId,
          expires_at: response.expires_at || null,
          created_at: Date.now()
        });
        // Update game status to PRIVATE_TESTING if it was DRAFT
        if (game?.status === 'DRAFT' || game?.status === 'DEVELOPMENT') {
          updateGame(gameId, { status: 'PRIVATE_TESTING' });
        }
        setShowReplaceConfirmModal(false);
        setShowPrivateModal(true);
      } else {
        setModalError(response.error || "Failed to generate private test link.");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to create private link";
      if (msg.includes("already active") || msg.includes("ACTIVE_PRIVATE_RELEASE_EXISTS")) {
        setShowPrivateModal(false);
        setShowReplaceConfirmModal(true);
      } else {
        setModalError(msg);
      }
    } finally {
      setIsPublishingPrivate(false);
      void loadActivePrivateRelease();
    }
  };

  // Revoke active private publish link
  const handleRevokePrivateRelease = async () => {
    if (!gameId || !activePrivateRelease?.id) return;
    setIsRevokingPrivateRelease(true);
    try {
      await githubApi.revokePrivateRelease(gameId, activePrivateRelease.id);
      setActivePrivateRelease(null);
      setActiveReleaseUrl(null);
      setShowPrivateModal(false);
      setShowReplaceConfirmModal(false);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "Unable to revoke private link");
    } finally {
      setIsRevokingPrivateRelease(false);
      void loadActivePrivateRelease();
    }
  };

  // Submit for Public Release Audit
  const handleExecuteGoPublic = async () => {
    if (!gameId || !selectedDeploymentId || !game) return;
    const publicGame = { ...game, shortName: shortNameInput.trim().toLowerCase() };
    const publicValidation = validateGameForPublicPublish(publicGame);
    if (!publicValidation.valid) {
      setModalError(publicValidation.errors.join(" "));
      return;
    }

    setIsPublishingPublic(true);
    setModalError(null);
    try {
      await gameApi.updateGame(gameId, {
        name: game.name.trim(),
        shortName: publicGame.shortName,
        status: 'PENDING_REVIEW',
        displayVersion: customVersionInput.trim() || game?.version || 'v1.0.0'
      });
      const updated = updateGame(gameId, {
        shortName: publicGame.shortName,
        status: 'PENDING_REVIEW',
        displayVersion: customVersionInput.trim() || game.version || 'v1.0.0'
      });
      if (updated) setGame(updated);
      setShowGoPublicModal(false);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "Unable to submit public review");
    } finally {
      setIsPublishingPublic(false);
    }
  };

  const handleExecuteDelist = () => {
    if (!gameId) return;
    setIsDelisting(true);
    try {
      updateGame(gameId, {
        status: 'DEVELOPMENT'
      });
      setShowDelistModal(false);
      setDelistReason("");
    } finally {
      setIsDelisting(false);
    }
  };

  const selectedDeployment = deployments.find(d => d.id === selectedDeploymentId);
  const isSelectedPublished = selectedDeployment?.status === "published";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <GitHubSyncCard
        gameId={gameId || ""}
        gameName={game?.name || ""}
      />
      
      {/* Top Action Bar: Header + Private Publish + Go Public Buttons */}
      <div style={{
        background: "#ffffff",
        border: "1px solid var(--portal-border)",
        borderRadius: "14px",
        padding: "16px 20px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#111827" }}>
              Publish & Version Control
            </h2>
            <span style={{
              fontSize: "12px",
              padding: "2px 8px",
              borderRadius: "6px",
              background: "#f3f4f6",
              color: "#4b5563",
              fontWeight: 500
            }}>
              {deployments.length} total builds
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--portal-muted)" }}>
            Select a deployment version from the version history below to deploy privately or submit for public release.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Active Private Link Indicator Pill */}
          {activePrivateRelease && (
            <div 
              onClick={() => {
                setModalError(null);
                setShowPrivateModal(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                color: "#166534",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s"
              }}
              title="Click to view or manage active private link"
            >
              <Link2 size={13} color="#16a34a" />
              <span>Private Release</span>
              <span style={{ fontSize: "11px", color: "#15803d", fontWeight: 400 }}>
                ({game?.displayVersion || game?.version || "v1.0.0"})
              </span>
            </div>
          )}

          {/* Button 1: Private Publish / Delist Private */}
          {activePrivateRelease && activePrivateRelease.deployment_id === selectedDeploymentId ? (
            <button
              type="button"
              onClick={handleRevokePrivateRelease}
              disabled={isRevokingPrivateRelease}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "43px",
                gap: "8px",
                padding: "0 18px",
                fontSize: "13px",
                fontWeight: 600,
                background: "#fee2e2",
                color: "#b91c1c",
                border: "1px solid #fca5a5",
                borderRadius: "9px",
                cursor: isRevokingPrivateRelease ? "wait" : "pointer"
              }}
            >
              <Trash2 size={15} />
              {isRevokingPrivateRelease ? "Delisting..." : `Delist Private Link (${activePrivateRelease.expires_at ? Math.max(1, Math.ceil((new Date(activePrivateRelease.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0} days left)`}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInitiatePrivatePublish}
              disabled={!selectedDeploymentId || !isSelectedPublished}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "43px",
                gap: "8px",
                padding: "0 18px",
                fontSize: "13px",
                fontWeight: 600,
                background: "transparent",
                color: "var(--portal-purple)",
                border: "1px solid var(--portal-purple)",
                borderRadius: "9px",
                opacity: (!selectedDeploymentId || !isSelectedPublished) ? 0.5 : 1,
                cursor: (!selectedDeploymentId || !isSelectedPublished) ? "not-allowed" : "pointer"
              }}
              title={!isSelectedPublished ? "Select a published build to generate private link" : ""}
            >
              <Lock size={15} />
              Private Publish
            </button>
          )}

          {/* Button 2: Go Public / Update Public */}
          <button
            type="button"
            className="primary-action"
            onClick={() => {
              setModalError(null);
              setPublicConfirmVersion("");
              setShortNameInput(game?.shortName || "");
              setShowGoPublicModal(true);
            }}
            disabled={!selectedDeploymentId || !isSelectedPublished || !validation.valid}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: 600,
              opacity: (!selectedDeploymentId || !isSelectedPublished || !validation.valid) ? 0.5 : 1,
              cursor: (!selectedDeploymentId || !isSelectedPublished || !validation.valid) ? "not-allowed" : "pointer"
            }}
            title={!validation.valid ? "Resolve name uniqueness and cover image before going public" : ""}
          >
            <Rocket size={15} />
            {game?.status === 'PUBLIC_ACTIVE' ? "Update Public Version" : "Go Public"}
          </button>
        </div>
      </div>



      {/* Main Version History Table & Cards (Reference Image Layout) */}
      <div style={{
        background: "#ffffff",
        border: "1px solid var(--portal-border)",
        borderRadius: "14px",
        overflow: "hidden"
      }}>
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--portal-border)",
          background: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={16} color="var(--portal-purple)" />
              Version History
            </h3>
            <span style={{ fontSize: "12px", color: "var(--portal-muted)" }}>
              Select a single version to point your private publishing link or audit release.
            </span>
          </div>

          <button
            type="button"
            onClick={() => void loadDeployments()}
            disabled={isLoading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              color: "#374151"
            }}
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--portal-muted)" }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "14px" }}>Loading version history...</div>
          </div>
        )}

        {/* Error State */}
        {loadError && !isLoading && (
          <div style={{ margin: "20px 24px", padding: "16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", color: "#991b1b", fontSize: "13px" }}>
            {loadError}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !loadError && deployments.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--portal-muted)" }}>
            <GitCommit size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#111827" }}>No deployments found</h4>
            <p style={{ margin: "0 auto", fontSize: "13px", maxWidth: "420px" }}>
              Push code commits to your connected GitHub branch to trigger an automated Randseed build and generate a version entry here.
            </p>
          </div>
        )}

        {/* Deployments List */}
        {!isLoading && deployments.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", background: "#fbfcfd", borderRadius: "12px", border: "1px solid var(--portal-border)", overflow: "hidden" }}>
            {deployments.map((dep, idx) => {
              const isSelected = selectedDeploymentId === dep.id;
              const isPrivateLinked = activePrivateRelease?.deployment_id === dep.id;

              return (
                <div
                  key={dep.id}
                  onClick={() => setSelectedDeploymentId(dep.id)}
                  style={{
                    padding: "16px 20px",
                    borderBottom: idx === deployments.length - 1 ? "none" : "1px solid var(--portal-border)",
                    background: isSelected ? "#f4f5f7" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Left Edge Indicator */}
                  {isSelected && (
                    <div style={{ position: "absolute", left: 0, top: "16px", bottom: "16px", width: "4px", background: "#2563eb", borderRadius: "0 4px 4px 0" }} />
                  )}

                  {/* Selection Radio */}
                  <input
                    type="radio"
                    name="deployment-selection"
                    checked={isSelected}
                    onChange={() => setSelectedDeploymentId(dep.id)}
                    style={{
                      cursor: "pointer",
                      width: "16px",
                      height: "16px",
                      accentColor: "#2563eb",
                      margin: 0
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* Commit SHA */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "monospace", color: "#6b7280", fontSize: "13px", minWidth: "90px" }}>
                    {dep.commit_sha.slice(0, 8)}
                    <button 
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "2px", display: "grid", placeItems: "center" }} 
                      title="Copy SHA" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigator.clipboard.writeText(dep.commit_sha); 
                      }}
                    >
                      <Copy size={13} />
                    </button>
                  </div>

                  {/* Commit Message */}
                  <div style={{ flex: 1, fontSize: "14px", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {dep.commit_message || `Build #${dep.id.slice(0, 8)}`}
                    {isPrivateLinked && (
                      <span style={{ marginLeft: "8px", fontSize: "11px", padding: "2px 6px", background: "#dcfce7", color: "#15803d", borderRadius: "4px" }}>
                        Active Private Link
                      </span>
                    )}
                    {dep.status !== "published" && (
                      <span style={{ marginLeft: "8px", fontSize: "11px", padding: "2px 6px", background: "#fee2e2", color: "#b91c1c", borderRadius: "4px" }}>
                        {dep.status}
                      </span>
                    )}
                  </div>

                  {/* Branch & Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#4b5563" }}>
                      <GitBranch size={14} color="#9ca3af" />
                      {dep.branch}
                    </div>
                    
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>
                      by Creator
                    </div>

                    <div style={{ fontSize: "13px", color: "#6b7280", minWidth: "70px", textAlign: "right" }}>
                      {formatDate(dep.created_at)}
                    </div>
                    
                    <button style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: "4px" }}>
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Local SDK Initialization terminal hint */}
      <div style={{
        background: "var(--portal-ink)",
        color: "#fff",
        borderRadius: "14px",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
            <Terminal size={18} /> Initialize Context Locally
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.7)", maxWidth: "560px" }}>
            To develop locally and test against Randseed services, run the agent initialization command inside your game directory.
          </p>
        </div>
        <div style={{
          background: "rgba(0,0,0,0.5)",
          padding: "10px 16px",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "13px",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#34d399",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>npx @randseed/agent-init</span>
        </div>
      </div>

      {/* MODAL 1: Private Publish Link Modal */}
      {showPrivateModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "grid",
          placeItems: "center",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)"
        }}>
          <div style={{
            background: "#fff",
            padding: "32px",
            borderRadius: "16px",
            width: "540px",
            maxWidth: "92vw",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--portal-purple-soft)", display: "grid", placeItems: "center", color: "var(--portal-purple)" }}>
                <Lock size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>
                  Private Publish
                </h3>
                <span style={{ fontSize: "12px", color: "var(--portal-muted)" }}>
                  Single active link constraint enforced
                </span>
              </div>
            </div>

            <p style={{ color: "var(--portal-muted)", fontSize: "13px", marginBottom: "20px", lineHeight: 1.5 }}>
              Generate a secure link for closed testing. Exactly <strong>one</strong> private testing link can be active per game at any time, pointing to a chosen deployment version.
            </p>

            {/* Uniqueness & Profile Gate */}
            {!validation.valid ? (
              <div style={{ marginBottom: "20px", padding: "16px", background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#92400e", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                  <AlertTriangle size={16} color="#d97706" />
                  <span>Validation Required Before Private Publish</span>
                </div>
                <div style={{ fontSize: "12px", color: "#78350f", marginBottom: "12px", lineHeight: 1.5 }}>
                  {validation.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>

                <form onSubmit={handleUpdateName} style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={editNameInput}
                    onChange={(e) => setEditNameInput(e.target.value)}
                    placeholder="Enter unique game name..."
                    style={{ flex: 1, padding: "8px 12px", border: "1px solid #dcd7e0", borderRadius: "6px", fontSize: "13px" }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "8px 14px",
                      background: "var(--portal-purple)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    Save Name
                  </button>
                </form>
                {nameSaveMsg && (
                  <div style={{ fontSize: "12px", color: "#16a34a", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={13} /> {nameSaveMsg}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#166534", fontSize: "12px" }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>Game name <strong>"{game?.name}"</strong> and profile meet private publish requirements.</span>
              </div>
            )}

            {/* Selected Version Summary */}
            <div style={{ padding: "12px 16px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", color: "var(--portal-muted)", marginBottom: "4px" }}>Deployment Target:</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                  {selectedDeployment?.commit_message || `Build #${selectedDeploymentId?.slice(0, 8)}`}
                </span>
                <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#4b5563" }}>
                  {selectedDeployment?.commit_sha.slice(0, 8)}
                </span>
              </div>
            </div>

            {modalError && (
              <div style={{ marginBottom: "16px", padding: "10px 12px", border: "1px solid #fecaca", background: "#fff7f7", color: "#991b1b", borderRadius: "8px", fontSize: "12px" }}>
                {modalError}
              </div>
            )}

            {/* Active Link Box if already generated or existing */}
            {(activeReleaseUrl || activePrivateRelease) && (
              <div style={{ marginBottom: "20px", padding: "14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#166534", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Active Private Link</span>
                  {activePrivateRelease?.expires_at && (
                    <span style={{ fontWeight: 400, color: "#15803d" }}>
                      Expires {formatDate(new Date(activePrivateRelease.expires_at).getTime())}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    value={activeReleaseUrl || `https://randseed.org/private/${gameId}?token=rs_active_release`}
                    readOnly
                    style={{ flex: 1, minWidth: 0, padding: "8px 10px", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "12px", background: "#fff" }}
                  />
                  <button
                    type="button"
                    className="primary-action"
                    style={{ padding: "8px 14px", fontSize: "12px" }}
                    onClick={() => {
                      const urlToCopy = activeReleaseUrl || `https://randseed.org/private/${gameId}?token=rs_active_release`;
                      void navigator.clipboard?.writeText(urlToCopy);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                  >
                    {copySuccess ? "Copied!" : "Copy"}
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--portal-muted)" }}>
                    Share with testers for closed evaluations.
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleRevokePrivateRelease()}
                    disabled={isRevokingPrivateRelease}
                    style={{
                      padding: 0,
                      background: "transparent",
                      border: "none",
                      color: "#b91c1c",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Trash2 size={12} /> {isRevokingPrivateRelease ? "Revoking..." : "Revoke link"}
                  </button>
                </div>
              </div>
            )}

            {/* Link Expiry Selection */}
            {(!activeReleaseUrl && !activePrivateRelease) && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Link Expiration Period (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={privateExpiryDays ?? ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setPrivateExpiryDays(Math.min(60, Math.max(1, val)));
                    else setPrivateExpiryDays(null);
                  }}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Enter days (1-60)"
                />
              </div>
            )}

            {/* Double Confirmation Step */}
            {(!activeReleaseUrl && !activePrivateRelease) && (
              <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '8px', fontWeight: 500 }}>
                  Set Player-Facing Release Version <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={customVersionInput}
                  onChange={(e) => setCustomVersionInput(e.target.value)}
                  placeholder="e.g. v1.0.0, 2026.1-beta"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                style={{ padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600, color: "var(--portal-muted)" }}
                onClick={() => {
                  setShowPrivateModal(false);
                  setModalError(null);
                }}
              >
                Close
              </button>
              {(!activeReleaseUrl && !activePrivateRelease) && (
                <button
                  type="button"
                  className="primary-action"
                  disabled={isPublishingPrivate || !validation.valid || !isSelectedPublished || !customVersionInput.trim() || !privateExpiryDays || privateExpiryDays < 1 || privateExpiryDays > 60}
                  onClick={() => void handleExecutePrivatePublish(false)}
                  style={{
                    opacity: (isPublishingPrivate || !validation.valid || !isSelectedPublished || !customVersionInput.trim() || !privateExpiryDays || privateExpiryDays < 1 || privateExpiryDays > 60) ? 0.5 : 1,
                    cursor: (isPublishingPrivate || !validation.valid || !isSelectedPublished || !customVersionInput.trim() || !privateExpiryDays || privateExpiryDays < 1 || privateExpiryDays > 60) ? "not-allowed" : "pointer"
                  }}
                >
                  {isPublishingPrivate ? "Generating Link..." : "Generate Private Link"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 1:1 Replacement Confirmation Modal */}
      {showReplaceConfirmModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 110,
          display: "grid",
          placeItems: "center",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)"
        }}>
          <div style={{
            background: "#fff",
            padding: "32px",
            borderRadius: "16px",
            width: "500px",
            maxWidth: "92vw",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#fef2f2", display: "grid", placeItems: "center", color: "#dc2626" }}>
                <AlertTriangle size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#111827" }}>
                Replace Active Private Link?
              </h3>
            </div>

            <p style={{ color: "#4b5563", fontSize: "13px", lineHeight: 1.5, margin: "0 0 16px" }}>
              Randseed strictly enforces <strong>one private publishing link</strong> per game pointing to a single deployment version.
            </p>

            <div style={{ padding: "12px 16px", background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "8px", fontSize: "13px", color: "#9a3412", marginBottom: "20px" }}>
              A private publishing link is currently active for <strong>Build #{activePrivateRelease?.deployment_id.slice(0, 8)}</strong>.
              Publishing a new link will revoke the previous link immediately.
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                New Link Expiration Period (Days)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={privateExpiryDays ?? ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setPrivateExpiryDays(Math.min(60, Math.max(1, val)));
                  else setPrivateExpiryDays(null);
                }}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Enter days (1-60)"
              />
            </div>

            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '8px', fontWeight: 500 }}>
                Set Player-Facing Release Version <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="text" 
                value={customVersionInput}
                onChange={(e) => setCustomVersionInput(e.target.value)}
                placeholder="e.g. v1.0.0, 2026.1-beta"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {modalError && (
              <div style={{ marginBottom: "16px", padding: "10px 12px", border: "1px solid #fecaca", background: "#fff7f7", color: "#991b1b", borderRadius: "8px", fontSize: "12px" }}>
                {modalError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                style={{ padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600, color: "var(--portal-muted)" }}
                onClick={() => {
                  setShowReplaceConfirmModal(false);
                  setModalError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-action"
                style={{ 
                  background: "#dc2626", 
                  color: "#fff",
                  opacity: (isPublishingPrivate || !customVersionInput.trim() || !privateExpiryDays || privateExpiryDays < 1 || privateExpiryDays > 60) ? 0.5 : 1,
                  cursor: (isPublishingPrivate || !customVersionInput.trim() || !privateExpiryDays || privateExpiryDays < 1 || privateExpiryDays > 60) ? "not-allowed" : "pointer"
                }}
                disabled={isPublishingPrivate || !customVersionInput.trim() || !privateExpiryDays || privateExpiryDays < 1 || privateExpiryDays > 60}
                onClick={() => void handleExecutePrivatePublish(true)}
              >
                {isPublishingPrivate ? "Replacing..." : "Revoke & Replace Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Go Public Audit Submission Modal */}
      {showGoPublicModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "grid",
          placeItems: "center",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)"
        }}>
          <div style={{
            background: "#fff",
            padding: "32px",
            borderRadius: "16px",
            width: "520px",
            maxWidth: "92vw",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--portal-purple-soft)", display: "grid", placeItems: "center", color: "var(--portal-purple)" }}>
                <Rocket size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>
                  Submit Game for Public Release
                </h3>
                <span style={{ fontSize: "12px", color: "var(--portal-muted)" }}>
                  Initiate audit and lobby publication
                </span>
              </div>
            </div>

            <p style={{ color: "#4b5563", fontSize: "13px", lineHeight: 1.5, marginBottom: "20px" }}>
              Your chosen build and metadata will be submitted to the Randseed team for audit. Once approved, the game becomes discoverable in the public lobby.
            </p>

            <div style={{ padding: "16px", background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: "10px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--portal-muted)" }}>Game Name:</span>
                <strong style={{ color: "#111827" }}>{game?.name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--portal-muted)" }}>Public Link:</span>
                <span style={{ fontFamily: "monospace", color: "#111827" }}>
                  randseed.org/{shortNameInput || "short-name"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--portal-muted)" }}>Deployment Build:</span>
                <span style={{ fontFamily: "monospace", color: "#111827" }}>{selectedDeployment?.commit_sha.slice(0, 8)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '18px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '8px', fontWeight: 500 }}>
                Public Short Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={shortNameInput}
                onChange={(e) => setShortNameInput(e.target.value.toLowerCase())}
                placeholder="e.g. space-runner"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ marginTop: '6px', color: 'var(--portal-muted)', fontSize: '12px', lineHeight: 1.4 }}>
                This becomes the public link: <strong>randseed.org/{shortNameInput || 'short-name'}</strong>. Use lowercase letters, numbers, and hyphens only.
              </div>
            </div>

            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '8px', fontWeight: 500 }}>
                Set Player-Facing Release Version <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="text" 
                value={customVersionInput}
                onChange={(e) => setCustomVersionInput(e.target.value)}
                placeholder="e.g. v1.0.0, 2026.1-beta"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {modalError && (
              <div style={{ marginBottom: "16px", padding: "10px 12px", border: "1px solid #fecaca", background: "#fff7f7", color: "#991b1b", borderRadius: "8px", fontSize: "12px" }}>
                {modalError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                style={{ padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600, color: "var(--portal-muted)" }}
                onClick={() => setShowGoPublicModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-action"
                disabled={isPublishingPublic || !customVersionInput.trim() || !shortNameInput.trim()}
                onClick={() => void handleExecuteGoPublic()}
                style={{
                  opacity: (isPublishingPublic || !customVersionInput.trim() || !shortNameInput.trim()) ? 0.5 : 1,
                  cursor: (isPublishingPublic || !customVersionInput.trim() || !shortNameInput.trim()) ? "not-allowed" : "pointer"
                }}
              >
                {isPublishingPublic ? "Submitting..." : "Confirm & Submit Audit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delist Public Game Modal */}
      {showDelistModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "grid",
          placeItems: "center",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)"
        }}>
          <div style={{
            background: "#fff",
            padding: "32px",
            borderRadius: "16px",
            width: "500px",
            maxWidth: "92vw",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#fef2f2", display: "grid", placeItems: "center", color: "#dc2626" }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>
                  Delist Public Game
                </h3>
                <span style={{ fontSize: "12px", color: "var(--portal-muted)" }}>
                  Remove game from public lobby
                </span>
              </div>
            </div>

            <p style={{ color: "#4b5563", fontSize: "13px", lineHeight: 1.5, marginBottom: "20px" }}>
              Delisting your game will immediately remove it from the Randseed public discovery lobby and leaderboards. Existing active players will not be disconnected, but new players will not be able to join.
            </p>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                Reason for Delisting
              </label>
              <select
                value={delistReason}
                onChange={(e) => setDelistReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#fafafa",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "13px",
                  outline: "none"
                }}
              >
                <option value="" disabled>Select a reason...</option>
                <option value="updating">Needs major update or maintenance</option>
                <option value="bugs">Critical bugs discovered</option>
                <option value="retired">Retiring the game permanently</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                style={{ padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600, color: "var(--portal-muted)" }}
                onClick={() => setShowDelistModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-action"
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  opacity: (!delistReason || isDelisting) ? 0.5 : 1,
                  cursor: (!delistReason || isDelisting) ? "not-allowed" : "pointer"
                }}
                disabled={!delistReason || isDelisting}
                onClick={handleExecuteDelist}
              >
                {isDelisting ? "Delisting..." : "Confirm Delist"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
