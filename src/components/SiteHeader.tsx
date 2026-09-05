import React, { useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { BecomeCreatorModal } from "./BecomeCreatorModal";
import { Menu, X } from "lucide-react";
import "../pages/home/DeveloperLanding.css";

function getPortalPath(hasOrganization: boolean): string {
  return hasOrganization ? "/dashboard" : "/onboarding";
}

export function SiteHeader(): React.ReactElement {
  const { isSignedIn, profile, signInWithSSO } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isBecomeCreatorModalOpen, setBecomeCreatorModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const signInButtonRef = useRef<HTMLButtonElement>(null);

  function openPortal(): void {
    if (isSignedIn) {
      if (profile?.role === 'creator' || profile?.role === 'admin') {
        navigate("/dashboard");
      } else {
        setBecomeCreatorModalOpen(true);
      }
      return;
    }
    signInWithSSO();
  }

  return (
    <>
      <header className="landing-nav">
        <div className="landing-container landing-nav__inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link className="landing-brand" to="/" aria-label="Creator Center home">
            <img src="https://storage.randseed.org/Logo/Logo.png" alt="Creator Center Logo" className="landing-brand__mark" style={{ borderRadius: '50%' }} />
            <span className="landing-brand__text">Creator Center</span>
          </Link>
          
          <div className="landing-nav__desktop-actions flex items-center">
            <Link 
              className={`landing-nav__guide text-black decoration-purple-300 decoration-2 underline-offset-4 ${location.pathname.startsWith("/bounties") ? 'underline text-purple-600' : 'no-underline hover:underline hover:text-purple-300'}`} 
              to="/bounties"
            >
              Creator Bounties
            </Link>
            <Link 
              className={`landing-nav__guide text-black decoration-purple-300 decoration-2 underline-offset-4 ${location.pathname.startsWith("/guides") ? 'underline text-purple-600' : 'no-underline hover:underline hover:text-purple-300'}`} 
              to="/guides"
            >
              Creator Guide
            </Link>
            <button
              ref={signInButtonRef}
              className="btn btn--solid"
              type="button"
              onClick={openPortal}
            >
              {isSignedIn ? ((profile?.role === 'creator' || profile?.role === 'admin') ? "My Games" : "Build Game") : "Sign In"}
            </button>
          </div>
          <div className="landing-nav__mobile-actions flex items-center gap-2">
            <button
              ref={signInButtonRef}
              className="btn btn--solid"
              type="button"
              onClick={openPortal}
            >
              {isSignedIn ? ((profile?.role === 'creator' || profile?.role === 'admin') ? "My Games" : "Build Game") : "Sign In"}
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
            <Link 
              className={`landing-nav__guide-mobile text-black decoration-purple-300 decoration-2 underline-offset-4 ${location.pathname.startsWith("/bounties") ? 'underline text-purple-600' : 'no-underline hover:underline hover:text-purple-300'}`} 
              to="/bounties"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Creator Bounties
            </Link>
            <Link 
              className={`landing-nav__guide-mobile text-black decoration-purple-300 decoration-2 underline-offset-4 ${location.pathname.startsWith("/guides") ? 'underline text-purple-600' : 'no-underline hover:underline hover:text-purple-300'}`} 
              to="/guides"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Creator Guide
            </Link>
          </div>
        )}
      </header>
      <BecomeCreatorModal 
        isOpen={isBecomeCreatorModalOpen}
        onClose={() => setBecomeCreatorModalOpen(false)}
      />
    </>
  );
}
