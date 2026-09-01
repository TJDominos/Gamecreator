import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { WalletConnectModal } from "./WalletConnectModal";
import { BecomeCreatorModal } from "./BecomeCreatorModal";
import { Menu, X } from "lucide-react";
import "../developer-landing/DeveloperLanding.css";

function getPortalPath(hasOrganization: boolean): string {
  return hasOrganization ? "/dashboard" : "/onboarding";
}

export function SiteHeader(): React.ReactElement {
  const { isSignedIn, organization, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isWalletConnectModalOpen, setWalletConnectModalOpen] = useState(false);
  const [isBecomeCreatorModalOpen, setBecomeCreatorModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const signInButtonRef = useRef<HTMLButtonElement>(null);

  function openPortal(): void {
    if (isSignedIn) {
      if (organization) {
        navigate("/dashboard");
      } else {
        setBecomeCreatorModalOpen(true);
      }
      return;
    }
    setWalletConnectModalOpen(true);
  }

  function handleWalletConnectClose(verifiedId?: string): void {
    setWalletConnectModalOpen(false);
    if (typeof verifiedId === "string") {
      signIn(verifiedId);
      if (organization) {
        navigate("/dashboard");
      }
    }
    signInButtonRef.current?.focus();
  }

  return (
    <>
      <header className="landing-nav">
        <div className="landing-container landing-nav__inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a className="landing-brand" href="/" aria-label="Creator Center home">
            <img src="https://storage.randseed.org/Logo/Logo.png" alt="Creator Center Logo" className="landing-brand__mark" style={{ borderRadius: '50%' }} />
            <span className="landing-brand__text">Creator Center</span>
          </a>
          
          <div className="landing-nav__desktop-actions">
            <a 
              className={`landing-nav__guide text-black decoration-purple-300 decoration-2 underline-offset-4 ${location.pathname.startsWith("/bounties") ? 'underline text-purple-600' : 'no-underline hover:underline hover:text-purple-300'}`} 
              href="/bounties"
            >
              Creator Bounties
            </a>
            <a 
              className={`landing-nav__guide text-black decoration-purple-300 decoration-2 underline-offset-4 ${location.pathname.startsWith("/guides") ? 'underline text-purple-600' : 'no-underline hover:underline hover:text-purple-300'}`} 
              href="/guides"
            >
              Creator Guide
            </a>
            <button
              ref={signInButtonRef}
              className="btn btn--solid"
              type="button"
              onClick={openPortal}
            >
              {isSignedIn ? (organization ? "Dashboard" : "Build Game") : "Sign In"}
            </button>
          </div>

          <div className="landing-nav__mobile-actions">
            <button
              ref={signInButtonRef}
              className="btn btn--solid"
              type="button"
              onClick={openPortal}
            >
              {isSignedIn ? (organization ? "Dashboard" : "Build Game") : "Sign In"}
            </button>
            <button 
              className="landing-nav__hamburger"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="landing-nav__mobile-menu">
            <a 
              className={`landing-nav__guide-mobile text-black decoration-purple-300 decoration-2 underline-offset-4 ${location.pathname.startsWith("/bounties") ? 'underline text-purple-600' : 'no-underline hover:underline hover:text-purple-300'}`} 
              href="/bounties"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Creator Bounties
            </a>
            <a 
              className={`landing-nav__guide-mobile text-black decoration-purple-300 decoration-2 underline-offset-4 ${location.pathname.startsWith("/guides") ? 'underline text-purple-600' : 'no-underline hover:underline hover:text-purple-300'}`} 
              href="/guides"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Creator Guide
            </a>
          </div>
        )}
      </header>
      <WalletConnectModal
        isOpen={isWalletConnectModalOpen}
        onClose={handleWalletConnectClose}
      />
      <BecomeCreatorModal 
        isOpen={isBecomeCreatorModalOpen}
        onClose={() => setBecomeCreatorModalOpen(false)}
      />
    </>
  );
}
