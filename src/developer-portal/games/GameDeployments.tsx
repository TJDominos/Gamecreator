import React, { useState } from "react";
import { GitCommit, ExternalLink, ShieldCheck, Globe, Clock, Rocket, Settings2 } from "lucide-react";
import { useOutletContext } from "react-router";
import { GameStatus, StatusLabels } from "./GameConsole";

const MOCK_DEPLOYMENTS = [
  { id: "dep_003", commit: "a4f29cb", message: "Fix collision bugs", date: "2 mins ago", status: "Sandbox", rating: "4.8" },
  { id: "dep_002", commit: "7b1c3a8", message: "Update boss mechanics", date: "2 days ago", status: "In Review", rating: "4.5" },
  { id: "dep_001", commit: "9f0d1e2", message: "Initial release candidate", date: "1 week ago", status: "Approved", rating: "4.9" },
];

export function GameDeployments(): React.ReactElement {
  const [privateLinkModal, setPrivateLinkModal] = useState<string | null>(null);
  const { status, setStatus } = useOutletContext<{ status: GameStatus, setStatus: (s: GameStatus) => void }>();

  return (
    <div>
      {/* Developer Control Panel */}
      <div style={{ background: '#fbfafc', border: '1px dashed var(--portal-purple)', borderRadius: '12px', padding: '16px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--portal-purple-soft)', color: 'var(--portal-purple)', padding: '8px', borderRadius: '8px' }}><Settings2 size={20} /></div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--portal-purple)' }}>Status Overrider (Developer Mode)</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--portal-muted)' }}>Manually step through the deployment status machine for testing permissions.</p>
          </div>
        </div>
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value as GameStatus)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--portal-border)', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
        >
          {Object.entries(StatusLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', margin: '0 0 8px' }}>Deployments & Versions</h2>
          <p style={{ color: 'var(--portal-muted)', fontSize: '14px', margin: 0 }}>Manage Sandbox builds, generate private test links, and submit for audit.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {MOCK_DEPLOYMENTS.map(dep => (
          <div key={dep.id} style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f2f0f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--portal-muted)' }}>
                  <GitCommit size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {dep.message}
                    <span className="status-pill" style={
                      dep.status === 'Approved' ? { background: '#e6f6ec', color: '#1e874b' } :
                      dep.status === 'In Review' ? { background: '#fff1d9', color: '#8a5314' } :
                      { background: '#eef2ff', color: '#4f46e5' }
                    }>{dep.status}</span>
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--portal-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {dep.date}</span>
                    <span style={{ fontFamily: 'monospace' }}>{dep.commit}</span>
                    <span>⭐ {dep.rating} (Playtest)</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {dep.status === 'Sandbox' && (
                  <>
                    <button className="primary-action" style={{ background: 'transparent', color: 'var(--portal-purple)', border: '1px solid var(--portal-purple)' }} onClick={() => setPrivateLinkModal(dep.id)}>
                      <ExternalLink size={16} /> Private Link
                    </button>
                    <button className="primary-action">
                      <ShieldCheck size={16} /> Submit Audit
                    </button>
                  </>
                )}
                {dep.status === 'In Review' && (
                  <button className="primary-action" disabled style={{ opacity: 0.5 }}>
                    <Clock size={16} /> Under Review
                  </button>
                )}
                {dep.status === 'Approved' && (
                  <button className="primary-action" style={{ background: '#1e874b', color: '#fff' }}>
                    <Globe size={16} /> Publish to Public
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
              Generate a secure, sharable link for closed testing without public listing. No player limits.
            </p>
            <div className="onboarding-form">
              <div className="field">
                <span>Link Validity</span>
                <select style={{ width: '100%', padding: '11px 12px', background: '#fbfafc', border: '1px solid #dcd7e0', borderRadius: '9px', fontSize: '12px' }}>
                  <option>7 Days</option>
                  <option>30 Days</option>
                  <option>Permanent</option>
                </select>
              </div>
              <div className="field">
                <span>Token Asset Mode</span>
                <select style={{ width: '100%', padding: '11px 12px', background: '#fbfafc', border: '1px solid #dcd7e0', borderRadius: '9px', fontSize: '12px' }}>
                  <option>Real Gcoin / Bonus</option>
                  <option>Test Tokens Only</option>
                </select>
              </div>
              <div className="field--wide" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input type="checkbox" id="require-login" defaultChecked style={{ width: '16px' }} />
                <label htmlFor="require-login" style={{ fontSize: '13px' }}>Require RandSeed login to play and earn milestone rewards</label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button style={{ padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--portal-muted)' }} onClick={() => setPrivateLinkModal(null)}>Cancel</button>
              <button className="primary-action" onClick={() => {
                alert("Generated: randseed.org/preview/neon-dash?token=eyJhbGci...");
                setPrivateLinkModal(null);
              }}>
                Generate Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
