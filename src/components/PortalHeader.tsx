import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";

export interface PortalHeaderProps {
  pageName: string;
  onMenuClick: () => void;
}

export function PortalHeader({ pageName, onMenuClick }: PortalHeaderProps): React.ReactElement {
  const { profile, signOut } = useAuth();
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
      <button
        className="portal-menu-button"
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu />
      </button>
      
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
            <button type="button" className="text-body" onClick={handleSignOut}>
              <LogOut /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
