import React from "react";
import { Routes, Route, Navigate, NavLink, Outlet } from "react-router";
import { LayoutDashboard, Gamepad2, Users, ArrowLeft } from "lucide-react";
import { BountyManagement } from "./dashboard/bounties/BountyManagement";
import { RequireAdmin } from "../auth/RequireAdmin";
import { UserAdmin } from "./admin/UserAdmin";

// Placeholders for the new admin pages
function GameAdmin() {
  return (
    <div style={{ padding: "32px 40px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0" }}>Game Management</h1>
      <p style={{ color: "#6b7280" }}>Manage all games on the platform.</p>
    </div>
  );
}


function AdminShell() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      {/* Sidebar */}
      <aside style={{ width: "240px", background: "#111827", color: "#fff", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px 20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>RandSeed Admin</h2>
        </div>
        
        <nav style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          <NavLink
            to="/admin/bountyadmin"
            className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", 
              borderRadius: "8px", color: isActive ? "#fff" : "#9ca3af", textDecoration: "none",
              background: isActive ? "rgba(255,255,255,0.1)" : "transparent", transition: "all 0.2s"
            })}
          >
            <LayoutDashboard size={18} />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Bounty Admin</span>
          </NavLink>
          
          <NavLink
            to="/admin/gameadmin"
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", 
              borderRadius: "8px", color: isActive ? "#fff" : "#9ca3af", textDecoration: "none",
              background: isActive ? "rgba(255,255,255,0.1)" : "transparent", transition: "all 0.2s"
            })}
          >
            <Gamepad2 size={18} />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Game Admin</span>
          </NavLink>

          <NavLink
            to="/admin/users"
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", 
              borderRadius: "8px", color: isActive ? "#fff" : "#9ca3af", textDecoration: "none",
              background: isActive ? "rgba(255,255,255,0.1)" : "transparent", transition: "all 0.2s"
            })}
          >
            <Users size={18} />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>User Roles</span>
          </NavLink>
        </nav>

        <div style={{ padding: "20px" }}>
          <NavLink
            to="/dashboard"
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", 
              borderRadius: "8px", color: "#9ca3af", textDecoration: "none",
              transition: "color 0.2s"
            }}
          >
            <ArrowLeft size={16} />
            <span style={{ fontSize: "13px" }}>Back to Portal</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: "auto", background: "#f9fafb" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function AdminPortal() {
  return (
    <Routes>
      <Route path="/admin" element={<RequireAdmin><AdminShell /></RequireAdmin>}>
        <Route index element={<Navigate to="bountyadmin" replace />} />
        <Route path="bountyadmin" element={<BountyManagement />} />
        <Route path="gameadmin" element={<GameAdmin />} />
        <Route path="users" element={<UserAdmin />} />
      </Route>
    </Routes>
  );
}
