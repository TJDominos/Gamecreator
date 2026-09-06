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
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ width: "36px", height: "36px" }}>
            <WltLogo />
          </div>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#17151d" }}>
            RandSeed <span style={{ color: "#61369a" }}>Creators</span>
          </span>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#17151d", margin: "0 0 8px" }}>
          Developer Dashboard Access
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px", lineHeight: "1.5" }}>
          Please sign in with your RandSeed account to access your games and studio management.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px", textAlign: "left" }}>
          {/* Real SSO Sign In */}
          <button
            type="button"
            onClick={signInWithSSO}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              borderRadius: "14px",
              border: "2px solid #7c3aed",
              background: "#7c3aed",
              color: "#ffffff",
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(124, 58, 237, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Rocket size={22} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                  Sign in with RandSeed Account
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)" }}>
                  Use Passkey, Web3 Wallet, or Email via secure SSO
                </div>
              </div>
            </div>
            <ArrowRight size={20} color="#ffffff" />
          </button>

        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
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
            <Home size={15} /> Back to Home
          </Link>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12px",
              color: "#16a34a",
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={14} /> Ready for Backend SSO Mapping
          </span>
        </div>
      </div>
    </div>
  );
}
