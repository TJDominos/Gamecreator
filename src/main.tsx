import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router";
import { ErrorBoundary } from "./ErrorBoundary";
import { AuthProvider } from "./auth/AuthContext";
import DeveloperLanding from "./developer-landing/DeveloperLanding";
import DeveloperPortal from "./developer-portal/DeveloperPortal";
import CreatorGuide from "./CreatorGuide";
import CreatorBounties from "./CreatorBounties";
import "./index.css";

function App() {
  const location = useLocation();

  if (location.pathname === "/") {
    return <DeveloperLanding />;
  }

  if (location.pathname === "/guide") {
    return <CreatorGuide />;
  }
  
  if (location.pathname === "/bounties") {
    return <CreatorBounties />;
  }

  return <DeveloperPortal />;
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>,
  );
}
