import Markdown from 'react-markdown';
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MOCK_BOUNTIES, getBountyScores } from './bountyData';
import { useBountySubscriptions } from './useBountySubscriptions';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Share2, Trophy, Users, CheckCircle2, Target, ExternalLink, AlertCircle } from 'lucide-react';

import { CategorySidebar } from '../../../components/CategorySidebar';

export function BountyDetail(): React.ReactElement {
  const { bountyId } = useParams();
  const navigate = useNavigate();
  const bounty = MOCK_BOUNTIES.find(b => b.id === bountyId);
  const { isSubscribed, subscribe } = useBountySubscriptions();

  if (!bounty) {
    return <div style={{ padding: '40px' }}>Bounty not found.</div>;
  }

  const isParticipated = isSubscribed(bounty.id);
  const scores = getBountyScores(bounty);

  const shareUrl = window.location.href;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: bounty.title,
          text: bounty.description,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const getStatusColor = (state: string) => {
    switch(state) {
      case 'OPEN': return { bg: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' };
      case 'RUNNING': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' };
      case 'ONLINE': return { bg: 'rgba(168, 85, 247, 0.1)', color: '#9333ea' };
      case 'CLOSED': return { bg: 'rgba(100, 116, 139, 0.1)', color: '#475569' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const statusStyle = getStatusColor(bounty.state);

  return (
    <div className="max-w-[1200px] mx-auto px-6 pb-[60px]">
      <Helmet>
        <title>{bounty.title} - Creator Center</title>
        <meta property="og:title" content={bounty.title} />
        <meta property="og:description" content={bounty.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
      </Helmet>
      
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-[60px] items-start">
        
        {/* Left Sidebar (Desktop) / Top Slider (Mobile) */}
        <div className="lg:w-[260px] shrink-0 lg:sticky lg:top-[112px] h-fit">
          <CategorySidebar 
            activeCategory={bounty.category} 
            onSelectCategory={(cat) => navigate((window.location.pathname.startsWith('/dashboard') ? '/dashboard/bounties' : '/bounties') + (cat === 'All' ? '' : '?category=' + encodeURIComponent(cat)))} 
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* Hero Section */}
          <div className="bg-white rounded-2xl overflow-hidden border border-[var(--portal-border)] shadow-sm flex flex-col md:flex-row mb-8">
            
            {/* Left side: Thumbnail/Video */}
            <div className="shrink-0 flex items-center justify-center bg-slate-900 border-b md:border-b-0 md:border-r border-[var(--portal-border)] w-full md:w-[320px] lg:w-[380px] xl:w-[420px]">
              {bounty.videoUrl ? (
                <video 
                  src={bounty.videoUrl} 
                  controls
                  autoPlay
                  muted
                  loop
                  className="w-full aspect-video object-cover block"
                />
              ) : (
                <img 
                  src={`https://picsum.photos/seed/${bounty.id}/1920/1080`} 
                  alt={bounty.title}
                  className="w-full aspect-video object-cover block"
                />
              )}
            </div>
            
            {/* Right side: Info */}
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-center min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    background: statusStyle.bg, 
                    color: statusStyle.color, 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '13px', 
                    fontWeight: 600,
                    border: `1px solid ${statusStyle.color}40`
                  }}>
                    {bounty.state}
                  </span>
                  <span style={{ color: 'var(--portal-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Target size={14} /> {bounty.category}
                  </span>
                </div>
                <button 
                  onClick={handleShare}
                  className="p-[6px] border-[1.5px] border-[var(--portal-ink)] rounded-full hover:bg-[var(--portal-border)] transition-colors text-[var(--portal-ink)]"
                  title="Share Bounty"
                >
                  <Share2 size={16} strokeWidth={2} />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="text-[24px] leading-[32px] text-[var(--portal-ink)] font-bold m-0">{bounty.title}</div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-1">
                    <span className="text-[13px] text-[var(--portal-muted)] block">Bounty Pool</span>
                    <span className="text-[13px] font-mono font-medium text-[var(--portal-muted)]">ID: {bounty.id}</span>
                  </div>
                  <div className="text-2xl font-bold text-[var(--portal-ink)] flex items-center gap-2">
                    <Trophy className="w-6 h-6" color="#f59e0b" />
                    {bounty.currency === 'USD' ? '$' : ''}{bounty.prizePool.toLocaleString()} <span className="text-sm font-medium text-[var(--portal-muted)]">{bounty.currency}</span>
                  </div>

                  {(bounty.state === 'ONLINE' || bounty.state === 'CLOSED') && (
                    <div className="flex items-center gap-6 mt-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-[var(--portal-muted)] block">Total Bounty Score</span>
                        <strong className="text-[14px] text-[var(--portal-purple)] font-semibold">{scores.totalScore}</strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-[var(--portal-muted)] block">My Game Score</span>
                        <strong className="text-[14px] text-emerald-600 font-semibold">{scores.myScore}</strong>
                      </div>
                    </div>
                  )}
                </div>
                
                {isParticipated ? (
                  <button 
                    disabled
                    className="w-full sm:w-auto justify-center"
                    style={{
                      padding: '12px 28px',
                      borderRadius: '30px',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: '1px solid #a7f3d0',
                      background: '#ecfdf5',
                      color: '#047857',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'default',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                    title="You are participating in this bounty"
                  >
                    <CheckCircle2 size={18} color="#059669" />
                    Subscribed
                  </button>
                ) : (
                  <button 
                    onClick={() => subscribe(bounty.id)}
                    className="w-full sm:w-auto justify-center"
                    style={{
                      padding: '12px 28px',
                      borderRadius: '30px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: 'var(--portal-purple)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(97, 54, 154, 0.3)'
                    }}
                  >
                    Participate Now
                  </button>
                )}
              </div>
            </div>
          </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
        {/* Top Left: Description & Examples */}
        <div className="lg:col-span-2 space-y-8 order-1">
          {/* Full Description */}
          <div className="bg-white rounded-2xl p-5 md:p-8 border border-[var(--portal-border)]">
            <h2 style={{ fontSize: '20px', margin: '0 0 20px 0', color: 'var(--portal-ink)' }}>Description</h2>
            <div className="markdown-body" style={{ color: 'var(--portal-text)', lineHeight: 1.6, fontSize: '15px' }}>
              <Markdown>{bounty.fullDescription || bounty.description}</Markdown>
            </div>
          </div>

          {/* Games Examples */}
          {bounty.examples && bounty.examples.length > 0 && (
            <div className="bg-white rounded-2xl p-5 md:p-8 border border-[var(--portal-border)]">
              <h2 style={{ fontSize: '20px', margin: '0 0 20px 0', color: 'var(--portal-ink)' }}>Games Examples</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {bounty.examples.map(ex => (
                  <a key={ex.id} href={ex.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--portal-border)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                    <img src={ex.thumbnail} alt={ex.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--portal-ink)' }}>{ex.title}</span>
                      <ExternalLink size={14} color="var(--portal-muted)" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Participants / Subs) */}
        <div className="lg:col-span-1 lg:row-span-2 order-2">
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-[var(--portal-border)] sticky top-[100px]">
            
            {(bounty.state === 'CLOSED') && bounty.winners && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={18} color="#f59e0b" /> Top 3 Winners
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {bounty.winners.map((winner, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#fffcf5', border: '1px solid #fef3c7', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#d97706', width: '20px', textAlign: 'center' }}>#{idx + 1}</div>
                        <img src={winner.creator.avatar} alt={winner.creator.name} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eee' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--portal-ink)' }}>{winner.gameName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--portal-muted)' }}>by {winner.creator.name}</div>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#d97706' }}>{winner.prize}</div>
                      </div>
                      
                      {winner.uu && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--portal-muted)', borderTop: '1px dashed #fcd34d', paddingTop: '8px', marginTop: '4px' }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <span>UU: <strong style={{ color: 'var(--portal-ink)' }}>{(winner.uu / 1000).toFixed(1)}k</strong></span>
                            <span>Score: <strong style={{ color: 'var(--portal-ink)' }}>{winner.reviewScore}</strong></span>
                          </div>
                          <span>Total: <strong style={{ color: 'var(--portal-ink)' }}>{winner.performanceScore?.toLocaleString()}</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(bounty.state === 'ONLINE' || bounty.state === 'CLOSED') && bounty.publishedGames && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#10b981" /> {bounty.state === 'CLOSED' ? 'Other Published' : 'Published Games'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bounty.publishedGames.map((pub, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={pub.creator.avatar} alt={pub.creator.name} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eee' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--portal-ink)' }}>{pub.gameName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--portal-muted)' }}>by {pub.creator.name}</div>
                        </div>
                        {bounty.state === 'CLOSED' && pub.prize && (
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--portal-ink)' }}>{pub.prize}</div>
                        )}
                      </div>
                      {bounty.state === 'CLOSED' && pub.uu && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--portal-muted)', borderTop: '1px dashed #e5e7eb', paddingTop: '8px', marginTop: '4px' }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <span>UU: <strong style={{ color: 'var(--portal-ink)' }}>{(pub.uu / 1000).toFixed(1)}k</strong></span>
                            <span>Score: <strong style={{ color: 'var(--portal-ink)' }}>{pub.reviewScore}</strong></span>
                          </div>
                          <span>Total: <strong style={{ color: 'var(--portal-ink)' }}>{pub.performanceScore?.toLocaleString()}</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bounty.participants && (() => {
              const myParticipant = { id: 'me', name: 'AlexTheDev (You)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexTheDev' };
              const participantList = isParticipated
                ? [myParticipant, ...bounty.participants.filter(p => p.name !== 'AlexTheDev' && p.id !== 'me')]
                : bounty.participants.filter(p => p.name !== 'AlexTheDev' && p.id !== 'me');

              return (
                <div>
                  <h3 style={{ fontSize: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="var(--portal-muted)" /> Subscribed ({participantList.length})
                  </h3>
                  <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                    {participantList.map((creator, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <img src={creator.avatar} alt={creator.name} className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
                        <span className="text-[13px] font-medium text-[var(--portal-ink)] truncate flex-1">{creator.name}</span>
                        {creator.id === 'me' && (
                          <span className="text-[10px] font-semibold bg-purple-50 text-[var(--portal-purple)] px-1.5 py-0.5 rounded border border-purple-200">
                            You
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>

        {/* Bottom Left: Settlement & Payout Rules */}
        <div id="rules" className="lg:col-span-2 order-3 bg-white rounded-2xl p-5 md:p-8 border border-[var(--portal-border)] h-fit scroll-mt-24">
          <h2 className="font-semibold mb-6 text-[var(--portal-ink)]" style={{ fontSize: '20px' }}>Settlement & Payout Rules</h2>
          
          <div className="mb-8">
            <h3 className="font-bold uppercase tracking-wider text-[var(--portal-muted)] mb-3" style={{ fontSize: '16px' }}>1. How we calculate your share</h3>
            <p className="text-[15px] text-[var(--portal-text)] mb-4">
              When the bounty closes, your reward is based on two factors: <strong>Unique Users (UU)</strong> and your <strong>Review Score</strong>. We multiply them to get your performance score, then compare it to the bounty total.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center bg-purple-50/50 p-5 rounded-xl border border-purple-100 text-sm font-medium">
              <div className="text-center w-full sm:w-auto">
                <div className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-purple-100 text-purple-900">
                  Your UU <span className="text-purple-400 mx-1">×</span> Your Score
                </div>
              </div>
              <div className="text-purple-300 font-bold text-lg sm:rotate-0 rotate-90">÷</div>
              <div className="text-center w-full sm:w-auto">
                <div className="bg-white px-4 py-2.5 rounded-lg shadow-sm border border-purple-100 text-purple-900">
                  Total Bounty Score
                </div>
              </div>
              <div className="text-purple-300 font-bold text-lg sm:rotate-0 rotate-90">=</div>
              <div className="text-center w-full sm:w-auto">
                <div className="bg-purple-600 text-white px-4 py-2.5 rounded-lg shadow-sm">
                  Your Payout %
                </div>
              </div>
            </div>
            
            <p className="mt-4 text-[14px] text-[var(--portal-muted)] italic text-center">
              The more players you attract and the higher your ratings, the larger your slice of the pie!
            </p>
          </div>

          <div>
            <h3 className="font-bold uppercase tracking-wider text-[var(--portal-muted)] mb-3" style={{ fontSize: '16px' }}>2. Prize Pool Conditions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-green-200 bg-green-50 rounded-xl">
                <div className="text-green-700 font-semibold mb-1.5 flex items-center gap-2">
                  <CheckCircle2 size={18} /> 100% Payout Unlock
                </div>
                <div className="text-[14px] text-green-800/80 leading-relaxed">
                  <strong>3 or more</strong> games officially launch during the bounty period.
                </div>
              </div>
              <div className="p-4 border border-orange-200 bg-orange-50 rounded-xl">
                <div className="text-orange-700 font-semibold mb-1.5 flex items-center gap-2">
                  <AlertCircle size={18} /> 30% Payout Unlock
                </div>
                <div className="text-[14px] text-orange-800/80 leading-relaxed">
                  <strong>Fewer than 3</strong> games officially launch during the bounty period.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>



        </div>
      </div>
    </div>
  );
}
