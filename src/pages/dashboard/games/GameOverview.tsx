import React, { useState, useEffect } from "react";
import { 
  Users, 
  Activity, 
  CircleDollarSign, 
  Bell, 
  Check, 
  AlertCircle, 
  CheckCircle2,
  ExternalLink,
  Loader2,
  Save
} from "lucide-react";
import { MediaUploadField } from "../../../components/MediaUploadField";
import { Link, useParams, useOutletContext } from "react-router";
import { GameStatus, StatusLabels } from "./GameConsole";
import { GAME_CATEGORIES, getGameById, updateGame, GAMES_UPDATED_EVENT } from "./gameData";
import { gameApi } from "../../../services/gameApi";

export function GameOverview(): React.ReactElement {
  const { gameId } = useParams();
  const { status } = useOutletContext<{ status: GameStatus; setStatus: (s: GameStatus) => void }>();
  
  const [game, setGame] = useState(() => getGameById(gameId || 'g_101'));

  // Storefront Profile state
  const [description, setDescription] = useState(game?.profile?.description || '');
  const [coverImage, setCoverImage] = useState(game?.profile?.coverImage || '');
  const [animationUrl, setAnimationUrl] = useState(game?.profile?.animationUrl || '');
  
  const [category, setCategory] = useState(game?.profile?.category || '');
  const [ageRating, setAgeRating] = useState(game?.profile?.ageRating || '');
  const [deviceSupport, setDeviceSupport] = useState(game?.profile?.deviceSupport || '');

  // Independent field save & success states
  const [savingField, setSavingField] = useState<"desc" | "cover" | "anim" | "meta" | "all" | null>(null);
  const [descSuccess, setDescSuccess] = useState(false);
  const [coverSuccess, setCoverSuccess] = useState(false);
  const [animSuccess, setAnimSuccess] = useState(false);
  const [metaSuccess, setMetaSuccess] = useState(false);

  const [formErrors, setFormErrors] = useState<{ description?: string; coverImage?: string; animation?: string; meta?: string }>({});

  // Sync when gameId or storage updates
  useEffect(() => {
    const handleUpdate = () => {
      const g = getGameById(gameId || 'g_101');
      if (g) {
        setGame(g);
        setDescription(g.profile?.description || '');
        setCoverImage(g.profile?.coverImage || '');
        setAnimationUrl(g.profile?.animationUrl || '');
        setCategory(g.profile?.category || '');
        setAgeRating(g.profile?.ageRating || '');
        setDeviceSupport(g.profile?.deviceSupport || '');
      }
    };

    window.addEventListener(GAMES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(GAMES_UPDATED_EVENT, handleUpdate);
  }, [gameId]);

  // Word count for Description
  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const isWordCountExceeded = wordCount > 500;

  const uploadGameCover = (file: File) => {
    if (!gameId) return Promise.reject(new Error("Game is not selected"));
    return gameApi.uploadMedia(gameId, file, "cover");
  };

  const uploadGameAnimation = (file: File) => {
    if (!gameId) return Promise.reject(new Error("Game is not selected"));
    return gameApi.uploadMedia(gameId, file, "animation");
  };

  // --- Independent Save Handlers ---

  // 1. Independent Save: Description
  const handleSaveDescription = () => {
    if (!gameId) return;
    if (!description.trim()) {
      setFormErrors(prev => ({ ...prev, description: "Description is required." }));
      return;
    }
    if (isWordCountExceeded) {
      setFormErrors(prev => ({ ...prev, description: `Description exceeds the 500 words limit (${wordCount}/500).` }));
      return;
    }

    setSavingField("desc");
    setFormErrors(prev => ({ ...prev, description: undefined }));

    updateGame(gameId, {
      profile: {
        description: description.trim(),
        coverImage: coverImage.trim(),
        animationUrl: animationUrl.trim(),
        category: category as any,
        ageRating: ageRating as any,
        deviceSupport: deviceSupport as any,
        savedAt: new Date().toISOString()
      }
    });

    setSavingField(null);
    setDescSuccess(true);
    setTimeout(() => setDescSuccess(false), 3000);
  };

  // 2. Independent Save: Cover Image
  const handleSaveCoverImage = () => {
    if (!gameId) return;
    if (!coverImage.trim()) {
      setFormErrors(prev => ({ ...prev, coverImage: "Cover image is required." }));
      return;
    }

    setSavingField("cover");
    setFormErrors(prev => ({ ...prev, coverImage: undefined }));

    updateGame(gameId, {
      coverImage: coverImage.trim(),
      profile: {
        description: description.trim(),
        coverImage: coverImage.trim(),
        animationUrl: animationUrl.trim(),
        category: category as any,
        ageRating: ageRating as any,
        deviceSupport: deviceSupport as any,
        savedAt: new Date().toISOString()
      }
    });

    setSavingField(null);
    setCoverSuccess(true);
    setTimeout(() => setCoverSuccess(false), 3000);
  };

  // 3. Independent Save: Game Animation
  const handleSaveAnimation = () => {
    if (!gameId) return;
    setSavingField("anim");
    setFormErrors(prev => ({ ...prev, animation: undefined }));

    updateGame(gameId, {
      profile: {
        description: description.trim(),
        coverImage: coverImage.trim(),
        animationUrl: animationUrl.trim(),
        category: category as any,
        ageRating: ageRating as any,
        deviceSupport: deviceSupport as any,
        savedAt: new Date().toISOString()
      }
    });

    setSavingField(null);
    setAnimSuccess(true);
    setTimeout(() => setAnimSuccess(false), 3000);
  };

  const handleSaveMeta = () => {
    if (!gameId) return;
    
    // Validate
    if (!category || !ageRating || !deviceSupport) {
      setFormErrors(prev => ({ ...prev, meta: "All meta fields are required." }));
      return;
    }

    setSavingField("meta");
    setFormErrors(prev => ({ ...prev, meta: undefined }));

    updateGame(gameId, {
      profile: {
        description: description.trim(),
        coverImage: coverImage.trim(),
        animationUrl: animationUrl.trim(),
        category: category as any,
        ageRating: ageRating as any,
        deviceSupport: deviceSupport as any,
        savedAt: new Date().toISOString()
      }
    });

    setSavingField(null);
    setMetaSuccess(true);
    setTimeout(() => setMetaSuccess(false), 3000);
  };

  const gameVersion = game?.version && game.version !== '' ? game.version : '---';

  return (
    <div>
      {/* Feedback Notification */}
      {['PRIVATE_TESTING', 'PUBLIC_ACTIVE'].includes(status) && (
        <a 
          href={`https://randseed.org/${gameId}?tab=feedback`}
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
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Feedback Channel Open</span>
          </div>
          <span style={{ fontSize: '13px', color: '#4f46e5', fontWeight: 600 }}>View &rarr;</span>
        </a>
      )}

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Version Card */}
        <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--portal-muted)', fontSize: '13px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} /> Version
            </div>
          </div>

          {/* Primary Display */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: '#111827' }}>
                {gameVersion}
              </span>
              {gameVersion !== '---' && (
                <span style={{ fontSize: '11px', fontWeight: 600, background: '#e6f6ec', color: '#16a34a', padding: '2px 8px', borderRadius: '12px' }}>
                  LIVE
                </span>
              )}
            </div>
          </div>

          <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--portal-muted)' }}>
            Status: {StatusLabels[status]} {(!game?.version || game.version === '---') ? '· (Not deployed yet)' : ''}
          </p>
        </div>

        {/* Traffic & Players Card */}
        <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--portal-muted)', fontSize: '13px', marginBottom: '12px' }}>
            <Users size={16} /> Traffic & Players
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 700 }}>
              {game?.players && game.players !== '' ? game.players : '---'}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--portal-muted)' }}>
              {game?.players && game.players !== '---' ? 'players' : ''}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: game?.visitors && game.visitors !== '---' ? '#167c73' : 'var(--portal-muted)' }}>
            {game?.visitors && game.visitors !== '---' ? `${game.visitors} total visitors` : '--- visitors'}
          </p>
        </div>

        {/* Revenue & Balance Card */}
        <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--portal-muted)', fontSize: '13px', marginBottom: '12px' }}>
            <CircleDollarSign size={16} /> Revenue & Balance
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700 }}>
                {game?.availableBalance && game.availableBalance !== '' ? game.availableBalance : '---'}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--portal-muted)' }}>
                {game?.availableBalance && game.availableBalance !== '---' ? 'avail' : ''}
              </span>
            </div>
            <button 
              disabled={!game?.availableBalance || game.availableBalance === '---' || game.availableBalance === '$0.00'}
              style={{ 
                padding: '6px 12px', 
                fontSize: '12px', 
                fontWeight: 600, 
                color: (!game?.availableBalance || game.availableBalance === '---' || game.availableBalance === '$0.00') ? 'var(--portal-muted)' : 'var(--portal-purple)', 
                background: (!game?.availableBalance || game.availableBalance === '---' || game.availableBalance === '$0.00') ? '#f3f4f6' : 'var(--portal-purple-soft)', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: (!game?.availableBalance || game.availableBalance === '---' || game.availableBalance === '$0.00') ? 'not-allowed' : 'pointer' 
              }}
            >
              Withdraw
            </button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--portal-muted)' }}>
            Total Rev: {game?.revenue || '---'} | Escrow: {game?.escrowedBalance || '---'}
          </p>
        </div>
      </div>

      {/* Storefront Profile Section */}
      <div style={{ marginTop: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', margin: '0 0 6px', fontWeight: 700 }}>Storefront Profile</h2>
            <p style={{ color: 'var(--portal-muted)', fontSize: '14px', margin: 0 }}>
              Manage how your game appears in Randseed.
            </p>
          </div>

          {game?.profile?.savedAt && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--portal-muted)', background: '#f9fafb', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <CheckCircle2 size={13} color="#16a34a" />
              <span>Last updated {new Date(game.profile.savedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--portal-border)', borderRadius: '14px', padding: '24px' }}>
          <div className="onboarding-form">

            {/* Meta Fields: Category, Age Rating, Device Support */}
            <div className="field--wide" style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>
                    Game Meta Attributes <strong style={{ color: '#ef4444' }}>*</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {metaSuccess && (
                    <span style={{ fontSize: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Saved
                    </span>
                  )}
                  <button 
                    onClick={handleSaveMeta}
                    disabled={savingField === "meta"}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: '#fff',
                      color: 'var(--portal-purple)',
                      border: '1px solid var(--portal-purple)',
                      borderRadius: '6px',
                      cursor: savingField === "meta" ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: savingField === "meta" ? 0.7 : 1
                    }}
                  >
                    {savingField === "meta" ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Save Meta Options
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--portal-muted)', marginBottom: '4px' }}>Game Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (formErrors.meta) setFormErrors(prev => ({ ...prev, meta: undefined }));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: formErrors.meta && !category ? '1px solid #ef4444' : '1px solid #dcd7e0', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="" disabled>Select category...</option>
                    {GAME_CATEGORIES.map((gameCategory) => (
                      <option key={gameCategory} value={gameCategory}>{gameCategory}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--portal-muted)', marginBottom: '4px' }}>Age Rating</label>
                  <select 
                    value={ageRating} 
                    onChange={(e) => {
                      setAgeRating(e.target.value);
                      if (formErrors.meta) setFormErrors(prev => ({ ...prev, meta: undefined }));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: formErrors.meta && !ageRating ? '1px solid #ef4444' : '1px solid #dcd7e0', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="" disabled>Select rating...</option>
                    <option value="All Ages">All Ages</option>
                    <option value="18+">18+</option>
                    <option value="NSFW">NSFW</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--portal-muted)', marginBottom: '4px' }}>Device Support</label>
                  <select 
                    value={deviceSupport} 
                    onChange={(e) => {
                      setDeviceSupport(e.target.value);
                      if (formErrors.meta) setFormErrors(prev => ({ ...prev, meta: undefined }));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: formErrors.meta && !deviceSupport ? '1px solid #ef4444' : '1px solid #dcd7e0', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="" disabled>Select support...</option>
                    <option value="PC">PC</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Responsive">Responsive</option>
                  </select>
                </div>
              </div>
              {formErrors.meta && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
                  <AlertCircle size={13} /> {formErrors.meta}
                </div>
              )}
            </div>
            
            {/* Description (Required, Max 500 words, Independent Save) */}
            <div className="field--wide" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>
                    Description <strong style={{ color: '#ef4444' }}>*</strong>
                  </span>
                  <span style={{ fontSize: '12px', color: isWordCountExceeded ? '#ef4444' : 'var(--portal-muted)', fontWeight: isWordCountExceeded ? 600 : 400 }}>
                    {wordCount} / 500 words
                  </span>
                  {descSuccess && (
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Check size={13} /> Saved!
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveDescription}
                  disabled={savingField === "desc"}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: '#fff',
                    color: 'var(--portal-purple)',
                    border: '1px solid var(--portal-purple)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {savingField === "desc" ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save Description
                </button>
              </div>
              <textarea 
                rows={4} 
                placeholder="Describe gameplay mechanics, storyline, controls, and features for players..." 
                value={description} 
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (formErrors.description) {
                    setFormErrors(prev => ({ ...prev, description: undefined }));
                  }
                }}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: formErrors.description ? '1px solid #ef4444' : '1px solid #dcd7e0', 
                  borderRadius: '8px', 
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              {formErrors.description && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  <AlertCircle size={13} /> {formErrors.description}
                </div>
              )}
              <small style={{ color: 'var(--portal-muted)', marginTop: '4px', display: 'block' }}>
                Required. Write a detailed description of your game (up to 500 words).
              </small>
            </div>
            
            {/* Media Assets: Cover Image & Game Animation Side-by-Side (Left and Right) with Independent Save Buttons */}
            <div className="field--wide" style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px', 
              marginBottom: '28px',
              alignItems: 'start'
            }}>
              {/* Left Column: Cover Image (Required, 400x400, max 1MB, Independent Save) */}
              <div style={{ 
                background: '#fafafa', 
                border: formErrors.coverImage ? '1px solid #ef4444' : '1px solid #e5e7eb', 
                borderRadius: '12px', 
                padding: '16px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Cover Image <strong style={{ color: '#ef4444' }}>*</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--portal-muted)' }}>
                      400×400px · Max 1MB
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {coverSuccess && (
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                        Saved!
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveCoverImage}
                      disabled={savingField === "cover"}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: '#fff',
                        color: 'var(--portal-purple)',
                        border: '1px solid var(--portal-purple)',
                        borderRadius: '6px',
                        cursor: savingField === "cover" ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: savingField === "cover" ? 0.7 : 1
                      }}
                    >
                      {savingField === "cover" ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      Save Cover
                    </button>
                  </div>
                </div>

                <MediaUploadField
                  value={coverImage}
                  onChange={setCoverImage}
                  onError={(coverImageError) => setFormErrors((previous) => ({ ...previous, coverImage: coverImageError }))}
                  error={formErrors.coverImage}
                  label="Cover Image"
                  helperText="Recommended 400×400px · PNG, JPG, WebP, or GIF · Max 1 MB"
                  emptyLabel="Upload Cover Image"
                  accept="image/*"
                  mediaKind="image"
                  maxBytes={1 * 1024 * 1024}
                  uploadFile={uploadGameCover}
                  allowLocalPreview
                  allowUrlInput
                  urlPlaceholder="Or paste image URL"
                  previewAspectRatio="1 / 1"
                  showLabel={false}
                />
              </div>

              {/* Right Column: Game Animation (Optional, 480x480, max 10MB, MP4, Independent Save) */}
              <div style={{ 
                background: '#fafafa', 
                border: formErrors.animation ? '1px solid #ef4444' : '1px solid #e5e7eb', 
                borderRadius: '12px', 
                padding: '16px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Game Animation <span style={{ fontWeight: 400, color: 'var(--portal-muted)' }}>(Optional)</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--portal-muted)' }}>
                      480×480px · Max 10MB · MP4
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {animSuccess && (
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                        Saved!
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveAnimation}
                      disabled={savingField === "anim"}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: '#fff',
                        color: 'var(--portal-purple)',
                        border: '1px solid var(--portal-purple)',
                        borderRadius: '6px',
                        cursor: savingField === "anim" ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: savingField === "anim" ? 0.7 : 1
                      }}
                    >
                      {savingField === "anim" ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      Save Animation
                    </button>
                  </div>
                </div>

                <MediaUploadField
                  value={animationUrl}
                  onChange={setAnimationUrl}
                  onError={(animationError) => setFormErrors((previous) => ({ ...previous, animation: animationError }))}
                  error={formErrors.animation}
                  label="Game Animation"
                  helperText="Recommended 480×480px · MP4 only · Max 10 MB"
                  emptyLabel="Upload MP4 Video"
                  accept="video/mp4"
                  mediaKind="video"
                  maxBytes={10 * 1024 * 1024}
                  uploadFile={uploadGameAnimation}
                  allowLocalPreview
                  allowUrlInput
                  urlPlaceholder="Or paste MP4 video URL"
                  previewAspectRatio="1 / 1"
                  showLabel={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
