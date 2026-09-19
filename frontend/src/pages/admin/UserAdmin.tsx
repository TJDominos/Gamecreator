import React, { useEffect, useState } from "react";
import { Plus, Users, ShieldCheck, Gamepad2, Search, Trash2, UserMinus } from "lucide-react";
import { authApi } from "../../services/authApi"; // Wait, authApi doesn't have it. We can just use fetch with token.
import { getAuthToken } from "../../services/authTokenStore";

export function UserAdmin(): React.ReactElement {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("admin");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  
  const handleDelete = async (principalId: string, email: string) => {
    if (!confirm(`Are you sure you want to completely delete the user ${email || principalId}?\n\nWARNING: This action cannot be undone.`)) return;
    
    try {
      const token = getAuthToken();
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ principal_id: principalId })
      });
      
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDemote = async (email: string) => {
    if (!email) return;
    if (!confirm(`Are you sure you want to revoke privileges and demote ${email} to Player?`)) return;
    
    try {
      const token = getAuthToken();
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email, role: "player" })
      });
      
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    try {
      const token = getAuthToken();
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: newEmail, role: newRole })
      });
      
      if (res.ok) {
        setNewEmail("");
        alert(`Successfully assigned ${newRole} role to ${newEmail}`);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  };

  return (
    <div className="admin-page" style={{ maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "24px" }}>User Permissions</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>Manage system roles and administrator access.</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px", marginBottom: "32px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px 0" }}>Add / Update Role</h3>
        <form onSubmit={handleUpdateRole} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input 
            type="email" 
            placeholder="User Email Address" 
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "var(--font-size-sm)" }}
            required
          />
          <select 
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "var(--font-size-sm)", background: "#fff" }}
          >
            <option value="admin">Administrator</option>
            <option value="creator">Creator</option>
            <option value="player">Player</option>
          </select>
          <button type="submit" style={{ padding: "10px 20px", background: "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
            <Plus size={16} /> Save Role
          </button>
        </form>
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <th style={{ padding: "16px", fontSize: "var(--font-size-sm)", fontWeight: 600, color: "#6b7280" }}>Email / Principal</th>
              <th style={{ padding: "16px", fontSize: "var(--font-size-sm)", fontWeight: 600, color: "#6b7280" }}>Role</th>
              <th style={{ padding: "16px", fontSize: "var(--font-size-sm)", fontWeight: 600, color: "#6b7280" }}>Joined</th>
              <th style={{ padding: "16px", fontSize: "var(--font-size-sm)", fontWeight: 600, color: "#6b7280", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.principal_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>{u.email || "No Email"}</div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "#6b7280", marginTop: "2px", fontFamily: "monospace" }}>{u.principal_id}</div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span style={{ 
                      padding: "4px 8px", borderRadius: "6px", fontSize: "var(--font-size-xs)", fontWeight: 600,
                      background: u.role === "admin" ? "#fef3c7" : u.role === "creator" ? "#e0e7ff" : "#f3f4f6",
                      color: u.role === "admin" ? "#92400e" : u.role === "creator" ? "#3730a3" : "#4b5563"
                    }}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
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

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
