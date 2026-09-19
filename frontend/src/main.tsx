import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "./ErrorBoundary";
import { AuthProvider } from "./auth/AuthContext";
import { AppLoadingScreen } from "./components/AppLoadingScreen";
import { VersionUpdateBanner } from "./components/VersionUpdateBanner";
import { SsoLoginFrame } from "./components/SsoLoginFrame";
import "./index.css";

const DeveloperLanding = React.lazy(() => import("./pages/home/DeveloperLanding"));
const CreatorPortal = React.lazy(() => import("./pages/dashboard/CreatorPortal"));
const CreatorGuide = React.lazy(() => import("./pages/guides/CreatorGuide"));
const CreatorBounties = React.lazy(() => import("./pages/bounties/CreatorBounties"));
const PublicBountyDetail = React.lazy(() => import("./pages/bounties/PublicBountyDetail"));
const AdminPortal = React.lazy(() => import("./pages/AdminPortal"));

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

function AppContent() {
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

    if (location.pathname.startsWith("/admin")) {
    return (
      <>
        <AdminPortal />
        <VersionUpdateBanner />
      </>
    );
  }

  return (
    <>
      <CreatorPortal />
      <VersionUpdateBanner />
    </>
  );
}

function App() {
  return (
    <React.Suspense fallback={<AppLoadingScreen message="Loading your workspace..." />}>
      <AppContent />
    </React.Suspense>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  rootElement.querySelector(".app-startup")?.remove();
  createRoot(rootElement).render(
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <>
              <App />
              <SsoLoginFrame />
            </>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>,
  );
}
