import React from "react";
import { Sparkles, Shield, UserCheck, ArrowRight, Home, Rocket, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { WltLogo } from "../../components/WltLogo";
import { useNavigate, Link } from "react-router";

export function DashboardAccessGate(): React.ReactElement {
  const { switchRole, upgradeToCreator, profile } = useAuth();
  const navigate = useNavigate();

  const handleEnterAsCreator = () => {
    switchRole("creator");
  };

  const handleEnterAsAdmin = () => {
    switchRole("admin");
  };

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
        <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 28px", lineHeight: "1.5" }}>
          The local Role-Based Access Control (RBAC) system is active. Select your persona to enter and verify the main creator workflows.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px", textAlign: "left" }}>
          {/* Creator Option */}
          <button
            type="button"
            onClick={handleEnterAsCreator}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              borderRadius: "14px",
              border: "2px solid #7c3aed",
              background: "#faf5ff",
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(124, 58, 237, 0.15)";
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
                  background: "#7c3aed",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Sparkles size={22} />
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#17151d" }}>
                  Enter as Creator
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Manage games, view sandboxes, sync Git, accept bounties
                </div>
              </div>
            </div>
            <ArrowRight size={18} color="#7c3aed" />
          </button>

          {/* Admin Option */}
          <button
            type="button"
            onClick={handleEnterAsAdmin}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              cursor: "pointer",
              transition: "transform 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ef4444";
              e.currentTarget.style.background = "#fff5f5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#ffffff";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Shield size={22} />
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#17151d" }}>
                  Enter as Platform Admin
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Review and approve games, manage platform bounty pools
                </div>
              </div>
            </div>
            <ArrowRight size={18} color="#dc2626" />
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
