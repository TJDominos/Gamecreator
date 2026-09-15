const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/bounties/BountyManagement.tsx', 'utf8');

// 1. Update lucide imports
code = code.replace(
  'Target, Plus, Search, Filter, ShieldCheck, ArrowRight, ArrowLeft, Image as ImageIcon, Trash2',
  'Target, Plus, Search, Filter, ShieldCheck, ArrowRight, ArrowLeft, Image as ImageIcon, Trash2, Upload, X, Loader2, AlertCircle, Save'
);

// 2. Add refs and state for autosave and upload
const stateAdditions = `
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [formErrors, setFormErrors] = useState<{ coverImage?: string }>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  
  const lastSavedFormRef = React.useRef(form);
  const formRef = React.useRef(form);

  React.useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Auto-save logic
  React.useEffect(() => {
    if (view === 'edit' && selectedBounty) {
      // 3 minutes = 180000 ms
      const intervalId = setInterval(() => {
        if (JSON.stringify(formRef.current) !== JSON.stringify(lastSavedFormRef.current)) {
           handleSave(true);
        }
      }, 180000);
      return () => clearInterval(intervalId);
    }
  }, [view, selectedBounty]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, coverImage: "File size exceeds the 10 MB limit." }));
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'video/mp4') {
      setFormErrors(prev => ({ ...prev, coverImage: "Only PNG, JPEG, WebP, and MP4 files are supported." }));
      return;
    }

    setFormErrors(prev => ({ ...prev, coverImage: undefined }));
    setIsUploadingCover(true);

    try {
      const token = localStorage.getItem("randseed_custom_token");
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch("/api/admin/bounties/media", {
        method: "PUT",
        headers: { "Authorization": \`Bearer \${token}\` },
        body: formData
      });
      
      const result = await res.json();
      if (result.url) {
        setForm({...formRef.current, thumbnailUrl: result.url});
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setForm({...formRef.current, thumbnailUrl: reader.result});
        }
      };
      reader.readAsDataURL(file);
      setFormErrors(prev => ({ ...prev, coverImage: err instanceof Error ? err.message : "Cloud upload failed, using local preview" }));
    } finally {
      setIsUploadingCover(false);
    }
  };
`;

code = code.replace(
  "const [form, setForm] = useState({",
  stateAdditions + "\n  const [form, setForm] = useState({"
);

// 3. Update handleSave to accept isAutoSave
code = code.replace(
  'const handleSave = () => {',
  'const handleSave = (isAutoSave: boolean = false) => {\n    if (isAutoSave) setAutoSaveStatus("Saving...");'
);

code = code.replace(
  `    .then(() => {
      fetchBounties();
      setView('list');
    })`,
  `    .then(() => {
      fetchBounties();
      lastSavedFormRef.current = form;
      if (isAutoSave) {
        setAutoSaveStatus("Saved at " + new Date().toLocaleTimeString());
        setLoading(false);
      } else {
        setView('list');
      }
    })`
);

code = code.replace(
  `      alert("Failed to save bounty");
      setLoading(false);
    });`,
  `      if (isAutoSave) {
        setAutoSaveStatus("Auto-save failed");
      } else {
        alert("Failed to save bounty");
      }
      setLoading(false);
    });`
);

// 4. Update the UI for thumbnailUrl
const originalThumbnailUi = `<div className="field field--wide">
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Thumbnail URL</span>
                <input type="url" placeholder="https://" value={form.thumbnailUrl} onChange={e => setForm({...form, thumbnailUrl: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #dcd7e0', borderRadius: '8px' }} />
              </div>`;

const newThumbnailUi = `<div className="field field--wide">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Thumbnail Image / Video
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--portal-muted)' }}>
                      Supports .png, .jpg, .webp, .mp4 | 480x270 or 1920x1080 | Max 10MB
                    </div>
                  </div>
                </div>

                {isUploadingCover ? (
                  <div style={{ padding: '36px 16px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px dashed var(--portal-purple)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 size={24} className="animate-spin" color="var(--portal-purple)" />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--portal-purple)' }}>Uploading to Cloud Storage...</span>
                  </div>
                ) : form.thumbnailUrl ? (
                  <div style={{ padding: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '120px', height: '67px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d1d5db', background: '#000', flexShrink: 0 }}>
                        {form.thumbnailUrl.endsWith('.mp4') || form.thumbnailUrl.startsWith('data:video') ? (
                          <video src={form.thumbnailUrl} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img 
                            src={form.thumbnailUrl} 
                            alt="Thumbnail preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/480x270?text=Invalid+Media';
                            }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Media Ready</div>
                        <div style={{ fontSize: '11px', color: 'var(--portal-muted)', wordBreak: 'break-all', marginTop: '2px' }}>
                          {form.thumbnailUrl.startsWith('data:') ? 'Local preview' : form.thumbnailUrl.slice(0, 45) + (form.thumbnailUrl.length > 45 ? '...' : '')}
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
                        onClick={() => setForm({...form, thumbnailUrl: ''})}
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
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--portal-purple-soft)', color: 'var(--portal-purple)', display: 'grid', placeItems: 'center', marginBottom: '8px' }}>
                      <ImageIcon size={20} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
                      Upload Media
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--portal-muted)' }}>
                      Click to browse files
                    </div>
                  </div>
                )}
                <input 
                  ref={imageInputRef} 
                  type="file" 
                  accept="image/*,video/mp4" 
                  onChange={handleImageUpload} 
                  style={{ display: 'none' }} 
                />
                
                {formErrors.coverImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', marginTop: '6px' }}>
                    <AlertCircle size={12} /> {formErrors.coverImage}
                  </div>
                )}
                
                {/* Fallback URL input */}
                <div style={{ marginTop: '8px' }}>
                  <input 
                    type="url" 
                    placeholder="Or paste media URL" 
                    value={form.thumbnailUrl.startsWith('data:') ? '' : form.thumbnailUrl} 
                    onChange={e => {
                      setForm({...form, thumbnailUrl: e.target.value});
                      setFormErrors(prev => ({ ...prev, coverImage: undefined }));
                    }} 
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dcd7e0', borderRadius: '8px', fontSize: '13px' }} 
                  />
                </div>
              </div>`;

code = code.replace(originalThumbnailUi, newThumbnailUi);

// 5. Add AutoSave status indicator near the Save button
code = code.replace(
  '<button className="primary-action" onClick={() => handleSave()}>Save Changes</button>',
  `
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    {autoSaveStatus && <span style={{ fontSize: '12px', color: 'var(--portal-muted)', fontWeight: 500 }}>{autoSaveStatus}</span>}
    <button className="primary-action" onClick={() => handleSave()} disabled={loading}>
      {loading && !autoSaveStatus ? "Saving..." : "Save Changes"}
    </button>
  </div>`
);

fs.writeFileSync('src/pages/dashboard/bounties/BountyManagement.tsx', code);
console.log("Updated BountyManagement.tsx");
