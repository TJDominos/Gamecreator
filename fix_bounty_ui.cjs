const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/bounties/BountyManagement.tsx', 'utf8');

if (!code.includes('fetchBounties')) {
  // Add useEffect and fetch
  code = code.replace(
    'const [bounties, setBounties] = useState<Bounty[]>(MOCK_BOUNTIES);',
    `const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchBounties();
  }, []);

  const fetchBounties = async () => {
    try {
      const token = localStorage.getItem("randseed_custom_token");
      const res = await fetch("/api/admin/bounties", {
        headers: { "Authorization": \`Bearer \${token}\` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bounties) setBounties(data.bounties);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };`
  );

  // Update handleSave to call POST/PUT
  code = code.replace(
    `    // In a real app, this would make an API call.\n    alert(\`Bounty Saved: \${form.title}\`);\n    setView('list');`,
    `    setLoading(true);
    const token = localStorage.getItem("randseed_custom_token");
    const isEdit = !!selectedBounty;
    const url = isEdit ? \`/api/admin/bounties/\${selectedBounty.id}\` : "/api/admin/bounties";
    const method = isEdit ? "PUT" : "POST";
    
    fetch(url, {
      method,
      headers: {
        "Authorization": \`Bearer \${token}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    })
    .then(res => res.json())
    .then(() => {
      fetchBounties();
      setView('list');
    })
    .catch(err => {
      console.error(err);
      alert("Failed to save bounty");
      setLoading(false);
    });`
  );
  
  // Update handleDelete inside view='edit' (there is none yet, let's just make sure it uses it)
  // Or we can add a simple console log
  fs.writeFileSync('src/pages/dashboard/bounties/BountyManagement.tsx', code);
  console.log("Updated BountyManagement.tsx");
}
