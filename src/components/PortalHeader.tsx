import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, LogOut, Menu, Building2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";

export interface PortalHeaderProps {
  pageName: string;
  onMenuClick: () => void;
}

export function PortalHeader({ pageName, onMenuClick }: PortalHeaderProps): React.ReactElement {
  const { profile, organization, signOut } = useAuth();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSignOut(): void {
    signOut();
    navigate("/", { replace: true });
  }

  return (
    <header className="portal-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          className="portal-menu-button"
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu />
        </button>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }} className="portal-page-title hidden sm:inline">
          {pageName}
        </span>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div className="portal-account" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => setAccountOpen((current) => !current)}
            aria-expanded={accountOpen}
          >
            <span>{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : "D"}</span>
            <span>
              <strong>{profile?.username || "Creator"}</strong>
            </span>
            <ChevronDown />
          </button>
          {accountOpen && (
            <div className="account-menu">
              {organization?.name && (
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", fontSize: "12px", color: "#64748b" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "#0f172a" }}>
                    <Building2 size={13} /> {organization.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                    {organization.organizationId}
                  </div>
                </div>
              )}
              <button type="button" className="text-body" onClick={handleSignOut}>
                <LogOut /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
