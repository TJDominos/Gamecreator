import React, { useState } from 'react';
import { TipTapEditor } from '../../../components/TipTapEditor';
import { Target, Plus, Search, ArrowRight, ArrowLeft, Trash2, Save, Edit2, Eye, X } from 'lucide-react';
import { Bounty, Category } from './bountyData';
import { GAME_CATEGORIES } from '../games/gameData';
import { bountyApi, mapBounty } from '../../../services/bountyApi';
import { MediaUploadField } from '../../../components/MediaUploadField';
import { Toast } from '../../../components/Toast';

const countWords = (str: string) => str.trim().split(/\s+/).filter(Boolean).length;
type BountyExampleForm = { title: string; mediaUrl: string; linkUrl: string };

const inferExampleType = (mediaUrl: string): 'image' | 'video' => {
  return /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(mediaUrl.trim()) ? 'video' : 'image';
};

export function BountyManagement(): React.ReactElement {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchBounties();
  }, []);

  const fetchBounties = async (): Promise<Bounty[]> => {
    try {
      const token = localStorage.getItem("randseed_custom_jwt");
      const res = await fetch("/api/admin/bounties", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const rawBounties = data.bounties || data.data?.bounties;
        if (Array.isArray(rawBounties)) {
          const nextBounties = rawBounties.map(mapBounty);
          setBounties(nextBounties);
          return nextBounties;
        }
        throw new Error(data.error || data.message || 'Bounty list response was invalid');
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || `Failed to load bounties (${res.status})`);
      }
    } catch (err) {
      console.error(err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to load bounties',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
    return [];
  };
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'participants'>('list');
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  
  const [filterState, setFilterState] = useState<'ACTIVE' | 'CLOSED' | 'DRAFT'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [form, setForm] = useState({
    title: '', category: 'Arcade' as Category, shortDesc: '', fullDesc: '', thumbnailUrl: '',
    poolAmount: 0, currency: 'WLT' as 'WLT' | 'USD', maxParticipants: 100, participationEndDate: '',
    releaseDate: '', distributionDate: '', settlementRules: 'Default Distribution Algorithm',
    examples: [] as BountyExampleForm[]
  });

  const [formErrors, setFormErrors] = useState<{ thumbnail?: string }>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [previewExample, setPreviewExample] = useState<{ url: string; type: string; name?: string } | null>(null);
  const savingRef = React.useRef(false);
  
  const lastSavedFormRef = React.useRef(form);
  const formRef = React.useRef(form);

  React.useEffect(() => {
    formRef.current = form;
  }, [form]);

  const handleEdit = (b: Bounty) => {
    setSelectedBounty(b);
    const nextForm = {
      title: b.title,
      category: b.category,
      shortDesc: b.description,
      fullDesc: b.fullDescription || '',
      thumbnailUrl: b.videoUrl || '',
      poolAmount: b.prizePool,
      currency: b.currency,
      maxParticipants: b.maxParticipants ?? 100,
      participationEndDate: b.deadline.split('T')[0],
      releaseDate: b.releaseDate || '',
      distributionDate: b.battleEnd ? b.battleEnd.split('T')[0] : '',
      settlementRules: b.settlementRules || 'Default Distribution Algorithm',
      examples: b.examples ? b.examples.map(ex => ({
        title: ex.title || '',
        mediaUrl: ex.thumbnail || (ex.type === 'image' || ex.type === 'video' ? ex.url : ''),
        linkUrl: ex.thumbnail ? ex.url : ex.type === 'web' ? ex.url : '',
      })) : []
    };
    setForm(nextForm);
    formRef.current = nextForm;
    lastSavedFormRef.current = nextForm;
    setView('edit');
  };

  const handleSave = async (isAutoSave: boolean = false, stateOverride?: string) => {
    if (savingRef.current) return;
    if (isAutoSave) setAutoSaveStatus("Saving...");
    // Word limit checks
    if (form.title.split(' ').length > 10) {
      alert("Title must be max 10 words.");
      return;
    }
    if (form.shortDesc.split(' ').length > 50) {
      alert("Short description must be max 50 words.");
      return;
    }
    
    savingRef.current = true;
    setIsSaving(true);
    const token = localStorage.getItem("randseed_custom_jwt");
    const isEdit = !!selectedBounty;
    const url = isEdit ? `/api/admin/bounties/${selectedBounty.id}` : "/api/admin/bounties";
    const method = isEdit ? "PUT" : "POST";
    const persistedExamples = form.examples
      .filter((example) => example.mediaUrl.trim())
      .map((example) => ({
        type: inferExampleType(example.mediaUrl),
        title: example.title.trim(),
        thumbnail: example.mediaUrl.trim(),
        url: example.linkUrl.trim(),
      }));
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...form, examples: persistedExamples, state: stateOverride || selectedBounty?.state || "DRAFT" })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || "Failed to save bounty");
      }
      const refreshedBounties = await fetchBounties();
      lastSavedFormRef.current = form;
      if (isAutoSave) {
        setAutoSaveStatus("Saved at " + new Date().toLocaleTimeString());
      } else {
        const savedState = stateOverride || selectedBounty?.state || 'DRAFT';
        const savedBountyId = isEdit ? selectedBounty?.id : data.id;
        if (savedState === 'DRAFT' && savedBountyId) {
          const savedBounty = refreshedBounties.find((bounty) => bounty.id === savedBountyId) || {
            id: savedBountyId,
            title: form.title,
            description: form.shortDesc,
            fullDescription: form.fullDesc,
            state: 'DRAFT' as const,
            category: form.category,
            prizePool: form.poolAmount,
            currency: form.currency,
            tags: [],
            subscriptions: 0,
            onlineGames: 0,
            deadline: form.participationEndDate,
            battleEnd: form.distributionDate,
            maxParticipants: form.maxParticipants,
            releaseDate: form.releaseDate,
            settlementRules: form.settlementRules,
            videoUrl: form.thumbnailUrl,
            examples: persistedExamples.map((example, index) => ({
              id: `${savedBountyId}-example-${index}`,
              title: example.title || 'Game example',
              thumbnail: example.thumbnail,
              url: example.url,
              type: example.type,
            })),
          };
          setSelectedBounty(savedBounty);
          setView('edit');
        }
        setToast({
          message: savedState === 'OPEN' ? 'Bounty published.' : savedState === 'DRAFT' ? 'Bounty draft saved.' : 'Bounty changes saved.',
          tone: 'success',
        });
        if (savedState !== 'DRAFT') setView('list');
      }
    } catch (err) {
      console.error(err);
      if (isAutoSave) {
        setAutoSaveStatus("Auto-save failed");
      } else {
        setToast({
          message: err instanceof Error ? err.message : "Failed to save bounty",
          tone: 'error',
        });
      }
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
    if (view !== 'edit' || !selectedBounty || JSON.stringify(form) === JSON.stringify(lastSavedFormRef.current)) {
      return;
    }
    const timeoutId = window.setTimeout(() => void handleSave(true), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [form, view, selectedBounty]);

  React.useEffect(() => {
    if (!previewExample) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewExample(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [previewExample]);

  const handleCancelBounty = () => {
    if (!selectedBounty || selectedBounty.state === 'CLOSED') return;
    const isDraft = selectedBounty.state === 'DRAFT';
    const firstConfirmation = isDraft
      ? window.confirm(`Cancel draft "${selectedBounty.title}"? It will be moved to Closed.`)
      : window.confirm(`Cancel bounty "${selectedBounty.title}"? This will close participation and cannot be undone.`);
    if (!firstConfirmation) return;

    const secondConfirmation = isDraft
      ? window.confirm('Please confirm again: move this draft to Closed?')
      : true;
    if (secondConfirmation) void handleSave(false, 'CLOSED');
  };

  const filteredBounties = bounties.filter(b => {
    const matchState = filterState === 'ACTIVE'
      ? b.state !== 'DRAFT' && b.state !== 'CLOSED'
      : b.state === filterState;
    const matchSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchState && matchSearch;
  });

  return (
    <div className="admin-bounty-page">
      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
      <div className="admin-bounty-page__inner">
        
        {/* Header */}
          <header className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 8px' }}>
              Bounty Management
            </h1>
            <p style={{ color: 'var(--portal-muted)', margin: 0 }}>
              Create, modify, and finalize Creator Bounties.
            </p>
          </div>
          
          {view === 'list' && (
            <button
              className="btn btn--solid"
              onClick={() => {
                setForm({
                  title: '', category: 'Arcade', shortDesc: '', fullDesc: '', thumbnailUrl: '',
                  poolAmount: 0, currency: 'WLT', maxParticipants: 100, participationEndDate: '',
                  releaseDate: '', distributionDate: '', settlementRules: 'Default Distribution Algorithm',
                  examples: []
                });
                setView('create');
              }}
            >
              <Plus className="btn__icon" size={16} /> Create New Bounty
            </button>
          )}
        </header>

        {(view === 'create' || view === 'edit') && (
          <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
            <button className="btn bounty-text-action" onClick={() => setView('list')}>
              <ArrowLeft size={16} /> Back to List
            </button>
            <h2 style={{ fontSize: '20px', margin: '0 0 24px' }}>{view === 'create' ? 'Create New Bounty' : 'Edit Bounty'}</h2>
            <div style={{ position: 'sticky', top: '12px', zIndex: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', padding: '10px 12px', marginBottom: '24px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 14px rgba(17, 24, 39, 0.08)' }}>
              <span className="portal-note" style={{ marginRight: 'auto', color: '#6b7280', fontSize: '12px' }} aria-live="polite">
                {view === 'edit' ? (autoSaveStatus || 'Changes save automatically') : 'Save this bounty as a draft'}
              </span>
              <button className="btn btn--outline" type="button" onClick={() => setView('list')} disabled={isSaving}>Cancel</button>
              <button className="btn btn--solid" type="button" onClick={() => void handleSave(false, view === 'create' ? 'DRAFT' : undefined)} disabled={isSaving}>
                {isSaving ? 'Saving...' : view === 'create' ? 'Save Draft' : 'Save Changes'}
              </button>
            </div>
            
            <div className="admin-bounty-form">
              
              <div className="field">
                <span style={{ fontWeight: 600 }}>Bounty Title <small style={{ fontWeight: 'normal', color: 'var(--portal-muted)' }}>(Max 10 words)</small></span>
                <input type="text" value={form.title} onChange={e => { if (countWords(e.target.value) <= 10 || e.target.value.length < form.title.length) setForm({...form, title: e.target.value}) }} />
              </div>
              
              <div className="field">
                <span style={{ fontWeight: 600 }}>Game Category</span>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value as Category})}>
                  {GAME_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>

              <div className="field field--wide" style={{ gridColumn: 'span 2' }}>
                <span style={{ fontWeight: 600 }}>Short Description <small style={{ fontWeight: 'normal', color: 'var(--portal-muted)' }}>(Max 50 words)</small></span>
                <textarea rows={2} value={form.shortDesc} onChange={e => { if (countWords(e.target.value) <= 50 || e.target.value.length < form.shortDesc.length) setForm({...form, shortDesc: e.target.value}) }}></textarea>
              </div>

              <div className="field field--wide" style={{ gridColumn: 'span 2' }}>
                <MediaUploadField
                  value={form.thumbnailUrl}
                  onChange={(thumbnailUrl) => setForm({ ...formRef.current, thumbnailUrl })}
                  onError={(thumbnail) => setFormErrors((previous) => ({ ...previous, thumbnail }))}
                  error={formErrors.thumbnail}
                  label="Thumbnail Media"
                  helperText="Recommended 16:9 ratio · 480×270 or 1920×1080 · Max 10 MB"
                  emptyLabel="Upload image or MP4"
                  accept="image/*,video/mp4"
                  mediaKind="mixed"
                  maxBytes={10 * 1024 * 1024}
                  uploadFile={bountyApi.uploadMedia}
                  allowUrlInput
                  urlPlaceholder="Or paste image or MP4 URL"
                  showLabel
                />
              </div>

              <div className="field field--wide" style={{ gridColumn: 'span 2' }}>
                <span style={{ fontWeight: 600 }}>Full Description</span>
                <TipTapEditor 
                  value={form.fullDesc} 
                  onChange={(val) => setForm({...form, fullDesc: val})} 
                />
              </div>

              <div className="field">
                <span style={{ fontWeight: 600 }}>Bounty Pool Amount</span>
                <input type="number" value={form.poolAmount} onChange={e => setForm({...form, poolAmount: Number(e.target.value)})} />
              </div>
              
              <div className="field">
                <span style={{ fontWeight: 600 }}>Currency</span>
                <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value as 'WLT' | 'USD'})}>
                  <option value="WLT">WLT</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="field">
                <span style={{ fontWeight: 600 }}>Max Participants</span>
                <input type="number" value={form.maxParticipants} onChange={e => setForm({...form, maxParticipants: Number(e.target.value)})} />
              </div>

              <div className="field">
                <span style={{ fontWeight: 600 }}>Participation End Date</span>
                <input type="date" value={form.participationEndDate} onChange={e => setForm({...form, participationEndDate: e.target.value})} />
              </div>
              
              <div className="field">
                <span style={{ fontWeight: 600 }}>Release Date</span>
                <input type="date" value={form.releaseDate} onChange={e => setForm({...form, releaseDate: e.target.value})} />
              </div>
              
              <div className="field">
                <span style={{ fontWeight: 600 }}>Distribution Date</span>
                <input type="date" value={form.distributionDate} onChange={e => setForm({...form, distributionDate: e.target.value})} />
              </div>

              <div className="field--wide" style={{ gridColumn: 'span 2' }}>
                <span style={{ fontWeight: 600 }}>Settlement Rules</span>
                <div style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb', color: 'var(--portal-muted)', fontSize: '14px' }}>
                  Default Distribution Algorithm (Auto-managed by platform, cannot be modified)
                </div>
              </div>

              <div className="field--wide" style={{ gridColumn: 'span 2' }}>
                <div className="bounty-examples-header">
                  <div>
                    <span>Game Examples</span>
                    <small className="bounty-examples-description">Optional. Add an image or video and an optional destination link.</small>
                  </div>
                    <button className="btn bounty-text-action bounty-example-add" type="button" onClick={() => setForm({...form, examples: [...form.examples, { title: '', mediaUrl: '', linkUrl: '' }]})}>
                    <Plus className="btn__icon" size={14} /> Add Example
                  </button>
                </div>
                
                {form.examples.map((ex, i) => (
                  <div key={i} className="bounty-example-row">
                    <label className="bounty-example-field bounty-example-title-field">
                      <span>Title</span>
                      <input className="bounty-example-title" type="text" placeholder="Game example title" value={ex.title} onChange={e => {
                        const newEx = [...form.examples];
                        newEx[i].title = e.target.value;
                        setForm({...form, examples: newEx});
                      }} />
                    </label>
                    <label className="bounty-example-field bounty-example-media-field">
                      <span>Image / Video URL <small>16:9 · 1280 × 720 recommended</small></span>
                      <div className="bounty-example-url-control">
                        <input className="bounty-example-media" type="url" placeholder="Paste an image or video URL" value={ex.mediaUrl} onChange={e => {
                          const newEx = [...form.examples];
                          newEx[i].mediaUrl = e.target.value;
                          setForm({...form, examples: newEx});
                        }} />
                        <button
                          className="btn btn--icon-only bounty-example-preview"
                          type="button"
                          aria-label={`Preview ${ex.title || 'game example'}`}
                          disabled={!ex.mediaUrl.trim()}
                          onClick={() => setPreviewExample({ url: ex.mediaUrl.trim(), type: inferExampleType(ex.mediaUrl), name: ex.title })}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </label>
                    <label className="bounty-example-field bounty-example-link-field">
                      <span>Destination URL <small>(Optional)</small></span>
                      <input className="bounty-example-link" type="url" placeholder="Link to open when clicked" value={ex.linkUrl} onChange={e => {
                        const newEx = [...form.examples];
                        newEx[i].linkUrl = e.target.value;
                        setForm({...form, examples: newEx});
                      }} />
                    </label>
                    <button className="btn btn--icon-only bounty-example-delete" type="button" aria-label="Remove game example" onClick={() => {
                      const newEx = [...form.examples];
                      newEx.splice(i, 1);
                      setForm({...form, examples: newEx});
                    }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--portal-border)' }}>
              {view === 'edit' && (
                 <button className="btn btn--outline" type="button" onClick={handleCancelBounty} disabled={isSaving || selectedBounty?.state === 'CLOSED'}>
                   Cancel Bounty
                 </button>
              )}
              <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                <button className="btn btn--outline" type="button" onClick={() => setView('list')} disabled={isSaving}>Cancel</button>
                <button className="btn btn--solid" type="button" onClick={() => void handleSave(false, view === 'create' || selectedBounty?.state === 'DRAFT' ? 'OPEN' : undefined)} disabled={isSaving}>{isSaving ? 'Saving...' : view === 'create' || selectedBounty?.state === 'DRAFT' ? 'Publish Bounty' : 'Save Changes'}</button>
              </div>
            </div>

            {previewExample && (
              <div
                className="bounty-preview-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="bounty-preview-title"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setPreviewExample(null);
                }}
              >
                <div className="bounty-preview-modal__content">
                  <div className="bounty-preview-modal__header">
                    <h2 id="bounty-preview-title">{previewExample.name || 'Game Example Preview'}</h2>
                    <button className="btn btn--icon-only bounty-preview-modal__close" type="button" aria-label="Close preview" onClick={() => setPreviewExample(null)}>
                      <X size={18} />
                    </button>
                  </div>
                  <div className="bounty-preview-modal__body">
                    {previewExample.type === 'image' ? (
                      <img src={previewExample.url} alt={previewExample.name || 'Game example'} />
                    ) : previewExample.type === 'video' ? (
                      <video src={previewExample.url} controls playsInline />
                    ) : (
                      <iframe src={previewExample.url} title={previewExample.name || 'Game example preview'} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'participants' && selectedBounty && (
          <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
            <button className="btn bounty-text-action" onClick={() => { setView('list'); setCurrentPage(1); }}>
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
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--portal-border)', color: 'var(--portal-muted)', fontSize: '13px' }}>Joined At</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--portal-border)', color: 'var(--portal-muted)', fontSize: '13px' }}>Creator</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--portal-border)', color: 'var(--portal-muted)', fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--portal-border)', color: 'var(--portal-muted)', fontSize: '13px' }}>Score</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--portal-border)', color: 'var(--portal-muted)', fontSize: '13px' }}>Bounty Amount</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--portal-border)', color: 'var(--portal-muted)', fontSize: '13px' }}>Game ID</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--portal-border)', color: 'var(--portal-muted)', fontSize: '13px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(selectedBounty.participants?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || []).map((p, index) => {
                   const absoluteIndex = (currentPage - 1) * itemsPerPage + index;
                   const winner = selectedBounty.winners?.find(w => w.creator.id === p.id);
                   const publishedGame = selectedBounty.publishedGames?.find(pub => pub.creator.id === p.id);
                   let status = 'Subscribed';
                   let statusColor = '#6b7280';
                   let statusBg = '#f3f4f6';
                   let score = '-';
                   let amount = '-';
                   let gameId = '-';
                   
                   if (winner) {
                     status = 'Winner';
                     statusColor = '#9a3412';
                     statusBg = '#ffedd5';
                     score = winner.performanceScore?.toLocaleString() || '-';
                     amount = winner.prize || '-';
                     gameId = winner.gameId || '-';
                   } else if (publishedGame) {
                     status = 'Published';
                     statusColor = '#1e874b';
                     statusBg = '#e6f6ec';
                     score = publishedGame.performanceScore?.toLocaleString() || '-';
                     amount = publishedGame.prize || '-';
                     gameId = publishedGame.gameId || '-';
                   }

                   const joinDateString = p.joinedAt
                     ? new Date(p.joinedAt).toLocaleString()
                     : '-';

                   return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--portal-border)' }}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>
                        <div style={{ color: 'var(--portal-ink)' }}>#{absoluteIndex + 1}</div>
                        <div style={{ fontSize: '12px', color: 'var(--portal-muted)', fontWeight: 400 }}>{joinDateString}</div>
                      </td>
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
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>
                        {score}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: winner ? '#9a3412' : (publishedGame ? '#1e874b' : 'inherit') }}>
                        {amount}
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', fontFamily: 'monospace' }}>
                        {gameId !== '-' ? <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--portal-purple)', textDecoration: 'none' }}>{gameId}</a> : '-'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {status === 'Published' && selectedBounty.state === 'ONLINE' && (
                           <button className="btn btn--solid btn--sm">
                             Mark as Winner
                           </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {selectedBounty.participants && Math.ceil(selectedBounty.participants.length / itemsPerPage) > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                <button className="btn btn--outline btn--sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--portal-muted)' }}>
                  Page {currentPage} of {Math.ceil(selectedBounty.participants.length / itemsPerPage)}
                </span>
                <button className="btn btn--outline btn--sm"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(selectedBounty.participants.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(selectedBounty.participants.length / itemsPerPage)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        {view === 'list' && (
          <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--portal-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>All Bounties</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} color="var(--portal-muted)" style={{ position: 'absolute', left: '10px' }} />
                  <input 
                    type="text" 
                    placeholder="Search ID or Title..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '8px 12px 8px 32px', border: '1px solid var(--portal-border)', borderRadius: '8px', fontSize: '13px', width: '200px' }}
                  />
                </div>
                <div className="admin-bounty-tabs" role="tablist" aria-label="Bounty state">
                  {(['ACTIVE', 'CLOSED', 'DRAFT'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={filterState === tab}
                      className={`admin-bounty-tab${filterState === tab ? ' is-active' : ''}`}
                      onClick={() => setFilterState(tab)}
                    >
                      {tab === 'ACTIVE' ? 'Active' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
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
                {filteredBounties.length > 0 ? (
                  filteredBounties.map(b => (
                    <tr
                      key={b.id}
                      className={b.state === 'DRAFT' ? 'admin-bounty-row--draft' : undefined}
                      onClick={b.state === 'DRAFT' ? () => handleEdit(b) : undefined}
                      onKeyDown={b.state === 'DRAFT' ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleEdit(b);
                        }
                      } : undefined}
                      tabIndex={b.state === 'DRAFT' ? 0 : -1}
                      aria-label={b.state === 'DRAFT' ? `Continue editing ${b.title}` : undefined}
                      style={{ borderBottom: '1px solid var(--portal-border)' }}
                    >
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
                          background: b.state === 'DRAFT' ? '#f3f4f6' : b.state === 'OPEN' ? '#e6f6ec' : b.state === 'RUNNING' ? '#e0e7ff' : b.state === 'ONLINE' ? '#fff1d9' : '#f2f0f3',
                          color: b.state === 'DRAFT' ? '#4b5563' : b.state === 'OPEN' ? '#1e874b' : b.state === 'RUNNING' ? '#4f46e5' : b.state === 'ONLINE' ? '#8a5314' : '#6b7280'
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
                          {b.state !== 'DRAFT' && b.state !== 'CLOSED' && (
                            <button className="btn btn--solid btn--accent btn--sm" onClick={() => handleEdit(b)}>
                              <Edit2 className="btn__icon" size={14} /> Edit
                            </button>
                          )}
                          {b.state !== 'DRAFT' && (
                            <button className="btn btn--outline btn--sm" onClick={() => { setSelectedBounty(b); setView('participants'); setCurrentPage(1); }}>
                              View Participants
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--portal-muted)', fontSize: '14px' }}>
                      No bounties found matching your search and filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
