import React, { useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { BecomeCreatorModal } from "./BecomeCreatorModal";
import { WalletConnectModal } from "./WalletConnectModal";
import { Menu, X } from "lucide-react";
import "../pages/home/DeveloperLanding.css";

function getPortalPath(hasOrganization: boolean): string {
  return hasOrganization ? "/dashboard" : "/onboarding";
}

export function SiteHeader(): React.ReactElement {
  const { isSignedIn, profile, signInWithSSO, mockSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isBecomeCreatorModalOpen, setBecomeCreatorModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
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
    setIsWalletModalOpen(true);
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
            {process.env.NODE_ENV !== "production" && !isSignedIn && (
              <div className="flex gap-2 mr-4">
                <button
                  onClick={() => mockSignIn("creator")}
                  className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded-md font-semibold transition-colors"
                >
                  Mock Creator
                </button>
                <button
                  onClick={() => mockSignIn("admin")}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded-md font-semibold transition-colors"
                >
                  Mock Admin
                </button>
              </div>
            )}
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
          <div className="landing-nav__mobile-actions">
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
            {process.env.NODE_ENV !== "production" && !isSignedIn && (
              <div className="flex gap-2 p-4 border-b border-gray-100">
                <button onClick={() => mockSignIn("creator")} className="flex-1 py-2 bg-blue-100 text-blue-800 text-xs rounded font-semibold">Mock Creator</button>
                <button onClick={() => mockSignIn("admin")} className="flex-1 py-2 bg-red-100 text-red-800 text-xs rounded font-semibold">Mock Admin</button>
              </div>
            )}
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
      <WalletConnectModal 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}
