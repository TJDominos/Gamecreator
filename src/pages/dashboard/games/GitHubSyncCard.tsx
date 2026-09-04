import React, { useState } from "react";
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
  Play, 
  Terminal,
  FileCode,
  AlertCircle
} from "lucide-react";
import { GameRepoInfo } from "./gameData";

interface GitHubSyncCardProps {
  gameId: string;
  gameName: string;
  initialRepoInfo?: GameRepoInfo;
  isLocked?: boolean;
}

export function GitHubSyncCard({
  gameId,
  gameName,
  initialRepoInfo,
  isLocked = false
}: GitHubSyncCardProps): React.ReactElement {
  const [repoInfo, setRepoInfo] = useState<GameRepoInfo>(
    initialRepoInfo || {
      repository: "TJDominos/Gamecreator",
      branch: "main",
      lastCommitSha: "a4f29cb",
      lastCommitMessage: "Fix collision bugs and particle effects",
      lastSyncedAt: "2 mins ago",
      isSynced: true,
      syncMethod: "github_action",
      sandboxUrl: `https://randseed.org/sandbox/${gameId}`
    }
  );

  const [isCheckingSync, setIsCheckingSync] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showInfoDetails, setShowInfoDetails] = useState(false);
  const [activeSyncTab, setActiveSyncTab] = useState<'action' | 'webhook' | 'manual'>('action');
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [copiedSandboxUrl, setCopiedSandboxUrl] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);

  const handleCheckSyncStatus = () => {
    setIsCheckingSync(true);
    setSyncFeedback(null);

    setTimeout(() => {
      setIsCheckingSync(false);
      setRepoInfo(prev => ({
        ...prev,
        isSynced: true,
        lastSyncedAt: "Just now",
        lastCommitSha: "c8e170f",
        lastCommitMessage: "Update player physics and sandbox camera boundaries"
      }));
      setSyncFeedback("Sync verified! Sandbox is up-to-date with latest commit c8e170f on main.");
      setTimeout(() => setSyncFeedback(null), 5000);
    }, 1200);
  };

  const handleCopyWorkflow = () => {
    const workflowContent = `name: Deploy to RandSeed Sandbox

on:
  push:
    branches: [ ${repoInfo.branch} ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install & Build
        run: |
          npm ci
          npm run build

      - name: Deploy to RandSeed Sandbox
        uses: randseed-org/sandbox-deploy-action@v1
        with:
          game-id: '${gameId}'
          api-token: \${{ secrets.RANDSEED_API_TOKEN }}
          build-dir: 'dist'
`;
    navigator.clipboard.writeText(workflowContent);
    setCopiedWorkflow(true);
    setTimeout(() => setCopiedWorkflow(false), 2500);
  };

  const handleCopySandboxUrl = () => {
    navigator.clipboard.writeText(repoInfo.sandboxUrl);
    setCopiedSandboxUrl(true);
    setTimeout(() => setCopiedSandboxUrl(false), 2000);
  };

  if (isDisconnected) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
        <Github size={48} style={{ margin: '0 auto 16px', color: 'var(--portal-ink)' }} />
        <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>GitHub Repository Disconnected</h3>
        <p style={{ color: 'var(--portal-muted)', fontSize: '13px', maxWidth: '420px', margin: '0 auto 20px' }}>
          Reconnect your repository to enable automated builds, sync status checks, and instant sandbox updates.
        </p>
        <button 
          className="primary-action"
          onClick={() => {
            setIsDisconnected(false);
            setRepoInfo(prev => ({ ...prev, isSynced: true }));
          }}
        >
          Connect GitHub Repository
        </button>
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
        {/* Header Title */}
        <h3 
          style={{ 
            margin: '0 0 20px', 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#111827',
            letterSpacing: '-0.01em'
          }}
        >
          GitHub sync
        </h3>

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

            {/* Action buttons (Unlink & Open on GitHub) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                <span style={{ color: '#64748b' }}>Auto-Deployment Pipeline:</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Active (GitHub Actions)</span>
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

        {/* Action Button: Check sync status (Full-width matching image) */}
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

      {/* Live Sandbox Quick Access Bar */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #2b1f3d 0%, #171124 100%)', 
          borderRadius: '16px', 
          padding: '20px 24px', 
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f3f4f6' }}>Live Sandbox Environment</h4>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
            Creators and testers can instantly play the latest build deployed from <code style={{ color: '#cba8f3', fontFamily: 'monospace' }}>{repoInfo.branch}</code>.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleCopySandboxUrl}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '8px 14px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {copiedSandboxUrl ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            <span>{copiedSandboxUrl ? 'Copied' : 'Copy Link'}</span>
          </button>

          <a
            href={repoInfo.sandboxUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#8b5cf6',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
            }}
          >
            <Play size={14} fill="#fff" />
            <span>Open Sandbox</span>
          </a>
        </div>
      </div>

      {/* CI/CD & Deployment Pipeline Strategy Guide */}
      <div 
        style={{ 
          background: '#fff', 
          border: '1px solid #e5e7eb', 
          borderRadius: '16px', 
          padding: '24px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              Automatic Deployment Strategy
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              How code updates in GitHub are built and reflected in the Sandbox link.
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

        {/* Tab 1: GitHub Action (The Best Practice) */}
        {activeSyncTab === 'action' && (
          <div>
            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6d28d9', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                <Zap size={15} /> Best Architecture for Sandbox Previews
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#5b21b6', lineHeight: 1.5 }}>
                GitHub Actions handles npm build dependencies in GitHub's isolated cloud runners. 
                Whenever you push code or merge a PR into <code style={{ background: '#ede9fe', padding: '1px 5px', borderRadius: '4px' }}>{repoInfo.branch}</code>, the workflow tests your bundle and pushes artifacts straight to the Sandbox URL. Creators can immediately review changes without platform build queue latency.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
                Workflow File: <code style={{ color: '#111827', fontWeight: 600 }}>.github/workflows/randseed-sandbox.yml</code>
              </span>
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
                <span>{copiedWorkflow ? 'Copied' : 'Copy Workflow'}</span>
              </button>
            </div>

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
  push:
    branches: [ ${repoInfo.branch} ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm run build
      - uses: randseed-org/sandbox-deploy-action@v1
        with:
          game-id: '${gameId}'
          api-token: \${{ secrets.RANDSEED_API_TOKEN }}
          build-dir: 'dist'`}
            </pre>
          </div>
        )}

        {/* Tab 2: Webhook */}
        {activeSyncTab === 'webhook' && (
          <div>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
              A GitHub Webhook notifies RandSeed immediately on every <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: '4px' }}>git push</code>. RandSeed's server pulls the commit, installs dependencies, and serves the build.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Payload URL</span>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#111827', marginTop: '4px', wordBreak: 'break-all' }}>
                  https://api.randseed.org/v1/webhooks/github
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '12px' }}>
              <AlertCircle size={22} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>Disconnect Repository?</h3>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
              Disconnecting <strong>{repoInfo.repository}</strong> will pause automatic sandbox builds. Existing deployed builds will remain accessible.
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
                onClick={() => {
                  setShowUnlinkModal(false);
                  setIsDisconnected(true);
                }}
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
    </div>
  );
}
