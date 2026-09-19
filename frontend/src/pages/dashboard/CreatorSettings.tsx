import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { authApi } from "../../services/authApi";
import { Save, AlertTriangle, CheckCircle2, Building, Wallet, Loader2 } from "lucide-react";

export function CreatorSettings() {
  const { profile, updateProfile } = useAuth();
  
  // State for Organization Name
  const [orgName, setOrgName] = useState(profile?.creatorOrgName || "");
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState(false);
  
  // State for Withdrawal Address
  const [withdrawalToken, setWithdrawalToken] = useState(profile?.withdrawalToken || "USDT");
  const [withdrawalNetwork, setWithdrawalNetwork] = useState(profile?.withdrawalNetwork || "TRC20");
  const [withdrawalAddress, setWithdrawalAddress] = useState(profile?.withdrawalAddress || "");
  
  const [isSavingWithdrawal, setIsSavingWithdrawal] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState("");

  // Populate state on load if profile changes
  useEffect(() => {
    if (profile) {
      setOrgName(profile.creatorOrgName || "");
      if (profile.withdrawalToken) setWithdrawalToken(profile.withdrawalToken);
      if (profile.withdrawalNetwork) setWithdrawalNetwork(profile.withdrawalNetwork);
      if (profile.withdrawalAddress) setWithdrawalAddress(profile.withdrawalAddress);
    }
  }, [profile]);

  const canUpdateWithdrawal = () => {
    if (!profile?.withdrawalUpdatedAt) return true;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return (now - profile.withdrawalUpdatedAt) >= oneMonth;
  };

  const nextUpdateDate = profile?.withdrawalUpdatedAt 
    ? new Date(profile.withdrawalUpdatedAt + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    : null;

  const isWithdrawalLocked = !canUpdateWithdrawal();

  const handleSaveOrgName = async () => {
    setIsSavingOrg(true);
    try {
      await authApi.updateProfile({ creator_org_name: orgName });
      if (profile) {
        updateProfile({ ...profile, creatorOrgName: orgName });
      }
      setOrgSuccess(true);
      setTimeout(() => setOrgSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleSaveWithdrawal = async () => {
    if (isWithdrawalLocked) return;
    
    if (!withdrawalAddress.trim()) {
      setWithdrawalError("Address cannot be empty");
      return;
    }

    setIsSavingWithdrawal(true);
    setWithdrawalError("");
    try {
      await authApi.updateProfile({
        withdrawal_token: withdrawalToken,
        withdrawal_network: withdrawalNetwork,
        withdrawal_address: withdrawalAddress,
      });
      
      const now = Date.now();
      if (profile) {
        updateProfile({ 
          ...profile, 
          withdrawalToken, 
          withdrawalNetwork, 
          withdrawalAddress,
          withdrawalUpdatedAt: now
        });
      }
      setWithdrawalSuccess(true);
      setTimeout(() => setWithdrawalSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setWithdrawalError(err.message || "Failed to update withdrawal address");
    } finally {
      setIsSavingWithdrawal(false);
    }
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0", color: "#111827" }}>
          Creator Settings
        </h1>
        <p style={{ margin: 0, color: "var(--portal-muted)", fontSize: "14px" }}>
          Manage your creator profile and withdrawal accounts.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Creator Organization Name */}
        <div style={{ background: "#fff", border: "1px solid var(--portal-border)", borderRadius: "14px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--portal-purple-soft)", display: "grid", placeItems: "center", color: "var(--portal-purple)" }}>
              <Building size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#111827" }}>Creator Organization Name</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--portal-muted)" }}>Optional display name for your creator entity.</p>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input 
              type="text" 
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Games"
              style={{ flex: 1, padding: "10px 14px", border: "1px solid #dcd7e0", borderRadius: "8px", fontSize: "14px", background: "#fff" }}
            />
            <button 
              onClick={handleSaveOrgName}
              disabled={isSavingOrg}
              style={{
                padding: "10px 16px",
                background: "var(--portal-purple)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: isSavingOrg ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                opacity: isSavingOrg ? 0.7 : 1
              }}
            >
              {isSavingOrg ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Name
            </button>
          </div>
          {orgSuccess && (
            <div style={{ marginTop: "12px", fontSize: "12px", color: "#16a34a", display: "flex", alignItems: "center", gap: "4px" }}>
              <CheckCircle2 size={14} /> Organization name updated
            </div>
          )}
        </div>

        {/* Withdrawal Address */}
        <div style={{ background: "#fff", border: "1px solid var(--portal-border)", borderRadius: "14px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--portal-purple-soft)", display: "grid", placeItems: "center", color: "var(--portal-purple)" }}>
              <Wallet size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#111827" }}>Creator Withdrawal Address</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--portal-muted)" }}>
                Currently supports Crypto Payment. For security, you can only modify this <strong>once per month</strong>.
              </p>
            </div>
          </div>

          {isWithdrawalLocked && (
            <div style={{ marginBottom: "20px", padding: "12px 16px", background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "8px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ fontSize: "13px", color: "#92400e", lineHeight: 1.5 }}>
                <strong>Modification Locked</strong><br />
                You have already updated your withdrawal address within the last 30 days. You can change it again after <strong>{nextUpdateDate}</strong>.
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#374151", marginBottom: "6px", fontWeight: 500 }}>Token (币种)</label>
              <select 
                value={withdrawalToken}
                onChange={(e) => setWithdrawalToken(e.target.value)}
                disabled={isWithdrawalLocked}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #dcd7e0", borderRadius: "8px", fontSize: "14px", background: isWithdrawalLocked ? "#f9fafb" : "#fff" }}
              >
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#374151", marginBottom: "6px", fontWeight: 500 }}>Network (网络)</label>
              <select 
                value={withdrawalNetwork}
                onChange={(e) => setWithdrawalNetwork(e.target.value)}
                disabled={isWithdrawalLocked}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #dcd7e0", borderRadius: "8px", fontSize: "14px", background: isWithdrawalLocked ? "#f9fafb" : "#fff" }}
              >
                <option value="TRC20">Tron (TRC20)</option>
                <option value="ERC20">Ethereum (ERC20)</option>
                <option value="BEP20">BNB Smart Chain (BEP20)</option>
                <option value="SOL">Solana (SOL)</option>
                <option value="TON">TON</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#374151", marginBottom: "6px", fontWeight: 500 }}>Account Address (账户)</label>
            <input 
              type="text"
              value={withdrawalAddress}
              onChange={(e) => setWithdrawalAddress(e.target.value)}
              disabled={isWithdrawalLocked}
              placeholder="Enter your crypto wallet address..."
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #dcd7e0", borderRadius: "8px", fontSize: "14px", background: isWithdrawalLocked ? "#f9fafb" : "#fff", boxSizing: "border-box" }}
            />
          </div>

          {withdrawalError && (
            <div style={{ marginBottom: "16px", padding: "10px 12px", background: "#fff7f7", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertTriangle size={14} /> {withdrawalError}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-end" }}>
            {withdrawalSuccess && (
              <span style={{ fontSize: "12px", color: "#16a34a", display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle2 size={14} /> Address updated successfully
              </span>
            )}
            <button 
              onClick={handleSaveWithdrawal}
              disabled={isSavingWithdrawal || isWithdrawalLocked}
              style={{
                padding: "10px 20px",
                background: "var(--portal-purple)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: (isSavingWithdrawal || isWithdrawalLocked) ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                opacity: (isSavingWithdrawal || isWithdrawalLocked) ? 0.5 : 1
              }}
            >
              {isSavingWithdrawal ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Withdrawal Info
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
