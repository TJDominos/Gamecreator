import React from "react";
import { Link } from "react-router";
import { AlertCircle, ArrowLeft } from "lucide-react";

export function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f9fafb", padding: "40px", fontFamily: "system-ui, sans-serif" }}>
      <AlertCircle size={64} color="#9ca3af" style={{ marginBottom: "24px" }} />
      <h1 style={{ fontSize: "36px", fontWeight: 700, color: "#111827", margin: "0 0 16px 0" }}>404 - Not Found</h1>
      <p style={{ fontSize: "16px", color: "#6b7280", margin: "0 0 32px 0", textAlign: "center", maxWidth: "400px", lineHeight: 1.5 }}>
        The page you are looking for doesn't exist or you don't have permission to access it.
      </p>
      <Link 
        to="/dashboard"
        style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: "8px", 
          padding: "12px 24px", 
          background: "#111827", 
          color: "#fff", 
          textDecoration: "none", 
          borderRadius: "8px", 
          fontWeight: 500,
          transition: "background 0.2s"
        }}
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>
    </div>
  );
}
