import React from "react";
import { ArrowRight, Home, Rocket, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { WltLogo } from "../../components/WltLogo";
import { Link } from "react-router";

export function DashboardAccessGate(): React.ReactElement {
  const { signInWithSSO } = useAuth();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8f7fa 0%, #ede9f2 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e5e1e9",
          boxShadow: "0 20px 40px -15px rgba(97, 54, 154, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.04)",
          padding: "36px 32px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "16px" }}>
          <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center" }}>
            <WltLogo />
          </div>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#17151d", lineHeight: "1" }}>
            Randseed <span style={{ color: "#61369a" }}>Creator</span>
          </span>
        </div>

        <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px", lineHeight: "1.5" }}>
          Please sign in to access your games management.
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
          <button
            className="btn btn--solid"
            type="button"
            onClick={signInWithSSO}
            style={{ width: "230px", minHeight: "48px", fontSize: "16px", justifyContent: "center" }}
          >
            Sign In
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "#64748b",
              textDecoration: "none",
            }}
          >
            <Home size={15} /> Creator Main Page
          </Link>
        </div>
      </div>
    </div>
  );
}
