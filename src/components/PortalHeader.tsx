import React, { useState } from "react";
import { ChevronDown, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";

export interface PortalHeaderProps {
  pageName: string;
  onMenuClick: () => void;
}

export function PortalHeader({ pageName, onMenuClick }: PortalHeaderProps): React.ReactElement {
  const { accountId, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);

  function handleSignOut(): void {
    signOut();
    navigate("/", { replace: true });
  }

  return (
    <header className="portal-topbar">
      <button
        className="portal-menu-button"
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu />
      </button>
      <div>
        <small>Developer Portal</small>
        <strong>{pageName}</strong>
      </div>
      <div className="portal-account">
        <button
          type="button"
          onClick={() => setAccountOpen((current) => !current)}
          aria-expanded={accountOpen}
        >
          <span>{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : "D"}</span>
          <span>
            <strong>{profile?.username || "Developer"}</strong>
            <small>{accountId?.slice(0, 14)}</small>
          </span>
          <ChevronDown />
        </button>
        {accountOpen && (
          <div className="account-menu">
            <button type="button" onClick={handleSignOut}>
              <LogOut /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
