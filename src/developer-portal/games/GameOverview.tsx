import React from "react";
import { Users, Activity, CircleDollarSign, Terminal, Settings2, Bell } from "lucide-react";
import { useParams, useOutletContext } from "react-router";
import { GameStatus, StatusLabels } from "./GameConsole";

export function GameOverview(): React.ReactElement {
  const { gameId } = useParams();
  const { status } = useOutletContext<{ status: GameStatus, setStatus: (s: GameStatus) => void }>();
  const isProfileLocked = ['PENDING_REVIEW', 'APPROVED', 'PUBLIC_ACTIVE', 'MAINTENANCE', 'ARCHIVED'].includes(status);
  
  return (
    <div>
      {/* Feedback Notification */}
      {['PRIVATE_TESTING', 'PUBLIC_ACTIVE'].includes(status) && (
        <a 
          href={`https://randseed.org/sandbox/${gameId}?tab=feedback`} 
          target="_blank" 
          rel="noreferrer" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: '#e0e7ff', 
            border: '1px solid #c7d2fe', 
            borderRadius: '8px', 
            padding: '10px 16px', 
            marginBottom: '24px', 
            textDecoration: 'none',
            color: '#312e81',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#d0d9ff'; e.currentTarget.style.borderColor = '#b3c3ff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.borderColor = '#c7d2fe'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} color="#4f46e5" />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>3 New Feedbacks</span>
          </div>
          <span style={{ fontSize: '13px', color: '#4f46e5', fontWeight: 600 }}>View &rarr;</span>
        </a>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--portal-muted)', fontSize: '13px', marginBottom: '12px' }}>
            <Activity size={16} /> Current Version
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{status === 'DRAFT' ? '-' : 'v1.2.0'}</div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--portal-muted)' }}>Status: {StatusLabels[status]}</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--portal-muted)', fontSize: '13px', marginBottom: '12px' }}>
            <Users size={16} /> Traffic & Players
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 700 }}>1,204</span>
            <span style={{ fontSize: '13px', color: 'var(--portal-muted)' }}>players</span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#167c73' }}>2,500 total visitors</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--portal-muted)', fontSize: '13px', marginBottom: '12px' }}>
            <CircleDollarSign size={16} /> Revenue & Balance
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700 }}>$120.00</span>
              <span style={{ fontSize: '13px', color: 'var(--portal-muted)' }}>avail</span>
            </div>
            <button style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--portal-purple)', background: 'var(--portal-purple-soft)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Withdraw
            </button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--portal-muted)' }}>Total Rev: $342.00 | Escrow: $50.00</p>
        </div>
      </div>

      <div style={{ marginTop: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Storefront Profile</h2>
        <p style={{ color: 'var(--portal-muted)', fontSize: '14px', marginBottom: '24px' }}>
          Manage how your game appears in the RandSeed catalog.
        </p>

        <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '24px', opacity: isProfileLocked ? 0.7 : 1, pointerEvents: isProfileLocked ? 'none' : 'auto' }}>
          <div className="onboarding-form">
            <div className="field--wide">
              <span>Short Description</span>
              <textarea rows={3} placeholder="A brief summary of your game..." defaultValue="A fast-paced neon platformer." disabled={isProfileLocked} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px', fontSize: '13px' }}></textarea>
            </div>
            
            <div className="field">
              <span>Cover Image URL</span>
              <input type="text" placeholder="https://..." defaultValue="https://assets.randseed.org/neon-dash-cover.jpg" disabled={isProfileLocked} />
            </div>

            <div className="field">
              <span>Gameplay Animation / Video URL</span>
              <input type="text" placeholder="https://..." defaultValue="https://assets.randseed.org/neon-dash-trailer.mp4" disabled={isProfileLocked} />
            </div>

            <div className="onboarding-actions" style={{ marginTop: '24px' }}>
              <button className="primary-action" disabled={isProfileLocked}>Save Profile</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--portal-ink)', color: '#fff', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Terminal size={20} /> Initialize Context Locally</h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)', maxWidth: '500px' }}>
            To start developing, initialize the RandSeed SDK and machine-reference context in your project root.
          </p>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 20px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
          npx @randseed/agent-init
        </div>
      </div>
    </div>
  );
}
