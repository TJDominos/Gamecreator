const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/bounties/BountyManagement.tsx', 'utf8');

// Fix 1: Move form state declaration above refs
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
`;

// wait, the script originally injected stateAdditions before `const [form, setForm] = useState`. I need to swap them.
code = code.replace(
  /const imageInputRef[\s\S]*?React\.useEffect\(\(\) => \{\n    formRef\.current = form;\n  \}, \[form\]\);\n/,
  ''
);

const formStateRegex = /const \[form, setForm\] = useState\(\{[\s\S]*?\}\) as \{ type: string; name\?: string; url: string; thumbnail: string; \}.*?\}\);/m;
const match = code.match(formStateRegex);

if (match) {
  code = code.replace(match[0], match[0] + '\n\n' + stateAdditions);
}

// Fix 2: onClick={() => handleSave()} to avoid passing the event object as isAutoSave
code = code.replace(
  'onClick={handleSave}',
  'onClick={() => handleSave(false)}'
);
// wait, the previous code had `onClick={() => handleSave()}` but maybe I missed a spot. Let's check:
code = code.replace(
  'onClick={(e) => handleSave(e)}',
  'onClick={() => handleSave(false)}'
);
code = code.replace(
  '<button className="primary-action" onClick={() => handleSave()} disabled={loading}>',
  '<button className="primary-action" onClick={() => handleSave(false)} disabled={loading}>'
);

fs.writeFileSync('src/pages/dashboard/bounties/BountyManagement.tsx', code);
console.log("Fixed TS errors");
