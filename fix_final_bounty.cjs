const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/bounties/BountyManagement.tsx', 'utf8');

// I will just locate the exact string block to remove.
const duplicateFormRegex = /  const \[form, setForm\] = useState\(\{[\s\S]*?\}\) as \{ type: string; name\?: string; url: string; thumbnail: string; \}\[\]\n  \}\);\n/m;
code = code.replace(duplicateFormRegex, '');

// Wait, the error lines were:
// src/pages/dashboard/bounties/BountyManagement.tsx(42,10): error TS2451: Cannot redeclare block-scoped variable 'form'.
// src/pages/dashboard/bounties/BountyManagement.tsx(74,9): error TS2451: Cannot redeclare block-scoped variable 'handleImageUpload'.
// src/pages/dashboard/bounties/BountyManagement.tsx(139,9): error TS2451: Cannot redeclare block-scoped variable 'handleImageUpload'.
// src/pages/dashboard/bounties/BountyManagement.tsx(187,10): error TS2451: Cannot redeclare block-scoped variable 'form'.

// Let's just remove everything between "const itemsPerPage = 20;" and "const handleEdit = (b: Bounty) => {" and put the exact correct block.
const startStr = "const itemsPerPage = 20;";
const endStr = "const handleEdit = (b: Bounty) => {";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = `const itemsPerPage = 20;

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
  code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
  fs.writeFileSync('src/pages/dashboard/bounties/BountyManagement.tsx', code);
  console.log("Fixed cleanly.");
} else {
  console.log("Failed to find boundaries");
}
