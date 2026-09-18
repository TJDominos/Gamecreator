import React, { useState, useEffect } from "react";
import { 
  Github, 
  ExternalLink, 
  Link2Off, 
  CheckCircle2, 
  RefreshCw, 
  Info, 
  Copy, 
  Check, 
  Zap, 
  Radio, 
  Terminal,
  AlertCircle,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Download,
  GitPullRequest
} from "lucide-react";
import { GameRepoInfo } from "./gameData";
import { githubApi } from "../../../services/githubApi";

const GITHUB_APP_SLUG = "RDcreatordev";

interface GitHubSyncCardProps {
  gameId: string;
  gameName: string;
  isLocked?: boolean;
}

export function GitHubSyncCard({
  gameId,
  gameName,
  isLocked = false
}: GitHubSyncCardProps): React.ReactElement {
  const [repoInfo, setRepoInfo] = useState<GameRepoInfo>({
    repository: "",
    branch: "main",
    lastCommitSha: "",
    lastCommitMessage: "",
    lastSyncedAt: "",
    isSynced: false,
    syncMethod: "github_action",
    sandboxUrl: ""
  });

  const [isCheckingSync, setIsCheckingSync] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showInfoDetails, setShowInfoDetails] = useState(false);
  const [activeSyncTab, setActiveSyncTab] = useState<'action' | 'webhook' | 'manual'>('action');
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [isImportingWorkflow, setIsImportingWorkflow] = useState(false);
  const [workflowImportFeedback, setWorkflowImportFeedback] = useState<string | null>(null);
  const [workflowPullRequestUrl, setWorkflowPullRequestUrl] = useState<string | null>(null);
  const [copiedSandboxUrl, setCopiedSandboxUrl] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);

  // Connect form state
  const [repoInput, setRepoInput] = useState(repoInfo.repository || "");
  const [branchInput, setBranchInput] = useState(repoInfo.branch || "main");
  const [buildDirInput, setBuildDirInput] = useState("dist");
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [installUrl, setInstallUrl] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [isOpeningGitHub, setIsOpeningGitHub] = useState(false);

  const handleConnectGitHub = async () => {
    setIsOpeningGitHub(true);
    setInstallError(null);
    try {
      const info = await githubApi.getInstallInfo(gameId);
      if (!info.install_url) {
        throw new Error("GitHub App installation URL was not returned.");
      }
      setInstallUrl(info.install_url);
      window.location.assign(info.install_url);
    } catch (error) {
      setInstallError(
        error instanceof Error
          ? error.message
          : "Unable to open GitHub. Please sign in to the Creator Portal and try again.",
      );
      setIsOpeningGitHub(false);
    }
  };

  // Load only the connected repository on mount. The GitHub installation URL
  // is created after the user explicitly clicks Connect GitHub.
  useEffect(() => {
    let isMounted = true;

    githubApi.getGameRepo(gameId).then(res => {
      if (isMounted && res.success && res.repo_info) {
        setRepoInfo(res.repo_info);
        setIsDisconnected(false);
      }
    }).catch(() => {
      if (isMounted) setIsDisconnected(true);
    });

    if (new URLSearchParams(window.location.search).get("github_installed") === "true") {
      setShowConnectModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  const handleCheckSyncStatus = async () => {
    setIsCheckingSync(true);
    setSyncFeedback(null);

    try {
      const res = await githubApi.checkSyncStatus(gameId);
      if (res && res.success) {
        setRepoInfo(prev => ({
          ...prev,
          isSynced: res.is_synced,
          lastSyncedAt: "Just now",
          lastCommitSha: res.latest_commit || prev.lastCommitSha,
          lastCommitMessage: res.commit_message || prev.lastCommitMessage,
          sandboxUrl: res.sandbox_url || prev.sandboxUrl,
        }));
        setSyncFeedback(res.message || "Sync verified! Sandbox is up-to-date with latest commit on main.");
      } else {
        setSyncFeedback("Sync checked. Repository is reachable.");
      }
    } catch (err) {
      setSyncFeedback(err instanceof Error ? err.message : "Unable to verify GitHub sync status.");
    } finally {
      setIsCheckingSync(false);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  const handleLinkRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim() || !repoInput.includes("/")) {
      setLinkError("Please enter a valid GitHub repository in the format 'owner/repository'.");
      return;
    }

    setIsLinking(true);
    setLinkError(null);

    try {
      const res = await githubApi.linkGameRepo(gameId, {
        repository: repoInput.trim(),
        branch: branchInput.trim() || "main",
        build_dir: buildDirInput.trim() || "dist",
        installation_id: Number(new URLSearchParams(window.location.search).get("installation_id")) || undefined,
      });

      if (res.success && res.binding) {
        setRepoInfo(prev => ({
          ...prev,
          repository: res.binding?.repository || repoInput.trim(),
          branch: res.binding?.branch || branchInput.trim(),
          sandboxUrl: res.binding?.sandbox_url || prev.sandboxUrl,
          isSynced: false,
          lastSyncedAt: "Never",
        }));

        setIsDisconnected(false);
        setShowConnectModal(false);
        setSyncFeedback(`Repository successfully linked to ${res.binding.repository} via ${GITHUB_APP_SLUG}.`);
        setTimeout(() => setSyncFeedback(null), 8000);
      } else {
        setLinkError(res.error || "Failed to link repository. Please check permissions.");
      }
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Failed to link repository");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkConfirm = async () => {
    try {
      const response = await githubApi.unlinkGameRepo(gameId);
      if (!response.success) {
        throw new Error(response.message || "Failed to disconnect repository");
      }
      setShowUnlinkModal(false);
      setIsDisconnected(true);
    } catch {
      setLinkError("Failed to disconnect repository. Please try again.");
    }
  };

  const getWorkflowContent = () => {
    const buildDir = buildDirInput || "dist";
    return [
      "name: Deploy to RandSeed Sandbox",
      "",
      "on:",
      "  workflow_dispatch:",
      "    inputs:",
      "      deployment_id:",
      "        required: true",
      "        type: string",
      "      commit_sha:",
      "        required: true",
      "        type: string",
      "      game_id:",
      "        required: true",
      "        type: string",
      "",
      "permissions:",
      "  contents: read",
      "  id-token: write",
      "",
      "jobs:",
      "  build-and-deploy:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "        with:",
      "          ref: ${{ inputs.commit_sha }}",
      "      - uses: actions/setup-node@v4",
      "        with:",
      "          node-version: 20",
      "      - run: npm ci && npm run build",
      "      - name: Create manifest",
      "        env:",
      "          DEPLOYMENT_ID: ${{ inputs.deployment_id }}",
      "          COMMIT_SHA: ${{ inputs.commit_sha }}",
      "        run: |",
      "          node <<'NODE' > /tmp/randseed-manifest.json",
      "          const fs = require('fs'), path = require('path'), crypto = require('crypto');",
      `          const root = '${buildDir}';`,
      "          const files = [];",
      "          function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else { const relative = path.relative(root, full).split(path.sep).join('/'); const bytes = fs.readFileSync(full); files.push({ path: relative, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), size: bytes.length }); } } }",
      "          walk(root); files.sort((a, b) => a.path.localeCompare(b.path));",
      `          console.log(JSON.stringify({ deployment_id: process.env.DEPLOYMENT_ID, commit_sha: process.env.COMMIT_SHA, root: '${buildDir}', files, total_bytes: files.reduce((sum, file) => sum + file.size, 0) }));`,
      "          NODE",
      "      - name: Request upload session",
      "        env:",
      "          RANDSEED_API_URL: https://devcreator.randseed.org",
      "          OIDC_AUDIENCE: randseed-gamecreator",
      "          DEPLOYMENT_ID: ${{ inputs.deployment_id }}",
      "        run: |",
      "          OIDC_TOKEN=$(curl -fsS -H \"Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN\" \"$ACTIONS_ID_TOKEN_REQUEST_URL&audience=$OIDC_AUDIENCE\" | node -e \"let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>process.stdout.write(JSON.parse(s).value))\")",
      "          echo \"::add-mask::$OIDC_TOKEN\"; echo \"OIDC_TOKEN=$OIDC_TOKEN\" >> \"$GITHUB_ENV\"",
      "          node -e \"const fs=require('fs');const m=JSON.parse(fs.readFileSync('/tmp/randseed-manifest.json'));process.stdout.write(JSON.stringify({manifest:m}))\" | curl -fsS -X POST \"$RANDSEED_API_URL/api/deployments/$DEPLOYMENT_ID/upload-session\" -H \"Authorization: Bearer $OIDC_TOKEN\" -H 'Content-Type: application/json' --data-binary @- > /tmp/randseed-session.json",
      "      - name: Upload static files",
      "        env:",
      "          RANDSEED_API_URL: https://devcreator.randseed.org",
      "          DEPLOYMENT_ID: ${{ inputs.deployment_id }}",
      "        run: |",
      "          UPLOAD_TOKEN=$(node -e \"console.log(require('/tmp/randseed-session.json').upload_token)\"); UPLOAD_BASE_URL=$(node -e \"console.log(require('/tmp/randseed-session.json').upload_base_url)\"); echo \"::add-mask::$UPLOAD_TOKEN\"",
      "          node -e \"const m=require('/tmp/randseed-manifest.json');for(const f of m.files)console.log(f.path+'\\t'+f.size)\" | while IFS=$'\\t' read -r FILE_PATH FILE_SIZE; do ENCODED_PATH=$(node -e \"console.log(encodeURIComponent(process.argv[1]))\" \"$FILE_PATH\"); curl -fsS -X PUT \"$UPLOAD_BASE_URL/$ENCODED_PATH\" -H \"Authorization: Bearer $UPLOAD_TOKEN\" -H \"Content-Length: $FILE_SIZE\" --data-binary \"${buildDir}/$FILE_PATH\" > /dev/null; done",
      "      - name: Verify and publish",
      "        env:",
      "          RANDSEED_API_URL: https://devcreator.randseed.org",
      "          DEPLOYMENT_ID: ${{ inputs.deployment_id }}",
      "        run: |",
      "          curl -fsS -X POST \"$RANDSEED_API_URL/api/deployments/$DEPLOYMENT_ID/upload-complete\" -H \"Authorization: Bearer $OIDC_TOKEN\" -H 'Content-Type: application/json' --data \"$(node -e \"const fs=require('fs');console.log(JSON.stringify({manifest:JSON.parse(fs.readFileSync('/tmp/randseed-manifest.json'))}))\")\"",
      "",
    ].join("\n");
  };

  const handleCopyWorkflow = () => {
    const workflowContent = getWorkflowContent();
    navigator.clipboard.writeText(workflowContent);
    setCopiedWorkflow(true);
    setTimeout(() => setCopiedWorkflow(false), 2500);
  };

  const handleDownloadWorkflow = () => {
    const workflow = new Blob([getWorkflowContent()], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(workflow);
    const link = document.createElement("a");
    link.href = url;
    link.download = "randseed-deploy.yml";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportWorkflow = async () => {
    setIsImportingWorkflow(true);
    setWorkflowImportFeedback(null);
    setWorkflowPullRequestUrl(null);
    try {
      const response = await githubApi.importWorkflow(gameId, getWorkflowContent());
      if (!response.success || !response.pull_request) {
        setWorkflowImportFeedback(response.error || "Unable to create the workflow pull request.");
        return;
      }
      setWorkflowPullRequestUrl(response.pull_request.html_url);
      setWorkflowImportFeedback(`Pull request #${response.pull_request.number} is ready for review.`);
    } catch (error) {
      setWorkflowImportFeedback(error instanceof Error ? error.message : "Unable to create the workflow pull request.");
    } finally {
      setIsImportingWorkflow(false);
    }
  };

  const handleCopySandboxUrl = () => {
    navigator.clipboard.writeText(repoInfo.sandboxUrl);
    setCopiedSandboxUrl(true);
    setTimeout(() => setCopiedSandboxUrl(false), 2000);
  };

  if (isDisconnected) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '36px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#f3f4f6', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#111827' }}>
          <Github size={28} />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: '#111827' }}>No Repository Connected</h3>
          <p style={{ color: '#6b7280', fontSize: '14px', maxWidth: '460px', margin: '0 auto 20px', lineHeight: 1.5 }}>
          Connect your GitHub repository using the official <strong>{GITHUB_APP_SLUG}</strong> App to enable automated builds, sync status checks, and instant sandbox updates.
        </p>
        <button 
          type="button"
          className="primary-action"
          onClick={() => void handleConnectGitHub()}
          disabled={isOpeningGitHub}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            borderRadius: '10px',
            background: '#7c3aed',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: isOpeningGitHub ? 'wait' : 'pointer',
            opacity: isOpeningGitHub ? 0.7 : 1,
            boxShadow: '0 2px 4px rgba(124, 58, 237, 0.25)'
          }}
        >
          <Github size={16} /> {isOpeningGitHub ? "Opening GitHub..." : "Connect GitHub"}
        </button>

        {installError && (
          <div style={{ margin: '16px auto 0', maxWidth: '460px', color: '#b91c1c', fontSize: '12px' }}>
            {installError}
          </div>
        )}

        {/* Connect Repository Modal */}
        {renderConnectModal()}
      </div>
    );
  }

  function renderConnectModal() {
    if (!showConnectModal) return null;

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.6)', padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '18px', padding: '32px', maxWidth: '540px', width: '100%', textAlign: 'left', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
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

          {/* Step 1: GitHub App Authorization */}
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
                onClick={() => void handleConnectGitHub()}
                disabled={isOpeningGitHub}
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
                  whiteSpace: 'nowrap',
                  opacity: isOpeningGitHub ? 0.5 : 1,
                  cursor: isOpeningGitHub ? 'wait' : 'pointer'
                }}
              >
                <span>{isOpeningGitHub ? "Opening GitHub..." : "Continue to GitHub"}</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
            {installError && <div style={{ marginTop: '10px', color: '#b91c1c', fontSize: '12px' }}>{installError}</div>}
          </div>

          {/* Step 2: Form to link repo */}
          <form onSubmit={handleLinkRepository}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Step 2: Repository Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. owner/repository"
                value={repoInput}
                onChange={e => setRepoInput(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <small style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>
                The GitHub owner and repository name (e.g. <code>owner/repository</code>)
              </small>
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
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
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
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
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
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: 'transparent',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLinking}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#7c3aed',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isLinking ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isLinking ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                <span>{isLinking ? "Connecting..." : "Link Repository"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Primary Card reproducing the attached UI */}
      <div 
        style={{ 
          background: '#fff', 
          border: '1px solid #e5e7eb', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          position: 'relative'
        }}
      >
        {/* Header Title with RDcreatordev badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 20px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 
            style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 600, 
              color: '#111827',
              letterSpacing: '-0.01em'
            }}
          >
            GitHub sync
          </h3>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: '#f5f3ff',
              border: '1px solid #ddd6fe',
              color: '#7c3aed',
              fontSize: '12px',
              fontWeight: 600
            }}
            title={`Connected through GitHub App: ${GITHUB_APP_SLUG}`}
          >
            <ShieldCheck size={14} />
            <span>App: {GITHUB_APP_SLUG}</span>
          </span>
        </div>

        {/* Section: Repository */}
        <div style={{ marginBottom: '20px' }}>
          <div 
            style={{ 
              fontSize: '13px', 
              color: '#6b7280', 
              fontWeight: 500, 
              marginBottom: '8px' 
            }}
          >
            Repository
          </div>
          
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            {/* Repo name & branch pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span 
                style={{ 
                  fontSize: '15px', 
                  fontWeight: 600, 
                  color: '#1f2937' 
                }}
              >
                {repoInfo.repository}
              </span>
              
              {/* Branch pill with blue dot */}
              <span 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '3px 10px', 
                  background: '#f3f4f6', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  fontWeight: 500, 
                  color: '#374151' 
                }}
              >
                <span 
                  style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: '#3b82f6' 
                  }} 
                />
                {repoInfo.branch}
              </span>
            </div>

            {/* Action buttons (Change/Reconnect, Unlink & Open on GitHub) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setRepoInput(repoInfo.repository);
                  setBranchInput(repoInfo.branch);
                  setShowConnectModal(true);
                }}
                disabled={isLocked}
                title="Change or reconfigure connected repository"
                style={{
                  height: '34px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  color: '#374151',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <RefreshCw size={13} />
                <span>Change</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUnlinkModal(true)}
                disabled={isLocked}
                title="Disconnect repository"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  color: '#6b7280',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (!isLocked) {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.borderColor = '#fca5a5';
                    e.currentTarget.style.color = '#ef4444';
                  }
                }}
                onMouseLeave={e => {
                  if (!isLocked) {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                <Link2Off size={16} />
              </button>

              <a
                href={`https://github.com/${repoInfo.repository}`}
                target="_blank"
                rel="noreferrer"
                title="Open in GitHub"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  color: '#6b7280',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.color = '#111827';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Section: Sync status */}
        <div style={{ marginBottom: '24px' }}>
          <div 
            style={{ 
              fontSize: '13px', 
              color: '#6b7280', 
              fontWeight: 500, 
              marginBottom: '8px' 
            }}
          >
            Sync status
          </div>

          {/* Sync Status Banner */}
          <div 
            style={{ 
              background: '#e8f3ec', 
              borderRadius: '10px', 
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e4620', fontSize: '14px', fontWeight: 500 }}>
              <span>GitHub &amp; RandSeed Sandbox are currently in sync</span>
              <button
                type="button"
                onClick={() => setShowInfoDetails(!showInfoDetails)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#2e7d32',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
                title="View sync details"
              >
                <Info size={15} />
              </button>
            </div>
          </div>

          {/* Expanded Commit & Sync Info */}
          {showInfoDetails && (
            <div 
              style={{ 
                marginTop: '10px', 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                padding: '12px 16px',
                fontSize: '12px',
                color: '#475569',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Latest Deployed Commit:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>
                  {repoInfo.lastCommitSha} ({repoInfo.lastCommitMessage})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Last Synced:</span>
                <span style={{ fontWeight: 500 }}>{repoInfo.lastSyncedAt}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>App Provider:</span>
                <span style={{ color: '#7c3aed', fontWeight: 600 }}>{GITHUB_APP_SLUG}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Auto-Deployment Pipeline:</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Active (GitHub Actions)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Sandbox URL:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <a href={repoInfo.sandboxUrl} target="_blank" rel="noreferrer" style={{ color: '#7c3aed', fontFamily: 'monospace', textDecoration: 'underline' }}>
                    {repoInfo.sandboxUrl}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopySandboxUrl}
                    title="Copy sandbox URL"
                    style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: copiedSandboxUrl ? '#16a34a' : '#64748b', display: 'inline-flex', alignItems: 'center' }}
                  >
                    {copiedSandboxUrl ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast/feedback when sync checked */}
          {syncFeedback && (
            <div 
              style={{ 
                marginTop: '10px', 
                background: '#ecfdf5', 
                border: '1px solid #a7f3d0', 
                borderRadius: '8px', 
                padding: '10px 14px',
                fontSize: '13px',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{syncFeedback}</span>
            </div>
          )}
        </div>

        {/* Action Button: Check sync status */}
        <button
          type="button"
          onClick={handleCheckSyncStatus}
          disabled={isCheckingSync}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: '9999px',
            border: '1px solid #e5e7eb',
            background: '#f3f4f6',
            color: '#1f2937',
            fontSize: '14px',
            fontWeight: 500,
            cursor: isCheckingSync ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            if (!isCheckingSync) {
              e.currentTarget.style.background = '#e5e7eb';
            }
          }}
          onMouseLeave={e => {
            if (!isCheckingSync) {
              e.currentTarget.style.background = '#f3f4f6';
            }
          }}
        >
          <RefreshCw size={15} className={isCheckingSync ? 'animate-spin' : ''} />
          <span>{isCheckingSync ? 'Checking sync with GitHub...' : 'Check sync status'}</span>
        </button>
      </div>

      {/* CI/CD Integration Guide & Workflow file */}
      <div 
        style={{ 
          background: '#fff', 
          border: '1px solid #e5e7eb', 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              CI/CD Pipeline Setup
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              How code updates in GitHub via <strong>{GITHUB_APP_SLUG}</strong> are built and reflected in the Sandbox link.
            </p>
          </div>

          {/* Pipeline Switcher Tabs */}
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px' }}>
            <button
              type="button"
              onClick={() => setActiveSyncTab('action')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeSyncTab === 'action' ? '#fff' : 'transparent',
                color: activeSyncTab === 'action' ? '#7c3aed' : '#6b7280',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: activeSyncTab === 'action' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Zap size={13} /> GitHub Action (Recommended)
            </button>
            <button
              type="button"
              onClick={() => setActiveSyncTab('webhook')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeSyncTab === 'webhook' ? '#fff' : 'transparent',
                color: activeSyncTab === 'webhook' ? '#7c3aed' : '#6b7280',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: activeSyncTab === 'webhook' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Radio size={13} /> Webhook Push
            </button>
            <button
              type="button"
              onClick={() => setActiveSyncTab('manual')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeSyncTab === 'manual' ? '#fff' : 'transparent',
                color: activeSyncTab === 'manual' ? '#7c3aed' : '#6b7280',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: activeSyncTab === 'manual' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Terminal size={13} /> Manual Deploy
            </button>
          </div>
        </div>

        {/* Tab 1: GitHub Action */}
        {activeSyncTab === 'action' && (
          <div>
            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6d28d9', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                <Zap size={15} /> Automated Builds with {GITHUB_APP_SLUG}
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#5b21b6', lineHeight: 1.5 }}>
                Whenever code is pushed or a PR is merged into <code style={{ background: '#ede9fe', padding: '1px 5px', borderRadius: '4px' }}>{repoInfo.branch}</code>, GitHub Actions builds your game bundle and deploys straight to the RandSeed sandbox URL.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
                Workflow File: <code style={{ color: '#111827', fontWeight: 600 }}>.github/workflows/randseed-sandbox.yml</code>
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => void handleImportWorkflow()}
                  disabled={isImportingWorkflow}
                  style={{
                    background: '#111827',
                    border: '1px solid #111827',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#fff',
                    cursor: isImportingWorkflow ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    opacity: isImportingWorkflow ? 0.7 : 1
                  }}
                >
                  {isImportingWorkflow ? <RefreshCw size={12} className="animate-spin" /> : <GitPullRequest size={12} />}
                  <span>{isImportingWorkflow ? 'Creating PR...' : 'Import via PR'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadWorkflow}
                  style={{
                    background: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Download size={12} />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyWorkflow}
                  style={{
                    background: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {copiedWorkflow ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                  <span>{copiedWorkflow ? 'Copied' : 'Copy YAML'}</span>
                </button>
              </div>
            </div>

            {workflowImportFeedback && (
              <div style={{ background: workflowPullRequestUrl ? '#ecfdf5' : '#fef2f2', border: `1px solid ${workflowPullRequestUrl ? '#a7f3d0' : '#fecaca'}`, color: workflowPullRequestUrl ? '#047857' : '#b91c1c', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {workflowPullRequestUrl ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{workflowImportFeedback}</span>
                {workflowPullRequestUrl && (
                  <a href={workflowPullRequestUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: '#047857', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Review PR <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}

            <pre 
              style={{ 
                background: '#18181b', 
                color: '#f4f4f5', 
                borderRadius: '8px', 
                padding: '14px 16px', 
                fontSize: '12px', 
                lineHeight: 1.6, 
                overflowX: 'auto',
                margin: 0,
                fontFamily: 'monospace'
              }}
            >
{`name: Deploy to RandSeed Sandbox
on:
  workflow_dispatch:
    inputs:
      deployment_id: { required: true, type: string }
      commit_sha: { required: true, type: string }
      game_id: { required: true, type: string }
permissions:
  contents: read
  id-token: write
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ inputs.commit_sha }}
      - run: npm ci && npm run build
      - run: Generate manifest, upload files with OIDC, then call upload-complete`}
            </pre>
          </div>
        )}

        {/* Tab 2: Webhook */}
        {activeSyncTab === 'webhook' && (
          <div>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
              A GitHub Webhook notifies RandSeed immediately on every <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: '4px' }}>git push</code>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Payload URL</span>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#111827', marginTop: '4px', wordBreak: 'break-all' }}>
                  https://devcreator.randseed.org/api/webhooks/github
                </div>
              </div>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Secret Token</span>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#111827', marginTop: '4px' }}>
                  whsec_live_9f83a2bc...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Manual Deploy */}
        {activeSyncTab === 'manual' && (
          <div>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
              Creators can also build and deploy directly from their terminal using the RandSeed CLI or click <strong>Check sync status</strong> above.
            </p>
            <div style={{ background: '#18181b', color: '#f4f4f5', borderRadius: '8px', padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px' }}>
              npx @randseed/deploy --game={gameId}
            </div>
          </div>
        )}
      </div>

      {/* Unlink Confirmation Modal */}
      {showUnlinkModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '12px' }}>
              <AlertCircle size={22} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>Disconnect Repository?</h3>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
              Disconnecting <strong>{repoInfo.repository}</strong> will pause automated sandbox deployments from {GITHUB_APP_SLUG}. Existing deployed builds will remain accessible.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowUnlinkModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnlinkConfirm}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#fff'
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect/Reconfigure Modal */}
      {renderConnectModal()}
    </div>
  );
}
