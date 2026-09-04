import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Target, Trophy, Clock, PlayCircle, Lock, Users, Activity, UserMinus, ArrowRight, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { MOCK_BOUNTIES, BountyState, getBountyScores, canUnsubscribeFromBounty } from './bountyData';
import { useBountySubscriptions } from './useBountySubscriptions';

const StateStyles: Record<BountyState, { bg: string; color: string; icon: any; label: string }> = {
  OPEN: { bg: '#e6f6ec', color: '#1e874b', icon: Clock, label: 'Open for Subscription' },
  RUNNING: { bg: '#e0e7ff', color: '#4f46e5', icon: PlayCircle, label: 'Running / Development' },
  ONLINE: { bg: '#fff1d9', color: '#8a5314', icon: Activity, label: 'Online / Traffic Battle' },
  CLOSED: { bg: '#f2f0f3', color: '#6b7280', icon: Lock, label: 'Closed / Settled' },
};

export function BountyHub(): React.ReactElement {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<BountyState | 'ALL'>('ALL');
  const [toastMessage, setToastMessage] = useState<{ id: string; title: string } | null>(null);

  const { isSubscribed, unsubscribe, subscribe } = useBountySubscriptions();

  // Bounties currently subscribed by the user
  const myParticipatedBounties = MOCK_BOUNTIES.filter(b => isSubscribed(b.id));

  const filtered =
    filter === 'ALL'
      ? myParticipatedBounties
      : myParticipatedBounties.filter(b => b.state === filter);

  // Group by category
  const categories = Array.from(new Set(filtered.map(b => b.category)));

  const handleUnsubscribe = (bounty: { id: string; title: string }) => {
    unsubscribe(bounty.id);
    setToastMessage({ id: bounty.id, title: bounty.title });
  };

  const handleUndo = () => {
    if (toastMessage) {
      subscribe(toastMessage.id);
      setToastMessage(null);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Toast notification for Unsubscribe with Undo */}
      {toastMessage && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#9f1239',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#e11d48" />
            <span>
              Unsubscribed from <strong>{toastMessage.title}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleUndo}
              style={{
                background: '#fff',
                border: '1px solid #fda4af',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#e11d48',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RotateCcw size={12} /> Undo
            </button>
            <button
              onClick={() => setToastMessage(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9f1239',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1
              style={{
                fontSize: '24px',
                lineHeight: '30px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Target size={28} color="var(--portal-purple)" /> My Bounties
            </h1>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                background: '#f2f0f3',
                color: 'var(--portal-muted)',
                padding: '3px 8px',
                borderRadius: '12px',
              }}
            >
              {myParticipatedBounties.length} Active
            </span>
          </div>
          <p style={{ color: 'var(--portal-muted)', margin: 0, fontSize: '15px', maxWidth: '640px' }}>
            Track the bounties you have subscribed to, compare your game scores with the total bounty score, and monitor settlement payouts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/bounties')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: '1px solid var(--portal-border)',
              background: '#fff',
              color: 'var(--portal-ink)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <Sparkles size={14} color="var(--portal-purple)" /> Explore Bounties
          </button>

          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: '#f9f9f9',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid var(--portal-border)',
            }}
          >
            {(['ALL', 'OPEN', 'RUNNING', 'ONLINE', 'CLOSED'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: filter === f ? '#fff' : 'transparent',
                  boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  color: filter === f ? 'var(--portal-ink)' : 'var(--portal-muted)',
                  fontWeight: filter === f ? 600 : 500,
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.15s',
                }}
              >
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bounty list grouped by category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {categories.map(cat => (
          <div key={cat}>
            <h2
              style={{
                fontSize: '18px',
                margin: '0 0 16px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--portal-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {cat}{' '}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--portal-muted)',
                  background: '#f2f0f3',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {filtered.filter(b => b.category === cat).length}
              </span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {filtered
                .filter(b => b.category === cat)
                .map(bounty => {
                  const s = StateStyles[bounty.state];
                  const SIcon = s.icon;
                  const scores = getBountyScores(bounty);

                  return (
                    <div
                      key={bounty.id}
                      style={{
                        background: '#fff',
                        border: '1px solid var(--portal-border)',
                        borderRadius: '14px',
                        padding: '20px 24px',
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '24px',
                        alignItems: 'stretch',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--portal-purple)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(113, 89, 219, 0.08)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--portal-border)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      onClick={() => navigate(`/dashboard/bounties/${bounty.id}`)}
                    >
                      {/* Left side: Information */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span
                            style={{
                              background: s.bg,
                              color: s.color,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <SIcon size={14} /> {s.label}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--portal-muted)', fontFamily: 'monospace' }}>
                            ID: {bounty.id}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '18px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {bounty.title}
                        </h3>

                        <p
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            color: 'var(--portal-muted)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}
                        >
                          {bounty.description}
                        </p>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                          {bounty.tags.map(tag => (
                            <span
                              key={tag}
                              style={{
                                background: '#f2f0f3',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: 'var(--portal-ink)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right side: Prize pool, Scores & Unsubscribe button */}
                      <div
                        style={{
                          borderLeft: '1px solid var(--portal-border)',
                          paddingLeft: '24px',
                          minWidth: '240px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          {/* Prize Pool */}
                          <div style={{ marginBottom: '14px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--portal-muted)', display: 'block', marginBottom: '2px' }}>
                              Prize Pool
                            </span>
                            <span style={{ fontSize: '22px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--portal-ink)' }}>
                              <Trophy size={18} color="#f59e0b" />
                              {bounty.currency === 'USD' ? '$' : ''}
                              {bounty.prizePool.toLocaleString()}{' '}
                              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--portal-muted)' }}>
                                {bounty.currency}
                              </span>
                            </span>
                          </div>

                          {/* Scores & Activity Metrics */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '10px 12px',
                              padding: '10px 12px',
                              background: '#f9fafb',
                              borderRadius: '8px',
                              border: '1px solid #f1f5f9',
                              marginBottom: '14px',
                            }}
                          >
                            {/* Current Total Bounty Score */}
                            <div>
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--portal-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  marginBottom: '2px',
                                }}
                                title="Current Total Bounty Score (sum of all game performance scores)"
                              >
                                <Target size={11} color="var(--portal-purple)" /> Total Score
                              </span>
                              <strong
                                style={{
                                  fontSize: '13px',
                                  color: scores.totalScore !== '-' ? 'var(--portal-purple)' : 'var(--portal-muted)',
                                  fontWeight: 600,
                                }}
                              >
                                {scores.totalScore}
                              </strong>
                            </div>

                            {/* My Game Score */}
                            <div>
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--portal-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  marginBottom: '2px',
                                }}
                                title="My Game Score in this bounty"
                              >
                                <Trophy size={11} color={scores.myScore !== '-' ? '#16a34a' : 'var(--portal-muted)'} /> My Score
                              </span>
                              <strong
                                style={{
                                  fontSize: '13px',
                                  color: scores.myScore !== '-' ? '#16a34a' : 'var(--portal-muted)',
                                  fontWeight: 600,
                                }}
                              >
                                {scores.myScore}
                              </strong>
                            </div>

                            {/* Subscriptions */}
                            <div>
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--portal-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  marginBottom: '2px',
                                }}
                              >
                                <Users size={11} /> Subs
                              </span>
                              <strong style={{ fontSize: '13px', color: 'var(--portal-ink)', fontWeight: 600 }}>
                                {bounty.subscriptions}
                              </strong>
                            </div>

                            {/* Online Games */}
                            <div>
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--portal-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  marginBottom: '2px',
                                }}
                              >
                                <Activity size={11} /> Online
                              </span>
                              <strong style={{ fontSize: '13px', color: 'var(--portal-ink)', fontWeight: 600 }}>
                                {bounty.onlineGames}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Unsubscribe action */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                          {canUnsubscribeFromBounty(bounty.state) ? (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleUnsubscribe(bounty);
                              }}
                              style={{
                                width: '100%',
                                padding: '7px 12px',
                                borderRadius: '7px',
                                border: '1px solid #fecdd3',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                background: '#fff',
                                color: '#e11d48',
                                transition: 'all 0.15s ease-in-out',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#fff1f2';
                                e.currentTarget.style.borderColor = '#fda4af';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.borderColor = '#fecdd3';
                              }}
                              title="Unsubscribe from this bounty"
                            >
                              <UserMinus size={13} /> Unsubscribe
                            </button>
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                padding: '7px 12px',
                                borderRadius: '7px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                                fontWeight: 500,
                                background: '#f8fafc',
                                color: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                cursor: 'not-allowed',
                                userSelect: 'none',
                              }}
                              title="Unsubscribe is only available in Open and Development stages"
                            >
                              <Lock size={12} color="#94a3b8" /> Unsubscribe locked
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {categories.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid var(--portal-border)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#f5f3ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Target size={28} color="var(--portal-purple)" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px', color: 'var(--portal-ink)' }}>
              No Bounties Found
            </h3>
            <p style={{ color: 'var(--portal-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
              {filter !== 'ALL'
                ? `You don't have any subscribed bounties with status "${filter}".`
                : 'You are not subscribed to any bounties yet. Explore active challenges to participate.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {filter !== 'ALL' && (
                <button
                  onClick={() => setFilter('ALL')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--portal-border)',
                    background: '#fff',
                    color: 'var(--portal-ink)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View All Subscriptions
                </button>
              )}
              <button
                onClick={() => navigate('/bounties')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--portal-purple)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Explore Bounties <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
