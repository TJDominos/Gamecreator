import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "./AuthContext";
import { NotFound } from "../pages/NotFound";
import { AdminAccessGate } from "../pages/admin/AdminAccessGate";
import { AppLoadingScreen } from "../components/AppLoadingScreen";

export function RequireAdmin({ children }: { children: React.ReactNode }): React.ReactNode {
  const { isAuthLoading, isSignedIn, isAdmin } = useAuth();

  if (isAuthLoading) {
    return <AppLoadingScreen message="Checking your sign-in..." />;
  }

  if (!isSignedIn) {
    return <AdminAccessGate />;
  }

  if (!isAdmin) {
    return <NotFound />;
  }
  
  return children;
}
