import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export function SsoLoginFrame(): React.ReactElement | null {
  const { closeSsoFrame, isSsoFrameOpen } = useAuth();
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleTarget = (event: Event): void => {
      const target = (event as CustomEvent<string>).detail;
      setTargetUrl(typeof target === "string" ? target : null);
    };
    window.addEventListener("randseed:sso-target", handleTarget);
    return () => window.removeEventListener("randseed:sso-target", handleTarget);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent): void => {
      if (event.origin !== new URL(targetUrl || window.location.href).origin) return;
      if (event.data?.type === "RANDSEED_SSO_SUCCESS" || event.data?.type === "RANDSEED_SSO_CANCEL") {
        setTargetUrl(null);
        closeSsoFrame();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [closeSsoFrame, targetUrl]);

  if (!isSsoFrameOpen || !targetUrl) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Sign in with RandSeed" style={overlayStyle}>
      <div style={frameShellStyle}>
        <button type="button" onClick={() => { setTargetUrl(null); closeSsoFrame(); }} style={closeButtonStyle} aria-label="Close sign-in">
          <X size={20} />
        </button>
        <iframe
          title="RandSeed sign in"
          src={targetUrl}
          style={frameStyle}
          allow="publickey-credentials-get; clipboard-write"
        />
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center",
  padding: "20px", background: "rgba(9, 9, 11, 0.62)", backdropFilter: "blur(5px)",
};

const frameShellStyle: React.CSSProperties = {
  position: "relative", width: "min(100%, 460px)", height: "min(760px, 92vh)",
  overflow: "hidden", borderRadius: "18px", background: "#fff", boxShadow: "0 24px 80px rgba(0, 0, 0, 0.28)",
};

const frameStyle: React.CSSProperties = { width: "100%", height: "100%", border: 0, background: "#fff" };
const closeButtonStyle: React.CSSProperties = {
  position: "absolute", top: 10, right: 10, zIndex: 1, display: "grid", placeItems: "center",
  width: 34, height: 34, border: 0, borderRadius: "50%", color: "#17151d", background: "rgba(255,255,255,.9)", cursor: "pointer",
};