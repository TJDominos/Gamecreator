import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

export function SsoLoginFrame(): React.ReactElement | null {
  const { closeSsoFrame, isSsoFrameOpen } = useAuth();
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [frameHeight, setFrameHeight] = useState(560);

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
      if (event.data?.type === "RANDSEED_SSO_RESIZE") {
        const nextHeight = Number(event.data.height);
        if (Number.isFinite(nextHeight)) {
          setFrameHeight(Math.max(420, Math.min(nextHeight, 760)));
        }
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

  if (!isSsoFrameOpen || !targetUrl) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Sign in with RandSeed" style={overlayStyle}>
      <div style={{ ...frameShellStyle, height: `min(${frameHeight}px, calc(100vh - 32px))` }}>
        <iframe
          title="RandSeed sign in"
          src={targetUrl}
          style={frameStyle}
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