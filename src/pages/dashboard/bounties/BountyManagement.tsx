import React, { useState } from 'react';
import { Target, Plus, Search, Filter, ShieldCheck, ArrowRight, ArrowLeft, Image as ImageIcon, Trash2 } from 'lucide-react';
import { MOCK_BOUNTIES, Bounty, Category } from './bountyData';

const CATEGORIES: Category[] = ['Casino', 'Puzzle', 'Card & Board', 'Simulation', 'Arcade', 'Strategy', 'Word', 'Trivia', 'Role-Playing', 'Sports', 'Music'];

export function BountyManagement(): React.ReactElement {
  const [bounties, setBounties] = useState<Bounty[]>(MOCK_BOUNTIES);
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'participants'>('list');
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    category: 'Arcade' as Category,
    shortDesc: '',
    fullDesc: '',
    thumbnailUrl: '',
    poolAmount: 0,
    currency: 'WLT' as 'WLT' | 'USD',
    maxParticipants: 100,
    participationEndDate: '',
    releaseDate: '',
    distributionDate: '',
    settlementRules: 'Default Distribution Algorithm',
    examples: [{ type: 'image', url: '', thumbnail: '' }]
  });

  const handleEdit = (b: Bounty) => {
    setSelectedBounty(b);
    setForm({
      title: b.title,
      category: b.category,
      shortDesc: b.description,
      fullDesc: b.fullDescription || '',
      thumbnailUrl: '', // Mock data doesn't have it directly mapped to a thumbnail field on root yet
      poolAmount: b.prizePool,
      currency: b.currency,
      maxParticipants: 100, // Default mock
      participationEndDate: b.deadline.split('T')[0],
      releaseDate: '',
      distributionDate: b.battleEnd ? b.battleEnd.split('T')[0] : '',
      settlementRules: 'Default Distribution Algorithm',
      examples: b.examples ? b.examples.map(ex => ({ type: 'web', url: ex.url, thumbnail: ex.thumbnail })) : []
    });
    setView('edit');
  };

  const handleSave = () => {
    // Word limit checks
    if (form.title.split(' ').length > 10) {
      alert("Title must be max 10 words.");
      return;
    }
    if (form.shortDesc.split(' ').length > 50) {
      alert("Short description must be max 50 words.");
      return;
    }
    
    // In a real app, this would make an API call.
    alert(`Bounty Saved: ${form.title}`);
    setView('list');
  };

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={28} color="var(--portal-purple)" />
              Platform Admin - Bounty Management
            </h1>
            <p style={{ color: 'var(--portal-muted)', margin: 0, fontSize: '14px' }}>
              Create, modify, and finalize Creator Bounties.
            </p>
          </div>
          
          {view === 'list' && (
            <button 
              className="primary-action" 
              onClick={() => {
                setForm({
                  title: '', category: 'Arcade', shortDesc: '', fullDesc: '', thumbnailUrl: '',
                  poolAmount: 0, currency: 'WLT', maxParticipants: 100, participationEndDate: '',
                  releaseDate: '', distributionDate: '', settlementRules: 'Default Distribution Algorithm',
                  examples: [{ type: 'image', url: '', thumbnail: '' }]
                });
                setView('create');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Create New Bounty
            </button>
          )}
        </header>

        {(view === 'create' || view === 'edit') && (
          <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
            <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--portal-muted)', marginBottom: '24px', padding: 0 }}>
              <ArrowLeft size={16} /> Back to List
            </button>
            <h2 style={{ fontSize: '20px', margin: '0 0 24px' }}>{view === 'create' ? 'Create New Bounty' : 'Edit Bounty'}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              <div className="field">
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Bounty Title <small style={{ fontWeight: 'normal', color: 'var(--portal-muted)' }}>(Max 10 words)</small></span>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }} />
              </div>
              
              <div className="field">
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Game Category</span>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value as Category})} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px', backgroundColor: '#fff' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="field--wide" style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Short Description <small style={{ fontWeight: 'normal', color: 'var(--portal-muted)' }}>(Max 50 words)</small></span>
                <textarea rows={2} value={form.shortDesc} onChange={e => setForm({...form, shortDesc: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }}></textarea>
              </div>

              <div className="field--wide" style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Thumbnail URL <small style={{ fontWeight: 'normal', color: 'var(--portal-muted)' }}>(Supports .png, .jpg, .webp, .mp4 | 480x270 or 1920x1080)</small></span>
                <input type="url" placeholder="https://" value={form.thumbnailUrl} onChange={e => setForm({...form, thumbnailUrl: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }} />
              </div>

              <div className="field--wide" style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Full Description (Markdown)</span>
                <textarea rows={6} value={form.fullDesc} onChange={e => setForm({...form, fullDesc: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px', fontFamily: 'monospace' }}></textarea>
              </div>

              <div className="field">
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Bounty Pool Amount</span>
                <input type="number" value={form.poolAmount} onChange={e => setForm({...form, poolAmount: Number(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }} />
              </div>
              
              <div className="field">
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Currency</span>
                <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value as 'WLT' | 'USD'})} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <option value="WLT">WLT</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="field">
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Max Participants</span>
                <input type="number" value={form.maxParticipants} onChange={e => setForm({...form, maxParticipants: Number(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }} />
              </div>

              <div className="field">
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Participation End Date</span>
                <input type="date" value={form.participationEndDate} onChange={e => setForm({...form, participationEndDate: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }} />
              </div>
              
              <div className="field">
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Release Date</span>
                <input type="date" value={form.releaseDate} onChange={e => setForm({...form, releaseDate: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }} />
              </div>
              
              <div className="field">
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Distribution Date</span>
                <input type="date" value={form.distributionDate} onChange={e => setForm({...form, distributionDate: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }} />
              </div>

              <div className="field--wide" style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Settlement Rules</span>
                <div style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb', color: 'var(--portal-muted)', fontSize: '14px' }}>
                  Default Distribution Algorithm (Auto-managed by platform, cannot be modified)
                </div>
              </div>

              <div className="field--wide" style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Game Examples
                  <button type="button" onClick={() => setForm({...form, examples: [...form.examples, { type: 'web', name: '', url: '', thumbnail: '' }]})} style={{ background: 'none', border: 'none', color: 'var(--portal-purple)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add Example
                  </button>
                </span>
                
                {form.examples.map((ex, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr 40px', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                    <select value={ex.type} onChange={e => {
                      const newEx = [...form.examples];
                      newEx[i].type = e.target.value;
                      setForm({...form, examples: newEx});
                    }} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #dcd7e0', backgroundColor: '#fff' }}>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="web">Web Link</option>
                    </select>
                    <input type="text" placeholder="Game Name" value={(ex as any).name || ''} onChange={e => {
                      const newEx = [...form.examples];
                      (newEx[i] as any).name = e.target.value;
                      setForm({...form, examples: newEx});
                    }} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #dcd7e0' }} />
                    <input type="text" placeholder="URL Link" value={ex.url} onChange={e => {
                      const newEx = [...form.examples];
                      newEx[i].url = e.target.value;
                      setForm({...form, examples: newEx});
                    }} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #dcd7e0' }} />
                    <input type="text" placeholder="Thumbnail URL" value={ex.thumbnail} onChange={e => {
                      const newEx = [...form.examples];
                      newEx[i].thumbnail = e.target.value;
                      setForm({...form, examples: newEx});
                    }} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #dcd7e0' }} />
                    <button type="button" onClick={() => {
                      const newEx = [...form.examples];
                      newEx.splice(i, 1);
                      setForm({...form, examples: newEx});
                    }} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', height: '38px', width: '38px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--portal-border)' }}>
              {view === 'edit' && (
                 <button style={{ padding: '12px 24px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                   Force End Bounty
                 </button>
              )}
              <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                <button onClick={() => setView('list')} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--portal-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button onClick={handleSave} style={{ padding: '12px 24px', background: 'var(--portal-ink)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>{view === 'create' ? 'Publish Bounty' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        )}

        {view === 'participants' && selectedBounty && (
          <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
            <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--portal-muted)', marginBottom: '24px', padding: 0 }}>
              <ArrowLeft size={16} /> Back to List
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', margin: 0 }}>Participants: {selectedBounty.title}</h2>
              <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                {selectedBounty.subscriptions} Subscribed
              </span>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--portal-border)', color: 'var(--portal-muted)', fontSize: '13px' }}>Time Rank</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--portal-border)', color: 'var(--portal-muted)', fontSize: '13px' }}>Creator</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--portal-border)', color: 'var(--portal-muted)', fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--portal-border)', color: 'var(--portal-muted)', fontSize: '13px' }}>Submission Link</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--portal-border)', color: 'var(--portal-muted)', fontSize: '13px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedBounty.participants?.slice(0, 10).map((p, index) => {
                   const isWinner = selectedBounty.winners?.find(w => w.creator.id === p.id);
                   const isPublished = selectedBounty.publishedGames?.find(pub => pub.creator.id === p.id);
                   let status = 'Subscribed';
                   let statusColor = '#6b7280';
                   let statusBg = '#f3f4f6';
                   
                   if (isWinner) {
                     status = 'Winner';
                     statusColor = '#9a3412';
                     statusBg = '#ffedd5';
                   } else if (isPublished) {
                     status = 'Published';
                     statusColor = '#1e874b';
                     statusBg = '#e6f6ec';
                   }

                   return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--portal-border)' }}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>#{index + 1}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={p.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e5e7eb' }} />
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: statusColor, background: statusBg }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        {isPublished ? <a href="#" style={{ color: 'var(--portal-purple)', textDecoration: 'none' }}>View Game</a> : '-'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {status === 'Published' && selectedBounty.state === 'ONLINE' && (
                           <button style={{ padding: '6px 12px', background: 'var(--portal-ink)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                             Mark as Winner
                           </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table */}
        {view === 'list' && (
          <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>All Bounties</h3>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--portal-muted)' }}>
                <Filter size={18} /> <Search size={18} />
              </div>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', color: 'var(--portal-muted)' }}>Title / ID</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', color: 'var(--portal-muted)' }}>Category</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', color: 'var(--portal-muted)' }}>State</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', color: 'var(--portal-muted)' }}>Prize Pool</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', color: 'var(--portal-muted)' }}>Participants</th>
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
                    <td style={{ padding: '16px 24px', fontSize: '13px' }}>
                      {b.subscriptions} / 100
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEdit(b)} style={{ padding: '6px 12px', background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => { setSelectedBounty(b); setView('participants'); }} style={{ padding: '6px 12px', background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          View Participants
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
