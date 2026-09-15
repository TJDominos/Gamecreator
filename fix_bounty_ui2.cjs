const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/bounties/BountyManagement.tsx', 'utf8');

// I will re-insert the missing functions and hooks inside BountyManagement right after `itemsPerPage = 20;`

const toInsert = `
  const [form, setForm] = useState({
    title: '', category: 'Arcade' as Category, shortDesc: '', fullDesc: '', thumbnailUrl: '',
    poolAmount: 0, currency: 'WLT' as 'WLT' | 'USD', maxParticipants: 100, participationEndDate: '',
    releaseDate: '', distributionDate: '', settlementRules: 'Default Distribution Algorithm',
    examples: [{ type: 'image', name: '', url: '', thumbnail: '' }] as { type: string; name?: string; url: string; thumbnail: string; }[]
  });

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

// Remove the faulty pieces first
code = code.replace(/const imageInputRef[\s\S]*?React\.useEffect\(\(\) => \{\n    formRef\.current = form;\n  \}, \[form\]\);\n/, '');
code = code.replace(/const \[form, setForm\] = useState\(\{[\s\S]*?\}\) as \{ type: string; name\?: string; url: string; thumbnail: string; \}\[\]\n  \}\);/, '');

code = code.replace('const itemsPerPage = 20;', 'const itemsPerPage = 20;\n' + toInsert);

fs.writeFileSync('src/pages/dashboard/bounties/BountyManagement.tsx', code);
console.log("Restored missing code");
