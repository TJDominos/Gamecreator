import React, { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Activity, 
  CircleDollarSign, 
  Bell, 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Video, 
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Save
} from "lucide-react";
import { Link, useParams, useOutletContext } from "react-router";
import { GameStatus, StatusLabels } from "./GameConsole";
import { getGameById, updateGame, GAMES_UPDATED_EVENT } from "./gameData";
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

  // Media upload progress states
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAnimation, setIsUploadingAnimation] = useState(false);

  const [formErrors, setFormErrors] = useState<{ description?: string; coverImage?: string; animation?: string; meta?: string }>({});

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  // Handle production image upload with 1MB limit and 400x400 recommendation
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gameId) return;

    if (file.size > 1 * 1024 * 1024) {
      setFormErrors(prev => ({
        ...prev,
        coverImage: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 1 MB limit.`
      }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFormErrors(prev => ({
        ...prev,
        coverImage: "Only image files (PNG, JPEG, WebP, GIF) are supported."
      }));
      return;
    }

    setFormErrors(prev => ({ ...prev, coverImage: undefined }));
    setIsUploadingCover(true);

    try {
      const result = await gameApi.uploadMedia(gameId, file, 'cover');
      if (result.url) {
        setCoverImage(result.url);
      }
    } catch (err) {
      // Fallback: local FileReader dataUrl preview if network upload is unavailable
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCoverImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
      setFormErrors(prev => ({
        ...prev,
        coverImage: err instanceof Error ? err.message : "Cloud upload failed, using local preview"
      }));
    } finally {
      setIsUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle production video upload with 10MB limit and MP4 format check
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gameId) return;

    // Check format
    if (!file.type.includes('mp4') && !file.name.toLowerCase().endsWith('.mp4')) {
      setFormErrors(prev => ({
        ...prev,
        animation: "Invalid format. Only MP4 videos are supported."
      }));
      return;
    }

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFormErrors(prev => ({
        ...prev,
        animation: `Video size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 10 MB limit.`
      }));
      return;
    }

    setFormErrors(prev => ({ ...prev, animation: undefined }));
    setIsUploadingAnimation(true);

    try {
      const result = await gameApi.uploadMedia(gameId, file, 'animation');
      if (result.url) {
        setAnimationUrl(result.url);
      }
    } catch (err) {
      // Fallback: local FileReader dataUrl preview if network upload is unavailable
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAnimationUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
      setFormErrors(prev => ({
        ...prev,
        animation: err instanceof Error ? err.message : "Cloud upload failed, using local preview"
      }));
    } finally {
      setIsUploadingAnimation(false);
      if (e.target) e.target.value = '';
    }
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
                    <option value="Arcade">Arcade</option>
                    <option value="Card & Board">Card & Board</option>
                    <option value="Casino">Casino</option>
                    <option value="Music">Music</option>
                    <option value="Puzzle">Puzzle</option>
                    <option value="Role-Playing">Role-Playing</option>
                    <option value="Simulation">Simulation</option>
                    <option value="Sports">Sports</option>
                    <option value="Strategy">Strategy</option>
                    <option value="Trivia">Trivia</option>
                    <option value="Word">Word</option>
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

                {isUploadingCover ? (
                  <div style={{ padding: '36px 16px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px dashed var(--portal-purple)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 size={24} className="animate-spin" color="var(--portal-purple)" />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--portal-purple)' }}>Uploading to Cloud Storage...</span>
                    <span style={{ fontSize: '11px', color: 'var(--portal-muted)' }}>Generating CDN public URL</span>
                  </div>
                ) : coverImage ? (
                  <div style={{ padding: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d1d5db', background: '#000', flexShrink: 0 }}>
                        <img 
                          src={coverImage} 
                          alt="Cover preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/400x400?text=Invalid+Image';
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Cover Ready</div>
                        <div style={{ fontSize: '11px', color: 'var(--portal-muted)', wordBreak: 'break-all', marginTop: '2px' }}>
                          {coverImage.startsWith('data:') ? 'Local preview' : coverImage.slice(0, 45) + (coverImage.length > 45 ? '...' : '')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        onClick={() => imageInputRef.current?.click()}
                        style={{ padding: '6px 10px', fontSize: '12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Upload size={12} /> Replace
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setCoverImage('')}
                        style={{ padding: '6px 10px', fontSize: '12px', background: '#fff', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <X size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    style={{ 
                      border: formErrors.coverImage ? '2px dashed #ef4444' : '2px dashed #d1d5db', 
                      borderRadius: '8px', 
                      padding: '24px 16px', 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      background: '#fff',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--portal-purple)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = formErrors.coverImage ? '#ef4444' : '#d1d5db')}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--portal-purple-soft)', color: 'var(--portal-purple)', display: 'grid', placeItems: 'center', marginBottom: '8px' }}>
                      <ImageIcon size={20} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
                      Upload Cover Image
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--portal-muted)' }}>
                      PNG, JPG, WebP up to 1 MB
                    </div>
                  </div>
                )}

                <input 
                  ref={imageInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={{ display: 'none' }} 
                />

                {/* Alternative URL input */}
                <div style={{ marginTop: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Or paste image URL" 
                    value={coverImage.startsWith('data:') ? '' : coverImage} 
                    onChange={(e) => {
                      setCoverImage(e.target.value);
                      if (formErrors.coverImage) setFormErrors(prev => ({ ...prev, coverImage: undefined }));
                    }}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #dcd7e0', borderRadius: '6px', fontSize: '12px' }}
                  />
                </div>

                {formErrors.coverImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', marginTop: '6px' }}>
                    <AlertCircle size={12} /> {formErrors.coverImage}
                  </div>
                )}
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

                {isUploadingAnimation ? (
                  <div style={{ padding: '36px 16px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px dashed var(--portal-purple)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 size={24} className="animate-spin" color="var(--portal-purple)" />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--portal-purple)' }}>Uploading to Cloud Storage...</span>
                    <span style={{ fontSize: '11px', color: 'var(--portal-muted)' }}>Processing MP4 stream</span>
                  </div>
                ) : animationUrl ? (
                  <div style={{ padding: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d1d5db', background: '#000', flexShrink: 0 }}>
                        <video 
                          src={animationUrl} 
                          controls 
                          muted 
                          loop 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Animation Ready</div>
                        <div style={{ fontSize: '11px', color: 'var(--portal-muted)', wordBreak: 'break-all', marginTop: '2px' }}>
                          {animationUrl.startsWith('data:') ? 'Local MP4 preview' : animationUrl.slice(0, 45) + (animationUrl.length > 45 ? '...' : '')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        onClick={() => videoInputRef.current?.click()}
                        style={{ padding: '6px 10px', fontSize: '12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Upload size={12} /> Replace
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setAnimationUrl('')}
                        style={{ padding: '6px 10px', fontSize: '12px', background: '#fff', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <X size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => videoInputRef.current?.click()}
                    style={{ 
                      border: formErrors.animation ? '2px dashed #ef4444' : '2px dashed #d1d5db', 
                      borderRadius: '8px', 
                      padding: '24px 16px', 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      background: '#fff',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--portal-purple)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = formErrors.animation ? '#ef4444' : '#d1d5db')}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ede9fe', color: 'var(--portal-purple)', display: 'grid', placeItems: 'center', marginBottom: '8px' }}>
                      <Video size={20} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
                      Upload MP4 Video
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--portal-muted)' }}>
                      MP4 video only, up to 10 MB
                    </div>
                  </div>
                )}

                <input 
                  ref={videoInputRef} 
                  type="file" 
                  accept="video/mp4,video/*" 
                  onChange={handleVideoUpload} 
                  style={{ display: 'none' }} 
                />

                {/* Alternative video URL */}
                <div style={{ marginTop: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Or paste MP4 video URL" 
                    value={animationUrl.startsWith('data:') ? '' : animationUrl} 
                    onChange={(e) => setAnimationUrl(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #dcd7e0', borderRadius: '6px', fontSize: '12px' }}
                  />
                </div>

                {formErrors.animation && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', marginTop: '6px' }}>
                    <AlertCircle size={12} /> {formErrors.animation}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
