import React, { useState } from "react";
import { X, Code, Github, Coins, Rocket, Mail } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router";

interface BecomeCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BecomeCreatorModal({ isOpen, onClose }: BecomeCreatorModalProps): React.ReactElement | null {
  const { accountId, profile, saveOrganization } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);

  if (!isOpen) return null;

  if (requiresEmailVerification) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="relative w-[92vw] sm:w-[420px] max-w-[420px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col p-8 items-center text-center">
          <button
            onClick={() => {
              setRequiresEmailVerification(false);
              onClose();
            }}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 border border-blue-100">
            <Mail size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Verify Your Email</h2>
          <p className="text-[15px] text-gray-500 mb-8 leading-relaxed">
            To protect your creator account and receive important updates about your games and bounties, you must verify your email address on the main site.
          </p>
          
          <button
            onClick={() => {
              // Redirect to main site for verification, passing the return URI
              const mainSiteUrl = import.meta.env.VITE_MAIN_SITE_URL || "https://test.randseed.org";
              const currentUrl = encodeURIComponent(window.location.origin + window.location.pathname);
              window.location.href = `${mainSiteUrl}/verify-email?redirect_uri=${currentUrl}`;
            }}
            className="w-full py-3.5 px-4 bg-blue-600 text-white text-[15px] font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm active:scale-[0.98]"
          >
            Verify Email on Randseed
          </button>
        </div>
      </div>
    );
  }

  const handleBecomeCreator = async () => {
    if (!accountId) return;
    
    // Check if email is verified
    if (profile?.isEmailVerified === false) {
      setRequiresEmailVerification(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Mock updating user profile role to "creator" locally
      const updatedProfile = { ...profile, role: "creator" };
      localStorage.setItem("USER_PROFILE", JSON.stringify(updatedProfile));
      
      const profilesStr = localStorage.getItem("USER_PROFILES");
      if (profilesStr) {
        const profiles = JSON.parse(profilesStr);
        profiles[accountId] = updatedProfile;
        localStorage.setItem("USER_PROFILES", JSON.stringify(profiles));
      }
      
      // We will also need to reload window to update AuthContext state quickly in mock
      onClose();
      navigate("/dashboard");
      window.location.reload();
    } catch (error) {
      console.error("Failed to become creator:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-[92vw] sm:w-[500px] max-w-[500px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 h-[80px] border-b border-gray-100">
          <h2 className="text-subsection text-gray-900">Build Your AI Game</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <p className="text-body-lg font-normal text-gray-600 mb-6">
            Follow these simple steps to launch your decentralized AI game on Randseed:
          </p>

          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <Code size={20} />
              </div>
              <div className="flex-1 text-left whitespace-normal break-words">
                <h3 className="text-body-lg text-gray-900">1. Integrate</h3>
                <p className="text-body text-gray-500 mt-1">
                  Initialize and integrate Randseed Context in your game with AI agents.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Github size={20} />
              </div>
              <div className="flex-1 text-left whitespace-normal break-words">
                <h3 className="text-body-lg text-gray-900">2. Connect & Test</h3>
                <p className="text-body text-gray-500 mt-1">
                  Connect GitHub and safely test your game in the sandbox environment.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Coins size={20} />
              </div>
              <div className="flex-1 text-left whitespace-normal break-words">
                <h3 className="text-body-lg text-gray-900">3. Monetize</h3>
                <p className="text-body text-gray-500 mt-1">
                  Design the reward structure and monetization model of your game.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <Rocket size={20} />
              </div>
              <div className="flex-1 text-left whitespace-normal break-words">
                <h3 className="text-body-lg text-gray-900">4. Publish</h3>
                <p className="text-body text-gray-500 mt-1">
                  Publish with an invite link to gather seed users and early game reviews.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <p className="text-caption text-center text-gray-500 mb-4">
            By clicking "Become Creator", you agree to Randseed's Game Publishing Terms.
          </p>
          <button
            onClick={handleBecomeCreator}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : "Become Creator"}
          </button>
        </div>
      </div>
    </div>
  );
}
