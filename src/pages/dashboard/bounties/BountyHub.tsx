import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Target, Trophy, Clock, PlayCircle, Lock, Users, Activity } from 'lucide-react';
import { MOCK_BOUNTIES, BountyState, Category } from './bountyData';

const StateStyles: Record<BountyState, { bg: string, color: string, icon: any, label: string }> = {
  OPEN: { bg: '#e6f6ec', color: '#1e874b', icon: Clock, label: 'Open for Subscription' },
  RUNNING: { bg: '#e0e7ff', color: '#4f46e5', icon: PlayCircle, label: 'Running / Development' },
  ONLINE: { bg: '#fff1d9', color: '#8a5314', icon: Activity, label: 'Online / Traffic Battle' },
  CLOSED: { bg: '#f2f0f3', color: '#6b7280', icon: Lock, label: 'Closed / Settled' }
};

export function BountyHub(): React.ReactElement {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<BountyState | 'ALL'>('ALL');
  
  // Mocking "My Participated Bounties" for the current creator
  // In a real application, this would fetch from /api/users/me/bounties
  const myParticipatedBounties = MOCK_BOUNTIES.slice(0, 3); // Simulating participation in the first 3 bounties

  const filtered = filter === 'ALL' ? myParticipatedBounties : myParticipatedBounties.filter(b => b.state === filter);
  
  // Group by category
  const categories = Array.from(new Set(filtered.map(b => b.category)));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Target size={28} color="var(--portal-purple)" /> My Bounties
          </h1>
          <p style={{ color: 'var(--portal-muted)', margin: 0, fontSize: '15px', maxWidth: '600px' }}>
            Track the bounties you have participated in, monitor your submission status, and see your rank in active traffic battles.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', background: '#f9f9f9', padding: '6px', borderRadius: '8px', border: '1px solid var(--portal-border)' }}>
          {['ALL', 'OPEN', 'RUNNING', 'ONLINE', 'CLOSED'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: filter === f ? '#fff' : 'transparent',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                color: filter === f ? 'var(--portal-ink)' : 'var(--portal-muted)',
                fontWeight: filter === f ? 600 : 500,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {categories.map(cat => (
          <div key={cat}>
            <h2 style={{ 
              fontSize: '20px', 
              margin: '0 0 16px', 
              paddingBottom: '12px', 
              borderBottom: '2px solid var(--portal-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {cat} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--portal-muted)', background: '#f2f0f3', padding: '2px 8px', borderRadius: '12px' }}>{filtered.filter(b => b.category === cat).length}</span>
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {filtered.filter(b => b.category === cat).map(bounty => {
                const s = StateStyles[bounty.state];
                const SIcon = s.icon;
                return (
                  <div 
                    key={bounty.id} 
                    style={{ 
                      background: '#fff', 
                      border: '1px solid var(--portal-border)', 
                      borderRadius: '12px', 
                      padding: '24px',
                      display: 'flex',
                      gap: '24px',
                      alignItems: 'center',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--portal-purple)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(113, 89, 219, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--portal-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => navigate(`/dashboard/bounties/${bounty.id}`)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <SIcon size={14} /> {s.label}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '18px', margin: '0 0 8px' }}>{bounty.title}</h3>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--portal-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {bounty.description}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        {bounty.tags.map(tag => (
                          <span key={tag} style={{ background: '#f2f0f3', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: 'var(--portal-ink)', fontFamily: 'monospace' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderLeft: '1px solid var(--portal-border)', paddingLeft: '24px', minWidth: '180px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--portal-muted)', display: 'block', marginBottom: '4px' }}>Prize Pool</span>
                        <span style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Trophy size={20} color="#f59e0b" />
                          {bounty.currency === 'USD' ? '$' : ''}{bounty.prizePool.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--portal-muted)' }}>{bounty.currency}</span>
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--portal-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12}/> Subs</span>
                          <strong style={{ fontSize: '14px' }}>{bounty.subscriptions}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--portal-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={12}/> Online</span>
                          <strong style={{ fontSize: '14px' }}>{bounty.onlineGames}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--portal-muted)' }}>
            No bounties found for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
