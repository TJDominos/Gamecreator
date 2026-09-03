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
