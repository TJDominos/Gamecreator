import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Gamepad2, LayoutDashboard, Dices, Music, Puzzle, Swords, Building2, Trophy, Map, Lightbulb, Type, Users, LayoutGrid, CheckCircle2, Lock, Activity, Target } from 'lucide-react';
import { MOCK_BOUNTIES } from '../dashboard/bounties/bountyData';
import { SiteHeader } from '../../components/SiteHeader';
import { CategorySidebar } from '../../components/CategorySidebar';
import '../guides/CreatorGuide.css';

const StateStyles: Record<string, { bg: string, color: string, icon: any, label: string }> = {
  OPEN: { bg: '#e0f2fe', color: '#0369a1', icon: Target, label: 'Open / Accepting Subs' },
  RUNNING: { bg: '#dcfce7', color: '#15803d', icon: CheckCircle2, label: 'Running / Development' },
  ONLINE: { bg: '#fff1d9', color: '#8a5314', icon: Activity, label: 'Online / Traffic Battle' },
  CLOSED: { bg: '#f2f0f3', color: '#6b7280', icon: Lock, label: 'Closed / Settled' }
};

export default function CreatorBounties() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('category') || 'All');
  const [activeStatus, setActiveStatus] = useState<string>('All');
  
  useEffect(() => {
    const categoryQuery = searchParams.get('category');
    if (categoryQuery && categoryQuery !== activeCategory) {
      setActiveCategory(categoryQuery);
    } else if (!categoryQuery && activeCategory !== 'All') {
      setActiveCategory('All');
    }
  }, [searchParams]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  
  const displayedBounties = MOCK_BOUNTIES.filter(b => {
    const matchCategory = activeCategory === 'All' || b.category === activeCategory;
    const matchStatus = activeStatus === 'All' || b.state === activeStatus;
    return matchCategory && matchStatus;
  });


  const renderTimeStatus = (bounty: typeof MOCK_BOUNTIES[0]) => {
    const now = new Date('2026-08-30T00:00:00Z').getTime();

    const getDays = (targetDateStr?: string) => {
      if (!targetDateStr) return 0;
      const diff = new Date(targetDateStr).getTime() - now;
      return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    };

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (bounty.state === 'OPEN') {
      return (
        <div style={{ paddingLeft: '12px', borderLeft: '1px solid var(--portal-border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--portal-muted)', display: 'block', marginBottom: '2px' }}>Participation</span>
          <strong className="heartbeat-text" style={{ fontSize: '14px' }}>Ends in {getDays(bounty.deadline)} Days</strong>
        </div>
      );
    }
    
    if (bounty.state === 'RUNNING') {
      const releaseTime = new Date(bounty.deadline).getTime() + (45 * 24 * 3600 * 1000);
      const days = Math.max(0, Math.ceil((releaseTime - now) / (1000 * 3600 * 24)));
      return (
        <div style={{ paddingLeft: '12px', borderLeft: '1px solid var(--portal-border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--portal-muted)', display: 'block', marginBottom: '2px' }}>Development</span>
          <strong style={{ fontSize: '14px' }}>Releases in {days} Days</strong>
        </div>
      );
    }

    if (bounty.state === 'ONLINE') {
      return (
        <div style={{ paddingLeft: '12px', borderLeft: '1px solid var(--portal-border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--portal-muted)', display: 'block', marginBottom: '2px' }}>Traffic Battle</span>
          <strong style={{ fontSize: '14px' }}>Distributes in {getDays(bounty.battleEnd)} Days</strong>
        </div>
      );
    }

    if (bounty.state === 'CLOSED') {
      return (
        <div style={{ paddingLeft: '12px', borderLeft: '1px solid var(--portal-border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--portal-muted)', display: 'block', marginBottom: '2px' }}>Status</span>
          <strong style={{ fontSize: '14px' }}>Closed at {formatDate(bounty.battleEnd || bounty.deadline)}</strong>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="creator-guide">
      <SiteHeader />
      <main className="guide-main">
        <div className="guide-sidebar">
          <nav className="guide-nav">
            <div className="guide-nav__section border-none !p-0 !bg-transparent">
              <CategorySidebar activeCategory={activeCategory} onSelectCategory={handleCategoryChange} />
            </div>
          </nav>
        </div>
        
        <div className="guide-content">
          <section id="overview">
            <p className="lead">
              Subscribe to active tracks and participate in 30-day traffic battles to win Bounty Prize Pools based on real player data.
            </p>
            
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
              {['All', 'OPEN', 'RUNNING', 'ONLINE', 'CLOSED'].map(status => (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: activeStatus === status ? '1px solid var(--portal-ink)' : '1px solid var(--portal-border)',
                    background: activeStatus === status ? 'var(--portal-ink)' : '#fff',
                    color: activeStatus === status ? '#fff' : 'var(--portal-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  {status === 'All' ? 'All Status' : status}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '24px' }}>
              {displayedBounties.map(bounty => {
                const s = StateStyles[bounty.state];
                const SIcon = s.icon;
                const isOpen = bounty.state === 'OPEN';

                return (
                  <div 
                    key={bounty.id} 
                    className="bounty-card"
                    onClick={() => navigate(`/bounties/${bounty.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="bounty-card-cover">
                      <img 
                        src={`https://picsum.photos/seed/${bounty.id}/640/360`}
                        alt="Bounty Cover" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    
                    <div className="bounty-card-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <SIcon size={14} /> {s.label}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--portal-muted)', fontWeight: 500 }}>{bounty.category}</span>
                      </div>
                      <h2 style={{ fontSize: '20px', margin: '0 0 8px' }}>{bounty.title}</h2>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--portal-muted)', lineHeight: 1.5 }}>
                        {bounty.description}
                      </p>
                    </div>

                    <div className="bounty-card-action">
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--portal-muted)', display: 'block', marginBottom: '4px' }}>Bounty Pool</span>
                        <span style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Trophy size={20} color="#f59e0b" />
                          {bounty.currency === 'USD' ? '$' : ''}{bounty.prizePool.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--portal-muted)' }}>{bounty.currency}</span>
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--portal-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12}/> Subs</span>
                          <strong style={{ fontSize: '14px' }}>{bounty.subscriptions}</strong>
                        </div>
                        {renderTimeStatus(bounty)}
                      </div>

                      <button
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: isOpen ? 'pointer' : 'not-allowed',
                          background: isOpen ? 'var(--portal-ink)' : '#f2f0f3',
                          color: isOpen ? '#fff' : '#a1a1aa',
                          transition: 'background-color 0.2s',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/bounties/${bounty.id}`);
                        }}
                      >
                        Participate Now
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {displayedBounties.length === 0 && (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--portal-muted)', background: '#f9f9f9', borderRadius: '12px', border: '1px dashed var(--portal-border)' }}>
                  No bounties available in this category.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
