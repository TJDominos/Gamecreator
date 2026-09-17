import React from "react";
import { Routes, Route, Navigate, NavLink, Outlet, useLocation } from "react-router";
import { LayoutDashboard, Gamepad2, Users, ArrowLeft, X } from "lucide-react";
import { BountyManagement } from "./dashboard/bounties/BountyManagement";
import { RequireAdmin } from "../auth/RequireAdmin";
import { UserAdmin } from "./admin/UserAdmin";
import { PortalHeader } from "../components/PortalHeader";
import "./dashboard/DeveloperPortal.css";

// Placeholders for the new admin pages
function GameAdmin() {
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1 style={{ fontSize: "24px" }}>Game Management</h1>
        <p>Manage all games on the platform.</p>
      </header>
    </div>
  );
}


function AdminShell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [sidebarPinned, setSidebarPinned] = React.useState(true);

  React.useEffect(() => setMenuOpen(false), [location.pathname]);

  const pageName = location.pathname.endsWith("/gameadmin")
    ? "Game Admin"
    : location.pathname.endsWith("/users")
      ? "User Roles"
      : "Bounty Review";

  return (
    <div className="portal-layout admin-shell">
      {/* Sidebar */}
      <aside className={`portal-sidebar ${menuOpen ? "is-open" : ""} ${!sidebarPinned ? "is-unpinned" : ""}`}>
        <div className="sidebar-heading">
          <h2 className="portal-brand">RandSeed <b>Admin</b></h2>
          <button
            className="sidebar-close"
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        
        <nav className="portal-nav" aria-label="Admin Portal">
          <NavLink
            to="/admin/bountyadmin"
            className={({ isActive }) => isActive ? "is-active" : ""}
          >
            <LayoutDashboard size={18} />
            <span>Bounty Review</span>
          </NavLink>
          
          <NavLink
            to="/admin/gameadmin"
          >
            <Gamepad2 size={18} />
            <span>Game Admin</span>
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) => isActive ? "is-active" : ""}
          >
            <Users size={18} />
            <span>User Roles</span>
          </NavLink>
        </nav>

        <div className="sidebar-help">
          <NavLink
            to="/"
            className="sidebar-help-row"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </NavLink>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="portal-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`portal-main ${!sidebarPinned ? "is-unpinned" : ""}`}>
        <PortalHeader
          pageName={pageName}
          onMenuClick={() => {
            if (window.innerWidth > 900) {
              setSidebarPinned(!sidebarPinned);
            } else {
              setMenuOpen(true);
            }
          }}
        />
        <main className="portal-content">
          <Outlet />
        </main>
      </div>
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
