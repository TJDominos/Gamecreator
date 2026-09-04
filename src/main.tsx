import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "./ErrorBoundary";
import { AuthProvider } from "./auth/AuthContext";
import DeveloperLanding from "./pages/home/DeveloperLanding";
import DeveloperPortal from "./pages/dashboard/DeveloperPortal";
import CreatorGuide from "./pages/guides/CreatorGuide";
import CreatorBounties from "./pages/bounties/CreatorBounties";
import PublicBountyDetail from "./pages/bounties/PublicBountyDetail";
import { VersionUpdateBanner } from "./components/VersionUpdateBanner";
import "./index.css";

// Suppress benign third-party wallet extension background communication errors in iframes
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args
      .map((a) => (typeof a === "string" ? a : a?.message || ""))
      .join(" ");
    if (
      message.includes("Failed to connect to MetaMask") ||
      message.includes("failed to connect to websocket") ||
      (message.toLowerCase().includes("metamask") && message.toLowerCase().includes("connect"))
    ) {
      console.warn("[wallet extension info]", ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg =
      typeof reason === "string"
        ? reason
        : reason?.message || reason?.toString?.() || "";
    if (
      msg.includes("Failed to connect to MetaMask") ||
      msg.includes("MetaMask") ||
      msg.includes("metamask") ||
      msg.includes("User rejected")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  window.addEventListener("error", (event) => {
    const msg = event.message || "";
    if (
      msg.includes("Failed to connect to MetaMask") ||
      msg.includes("MetaMask") ||
      msg.includes("metamask")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });
}

function App() {
  const location = useLocation();

  if (location.pathname === "/") {
    return (
      <>
        <DeveloperLanding />
        <VersionUpdateBanner />
      </>
    );
  }

  if (location.pathname === "/guides") {
    return (
      <>
        <CreatorGuide />
        <VersionUpdateBanner />
      </>
    );
  }
  
  if (location.pathname.startsWith("/bounties/")) {
    return (
      <>
        <PublicBountyDetail />
        <VersionUpdateBanner />
      </>
    );
  }
  if (location.pathname === "/bounties") {
    return (
      <>
        <CreatorBounties />
        <VersionUpdateBanner />
      </>
    );
  }

  return (
    <>
      <DeveloperPortal />
      <VersionUpdateBanner />
    </>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>,
  );
}
