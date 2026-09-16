import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

export function SsoLoginFrame(): React.ReactElement | null {
  const { closeSsoFrame, isSsoFrameOpen } = useAuth();
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [frameHeight, setFrameHeight] = useState(560);
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);
  const [isFrameSlow, setIsFrameSlow] = useState(false);

  useEffect(() => {
    const handleTarget = (event: Event): void => {
      const target = (event as CustomEvent<string>).detail;
      setIsFrameLoaded(false);
      setIsFrameSlow(false);
      setTargetUrl(typeof target === "string" ? target : null);
    };
    window.addEventListener("randseed:sso-target", handleTarget);
    return () => window.removeEventListener("randseed:sso-target", handleTarget);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent): void => {
      if (event.origin !== new URL(targetUrl || window.location.href).origin) return;
      if (event.data?.type === "RANDSEED_SSO_RESIZE") {
        const nextHeight = Number(event.data.height);
        if (Number.isFinite(nextHeight)) {
          setFrameHeight(Math.max(420, Math.min(nextHeight, 760)));
        }
        return;
      }
      if (event.data?.type === "RANDSEED_SSO_READY") {
        setIsFrameLoaded(true);
        setIsFrameSlow(false);
        return;
      }
      if (
        event.data?.type === "RANDSEED_SSO_SUCCESS"
        || event.data?.type === "RANDSEED_SSO_CANCEL"
        || event.data?.type === "RANDSEED_SSO_FAILURE"
      ) {
        setTargetUrl(null);
        closeSsoFrame();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [closeSsoFrame, targetUrl]);

  useEffect(() => {
    if (!targetUrl || isFrameLoaded) return;
    const slowConnectionTimer = window.setTimeout(() => setIsFrameSlow(true), 8000);
    return () => window.clearTimeout(slowConnectionTimer);
  }, [isFrameLoaded, targetUrl]);

  if (!isSsoFrameOpen || !targetUrl) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Sign in with Randseed" style={overlayStyle}>
      <div style={{ ...frameShellStyle, height: `min(${frameHeight}px, calc(100vh - 32px))` }}>
        {!isFrameLoaded && (
          <div role="status" aria-live="polite" style={frameLoadingStyle}>
            <span style={ssoLoadingDotStyle} />
            <strong>{isFrameSlow ? "Still connecting..." : "Opening secure sign-in..."}</strong>
            <span className="sso-loading-bar" style={ssoLoadingBarStyle}><span /></span>
          </div>
        )}
        <iframe
          title="Randseed sign in"
          src={targetUrl}
          onLoad={() => undefined}
          style={{ ...frameStyle, opacity: isFrameLoaded ? 1 : 0 }}
          allow="publickey-credentials-get; publickey-credentials-create; clipboard-write"
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
  position: "relative", width: "min(100%, 380px)", height: "min(620px, calc(100vh - 32px))",
  overflow: "hidden", borderRadius: "20px", background: "transparent", boxShadow: "none",
};

const frameStyle: React.CSSProperties = {
  display: "block", width: "100%", height: "100%", border: 0, outline: "none", background: "#fff",
};

const frameLoadingStyle: React.CSSProperties = {
  position: "absolute", inset: 0, zIndex: 1, display: "grid", placeItems: "center",
  alignContent: "center", gap: "14px", color: "#e2e8f0", background: "#101820",
  fontSize: "13px", fontFamily: "system-ui, sans-serif",
};

const ssoLoadingDotStyle: React.CSSProperties = {
  width: "10px", height: "10px", borderRadius: "50%", background: "#f4b942",
  boxShadow: "0 0 14px rgba(244, 185, 66, 0.7)",
  animation: "sso-loading-pulse 1.4s ease-in-out infinite",
};

const ssoLoadingBarStyle: React.CSSProperties = {
  width: "min(180px, 65vw)", height: "3px", overflow: "hidden", borderRadius: "99px",
  background: "rgba(255, 255, 255, 0.16)",
};