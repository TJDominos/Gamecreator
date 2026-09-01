import React, { useState } from 'react';
import { Target, Plus, Search, Filter, Trophy, Settings, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { MOCK_BOUNTIES, BountyState, Category } from './bountyData';

export function BountyManagement(): React.ReactElement {
  const [bounties, setBounties] = useState(MOCK_BOUNTIES);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={28} color="var(--portal-purple)" />
              Bounty Admin Console
            </h1>
            <p style={{ color: 'var(--portal-muted)', margin: 0, fontSize: '14px' }}>
              Manage creator tracks, review states, and audit submissions.
            </p>
          </div>
          
          <button 
            className="primary-action" 
            onClick={() => setIsCreating(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Create New Bounty
          </button>
        </header>

        {isCreating && (
          <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 24px' }}>Create New Track</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="field">
                <span>Bounty Title</span>
                <input type="text" placeholder="e.g. Next-Gen Arcade Challenge" style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }} />
              </div>
              <div className="field">
                <span>Category</span>
                <select style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }}>
                  <option>Arcade</option>
                  <option>Casino</option>
                  <option>Puzzle</option>
                  <option>Strategy</option>
                </select>
              </div>
              <div className="field--wide" style={{ gridColumn: 'span 2' }}>
                <span>Description & Rules</span>
                <textarea rows={3} placeholder="Describe the bounty requirements..." style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }}></textarea>
              </div>
              <div className="field">
                <span>Prize Pool (WLT)</span>
                <input type="number" placeholder="100000" style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }} />
              </div>
              <div className="field">
                <span>Binding Tag</span>
                <input type="text" placeholder="#Tag" style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setIsCreating(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--portal-border)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setIsCreating(false)} style={{ padding: '10px 20px', background: 'var(--portal-ink)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Publish Bounty</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Active Bounties</h3>
            <div style={{ display: 'flex', gap: '8px', color: 'var(--portal-muted)' }}>
              <Filter size={18} /> <Search size={18} />
            </div>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', color: 'var(--portal-muted)' }}>ID / Title</th>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', color: 'var(--portal-muted)' }}>Category</th>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', color: 'var(--portal-muted)' }}>State</th>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', color: 'var(--portal-muted)' }}>Prize Pool</th>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', color: 'var(--portal-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bounties.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--portal-border)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{b.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--portal-muted)', fontFamily: 'monospace' }}>{b.id}</div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px' }}>
                    {b.category}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      padding: '4px 8px', 
                      borderRadius: '6px',
                      background: b.state === 'OPEN' ? '#e6f6ec' : b.state === 'RUNNING' ? '#e0e7ff' : b.state === 'ONLINE' ? '#fff1d9' : '#f2f0f3',
                      color: b.state === 'OPEN' ? '#1e874b' : b.state === 'RUNNING' ? '#4f46e5' : b.state === 'ONLINE' ? '#8a5314' : '#6b7280'
                    }}>
                      {b.state}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 500 }}>
                    {b.currency === 'USD' ? '$' : ''}{b.prizePool.toLocaleString()} {b.currency}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <button style={{ 
                      padding: '6px 12px', 
                      background: '#fff', 
                      border: '1px solid var(--portal-border)', 
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      Advance State <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
