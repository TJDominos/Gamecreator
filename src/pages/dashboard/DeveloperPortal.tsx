import { BountyHub } from "./bounties/BountyHub";
import { BountyDetail } from "./bounties/BountyDetail";
import { BountyManagement } from "./bounties/BountyManagement";
import {
  GameConsole, GameOverview, GameSettings,
  GameDeployments } from "./games";
import React, { useEffect, useState, useRef } from "react";
import {
  ArrowRight,
  AlertCircle,
  Calendar,
  BarChart3,
  BookOpen,
  ChevronDown,
  CircleDollarSign,
  Gamepad2,
  Github,
  Headset,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Target,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import { MOCK_GAMES } from "./games/gameData";
import { useAuth } from "../../auth/AuthContext";
import { WltLogo } from "../../components/WltLogo";
import { PortalHeader } from "../../components/PortalHeader";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import "./DeveloperPortal.css";

const navigation = [
  { to: "/dashboard", end: true, label: "My Games", icon: Gamepad2 },
  { to: "/dashboard/bounties", label: "My Bounties", icon: Target },
  { to: "/dashboard/data", label: "Users & Orders", icon: Users },
  { to: "/dashboard/revenue", label: "Revenue", icon: CircleDollarSign },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const dashboardStats = [
  { label: "Games", value: "0", note: "Create your first game" },
  { label: "Players today", value: "0", note: "No activity yet" },
  { label: "30-day GMV", value: "$0.00", note: "Real-time estimate" },
  { label: "Available balance", value: "$0.00", note: "Ready to withdraw" },
];

interface RouteGuardProps {
  children: React.ReactNode;
}

interface OnboardingForm {
  name: string;
  contactEmail: string;
  supportEmail: string;
  logo: string;
  description: string;
  socialOne: string;
  socialTwo: string;
}

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

function RequireSignedIn({ children }: RouteGuardProps): React.ReactNode {
  const { isSignedIn } = useAuth();
  return isSignedIn ? children : <Navigate to="/" replace />;
}



function DeveloperOnboarding(): React.ReactNode {
  const { organization, profile, saveOrganization, isOrganizationNameAvailable } =
    useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<OnboardingForm>({
    name: "",
    contactEmail: profile?.email ?? "",
    supportEmail: profile?.email ?? "",
    logo: "",
    description: "",
    socialOne: "",
    socialTwo: "",
  });
  const [nameError, setNameError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    document.title = "Create your creator organization �?RandSeed";
  }, []);

  useEffect(() => {
    if (!profile?.email) {
      return;
    }
    setForm((current) => ({
      ...current,
      contactEmail: current.contactEmail || profile.email || "",
      supportEmail: current.supportEmail || profile.email || "",
    }));
  }, [profile?.email]);

  if (organization) {
    return <Navigate to="/dashboard" replace />;
  }

  function update(field: keyof OnboardingForm, value: string): void {
    setForm((current) => ({ ...current, [field]: value }));
    setSubmitError("");
    if (field === "name") {
      setNameError("");
    }
  }

  function handleLogo(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 1024 * 1024) {
      setSubmitError("Logo must be smaller than 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        update("logo", reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    const name = form.name.trim();
    if (
      !name ||
      !form.contactEmail.trim() ||
      !form.supportEmail.trim() ||
      !form.description.trim()
    ) {
      setSubmitError("Complete all required organization fields.");
      return;
    }
    if (!isOrganizationNameAvailable(name)) {
      setNameError("This organization name is already in use.");
      return;
    }
    try {
      saveOrganization({
        name,
        contactEmail: form.contactEmail.trim(),
        supportEmail: form.supportEmail.trim(),
        logo: form.logo,
        description: form.description.trim(),
        socialLinks: [form.socialOne.trim(), form.socialTwo.trim()],
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save your organization.",
      );
    }
  }

  return (
    <main className="onboarding-page">
      <OnboardingHeader />
      <section className="onboarding-card">
        <div className="onboarding-intro">
          <p className="portal-eyebrow">One-time setup</p>
          <h1>Create your creator organization</h1>
          <p>
            Tell us who publishes your games. You can update these details later
            from Organization settings.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="onboarding-form">
          <label className="field field--wide">
            <span>Organization name *</span>
            <input
              required
              maxLength={80}
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              onBlur={() =>
                form.name.trim() &&
                !isOrganizationNameAvailable(form.name) &&
                setNameError("This organization name is already in use.")
              }
              aria-invalid={Boolean(nameError)}
            />
            {nameError && <small className="field-error">{nameError}</small>}
          </label>
          <label className="field">
            <span>Contact email *</span>
            <input
              required
              type="email"
              value={form.contactEmail}
              onChange={(event) => update("contactEmail", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Support email *</span>
            <input
              required
              type="email"
              value={form.supportEmail}
              onChange={(event) => update("supportEmail", event.target.value)}
            />
          </label>
          <label className="field field--wide">
            <span>Logo</span>
            <div className="logo-upload">
              <span className="logo-preview">
                {form.logo ? <img src={form.logo} alt="" /> : form.name.slice(0, 1)}
              </span>
              <input type="file" accept="image/*" onChange={handleLogo} />
              <small>PNG, JPG or SVG. Maximum 1 MB.</small>
            </div>
          </label>
          <label className="field field--wide">
            <span>Description *</span>
            <textarea
              required
              maxLength={500}
              rows={4}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
            <small>{form.description.length}/500</small>
          </label>
          <label className="field">
            <span>Social link 1</span>
            <input
              type="url"
              placeholder="https://"
              value={form.socialOne}
              onChange={(event) => update("socialOne", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Social link 2</span>
            <input
              type="url"
              placeholder="https://"
              value={form.socialTwo}
              onChange={(event) => update("socialTwo", event.target.value)}
            />
          </label>
          {submitError && (
            <p className="form-error" role="alert">
              <AlertCircle /> {submitError}
            </p>
          )}
          <div className="onboarding-actions">
            <p>
              Organization ID, level, revenue share, and platform account are
              assigned by RandSeed after submission.
            </p>
            <button type="submit">Create organization</button>
          </div>
        </form>
      </section>
    </main>
  );
}

function PortalShell(): React.ReactElement {
  const { accountId, organization, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const pageName =
    navigation.find((item) => location.pathname.startsWith(item.to))?.label ??
    "Creator Portal";

  function handleSignOut(): void {
    signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="portal-layout">
      <aside className={`portal-sidebar ${menuOpen ? "is-open" : ""} ${!sidebarPinned ? "is-unpinned" : ""}`}>
        <div className="sidebar-heading">
          <Link to="/" className="portal-brand">
            <WltLogo />
            <span>RandSeed</span>
            <b>Creators</b>
          </Link>
          <button
            className="sidebar-close"
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        
        <nav className="portal-nav" aria-label="Creator Portal">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? "is-active" : "")}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-help">
          <div className="sidebar-help-row">
            <BookOpen className="sidebar-help-icon" />
            <div>
              <strong>Integration & APIs</strong>
              <Link to="/guides">Creator Guides</Link>
            </div>
          </div>
          <a
            href="mailto:Support@randseed.org"
            className="sidebar-help-row sidebar-support-link"
            title="Email Creator Support"
          >
            <Headset className="sidebar-help-icon" />
            <span>Support@randseed.org</span>
          </a>
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
      <div className={`portal-main ${!sidebarPinned ? "is-unpinned" : ""}`}>
        <PortalHeader 
          pageName={pageName} 
          onMenuClick={() => { if (window.innerWidth > 900) { setSidebarPinned(!sidebarPinned); } else { setMenuOpen(true); } }} 
        />
        <main className="portal-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


const mockGames = [
  { id: "1", name: "Neon Dash", players: "1,204", visitors: "2,500", availableBalance: "$120.00", revenue: "$342.00", status: "Active" },
  { id: "2", name: "Space Miner", players: "840", visitors: "1,120", availableBalance: "$45.50", revenue: "$128.50", status: "Active" },
  { id: "3", name: "Puzzle Quest", players: "0", visitors: "0", availableBalance: "$0.00", revenue: "$0.00", status: "In Review" },
];


function getStatusStyles(status: string) {
  switch (status) {
    case 'PUBLIC_ACTIVE': return { background: '#e6f6ec', color: '#1e874b', borderColor: '#d1f0db' };
    case 'APPROVED': return { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' };
    case 'PENDING_REVIEW': return { background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' };
    case 'REJECTED': return { background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' };
    case 'DEVELOPMENT':
    case 'PRIVATE_TESTING': return { background: '#e0e7ff', color: '#3730a3', borderColor: '#c7d2fe' };
    case 'MAINTENANCE': return { background: '#ffedd5', color: '#9a3412', borderColor: '#fed7aa' };
    case 'DRAFT':
    case 'ARCHIVED':
    default: return { background: '#f2f0f3', color: 'var(--portal-muted)', borderColor: '#e5e2e8' };
  }
}

function formatBonus(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return value.toFixed(2);
}

function Dashboard(): React.ReactElement {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [startDate, setStartDate] = useState("2026-07-24");
  const [endDate, setEndDate] = useState("2026-08-23");
  
  const endDateRef = useRef<HTMLInputElement>(null);


  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>My Games</h1>
          <p>Connect, test, publish, and grow your web games from one place.</p>
        </div>
        <button className="primary-action" onClick={() => {
          const newId = "g_" + Math.floor(Math.random() * 1000);
          navigate(`/dashboard/games/${newId}/settings`, { state: { gameName: "New Game" } });
        }}>
          <Plus /> Create game
        </button>
      </section>
      <section className="stat-grid" aria-label="Studio overview">
        <article>
          <span>Games</span>
          <strong>0</strong>
          <small>Create your first game</small>
        </article>
        <article>
          <span>Players (Since Inception)</span>
          <strong>0</strong>
          <small>Visitors: 0</small>
        </article>
        <article>
          <span>Revenue Since Inception</span>
          <strong>$0.00</strong>
          <small>Withdrawn: $0.00</small>
        </article>
        <article>
          <span>Available balance</span>
          <strong>$0.00</strong>
          <small>Gcoin: 0 | Bonus: {formatBonus(0)}</small>
        </article>
      </section>
      <section className="portal-panel games-performance" style={{ marginTop: '24px' }}>
        <div className="panel-heading" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Games Performance</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', background: '#f9f9f9', border: '1px solid var(--portal-border)', borderRadius: '6px', padding: '6px 12px' }}>
            <span style={{ color: 'var(--portal-text)' }}>Date Range: <span style={{ color: '#8892b0' }}>(UTC)</span></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px', color: 'var(--portal-text)' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '13px' }}>{startDate}</span>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => {
                    setStartDate(e.target.value);
                    try {
                      if (endDateRef.current) endDateRef.current.showPicker();
                    } catch (err) {}
                  }} 
                  className="portal-date-hidden-input"
                />
              </div>
              <span style={{ color: 'var(--portal-muted)' }}>→</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '13px' }}>{endDate}</span>
                <input 
                  type="date" 
                  ref={endDateRef}
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="portal-date-hidden-input"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="portal-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', fontWeight: 500, color: 'var(--portal-muted)' }}>Game Name</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', fontWeight: 500, color: 'var(--portal-muted)' }}>Status</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', fontWeight: 500, color: 'var(--portal-muted)' }}>Repository (RDcreatordev)</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', fontWeight: 500, color: 'var(--portal-muted)' }}>Visitors</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', fontWeight: 500, color: 'var(--portal-muted)' }}>Players</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', fontWeight: 500, color: 'var(--portal-muted)' }}>Revenue</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', fontWeight: 500, color: 'var(--portal-muted)' }}>Available Balance</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', fontWeight: 500, color: 'var(--portal-muted)' }}>Escrowed Balance</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '12px', fontWeight: 500, color: 'var(--portal-muted)' }}></th>
              </tr>
            </thead>
            <tbody>
              {MOCK_GAMES.map(game => (
                <tr key={game.id} style={{ cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => navigate(`/dashboard/games/${game.id}`)} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '14px', color: 'var(--portal-text)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--portal-purple-soft)', color: 'var(--portal-purple)', display: 'grid', placeItems: 'center' }}>
                        <Gamepad2 size={16} />
                      </div>
                      <strong>{game.name}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '14px', color: 'var(--portal-text)' }}>
                    <span className="status-pill" style={{ ...getStatusStyles(game.status), border: '1px solid' }}>
                      {game.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '13px' }}>
                    {game.repoInfo ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '3px 8px', borderRadius: '8px', color: '#6d28d9', fontWeight: 500 }}>
                        <Github size={13} />
                        <span>{game.repoInfo.repository}</span>
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>Not connected</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '14px', color: 'var(--portal-text)' }}>{game.visitors}</td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '14px', color: 'var(--portal-text)' }}>{game.players}</td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '14px', color: 'var(--portal-text)' }}>{game.revenue}</td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '14px', color: 'var(--portal-text)' }}>{game.availableBalance}</td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', fontSize: '14px', color: 'var(--portal-text)' }}>{game.escrowedBalance}</td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--portal-border)', textAlign: 'right' }}>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--portal-muted)' }}>
                      <ArrowRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
    </div>
  );
}

function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: PlaceholderPageProps): React.ReactElement {
  return (
    <section className="placeholder-page">
      <span><Icon /></span>
      <p className="portal-eyebrow">Creator Portal</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

export default function DeveloperPortal(): React.ReactElement {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <RequireSignedIn>
            <PortalShell />
          </RequireSignedIn>
        }
      >
        <Route index element={<Dashboard />} />
        
        <Route path="games/:gameId" element={<GameConsole />}>
          <Route index element={<GameOverview />} />
          <Route path="settings" element={<GameSettings />} />
          <Route path="deployments" element={<GameDeployments />} />
        </Route>

        <Route path="bounties" element={<BountyHub />} />
        <Route path="bounties/:bountyId" element={<BountyDetail />} />
        <Route path="data" element={<PlaceholderPage title="Users & Orders" description="Review anonymous player activity and order history." icon={Users} />} />
        <Route path="revenue" element={<PlaceholderPage title="Revenue" description="Track estimated revenue, ledger entries, and payouts." icon={BarChart3} />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" description="Manage your public profile, security, and integrations." icon={Settings} />} />
      </Route>
      <Route path="/bounty-management" element={<BountyManagement />} />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
