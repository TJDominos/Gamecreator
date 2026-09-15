const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/UserAdmin.tsx', 'utf8');

// Add Trash2 icon
code = code.replace(
  'Plus, Users, ShieldCheck, Gamepad2, Search',
  'Plus, Users, ShieldCheck, Gamepad2, Search, Trash2, UserMinus'
);

// Add delete function
const deleteFunc = `
  const handleDelete = async (principalId: string, email: string) => {
    if (!confirm(\`Are you sure you want to completely delete the user \${email || principalId}?\\n\\nWARNING: This action cannot be undone.\`)) return;
    
    try {
      const token = localStorage.getItem("randseed_custom_token");
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { 
          "Authorization": \`Bearer \${token}\`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ principal_id: principalId })
      });
      
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(\`Failed: \${data.error || "Unknown error"}\`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDemote = async (email: string) => {
    if (!email) return;
    if (!confirm(\`Are you sure you want to revoke privileges and demote \${email} to Player?\`)) return;
    
    try {
      const token = localStorage.getItem("randseed_custom_token");
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { 
          "Authorization": \`Bearer \${token}\`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email, role: "player" })
      });
      
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(\`Failed: \${data.error || "Unknown error"}\`);
      }
    } catch (err) {
      console.error(err);
    }
  };
`;

if (!code.includes('handleDelete')) {
  code = code.replace(
    'const handleUpdateRole = async (e: React.FormEvent) => {',
    deleteFunc + '\n  const handleUpdateRole = async (e: React.FormEvent) => {'
  );
  
  // Add Actions column header
  code = code.replace(
    '<th style={{ padding: "16px", fontSize: "12px", fontWeight: 600, color: "#6b7280" }}>Joined</th>',
    '<th style={{ padding: "16px", fontSize: "12px", fontWeight: 600, color: "#6b7280" }}>Joined</th>\n              <th style={{ padding: "16px", fontSize: "12px", fontWeight: 600, color: "#6b7280", textAlign: "right" }}>Actions</th>'
  );
  
  // Add Actions column data
  const actionCols = `
                  <td style={{ padding: "16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      {(u.role === "admin" || u.role === "creator") && u.email && (
                        <button 
                          onClick={() => handleDemote(u.email)}
                          title="Demote to Player"
                          style={{ padding: "6px", background: "transparent", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(u.principal_id, u.email)}
                        title="Delete User"
                        style={{ padding: "6px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
`;
  
  code = code.replace(
    '<td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>\n                    {new Date(u.created_at).toLocaleDateString()}\n                  </td>',
    '<td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>\n                    {new Date(u.created_at).toLocaleDateString()}\n                  </td>' + actionCols
  );

  // Fix colSpan
  code = code.replace(/colSpan=\{3\}/g, 'colSpan={4}');
  
  fs.writeFileSync('src/pages/admin/UserAdmin.tsx', code);
  console.log("Updated UserAdmin.tsx");
}
