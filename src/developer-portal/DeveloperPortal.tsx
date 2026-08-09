import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  ChevronDown,
  CircleDollarSign,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
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
import { useAuth } from "../auth/AuthContext";
import { WltLogo } from "../components/WltLogo";
import { PortalHeader } from "../components/PortalHeader";
import { OnboardingHeader } from "../components/OnboardingHeader";
import "./DeveloperPortal.css";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/sandbox", label: "Sandbox", icon: Wrench },
  { to: "/data", label: "Users & Orders", icon: Users },
  { to: "/revenue", label: "Revenue", icon: CircleDollarSign },
  { to: "/docs", label: "Developer Resources", icon: BookOpen },
  { to: "/settings", label: "Organization", icon: Settings },
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

function RequireOrganization({ children }: RouteGuardProps): React.ReactNode {
  const { isSignedIn, organization } = useAuth();
  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }
  if (!organization) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
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
    document.title = "Create your developer organization �?RandSeed";
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
          <h1>Create your developer organization</h1>
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
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const pageName =
    navigation.find((item) => location.pathname.startsWith(item.to))?.label ??
    "Developer Portal";

  function handleSignOut(): void {
    signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="portal-layout">
      <aside className={`portal-sidebar${menuOpen ? " is-open" : ""}`}>
        <div className="sidebar-heading">
          <Link to="/dashboard" className="portal-brand">
            <WltLogo />
            <span>RandSeed</span>
            <b>Developers</b>
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
        <div className="organization-switcher">
          <span className="organization-avatar">
            {organization?.logo ? (
              <img src={organization.logo} alt="" />
            ) : (
              organization?.name.slice(0, 1)
            )}
          </span>
          <span>
            <small>Organization</small>
            <strong>{organization?.name}</strong>
          </span>
          <ChevronDown />
        </div>
        <nav className="portal-nav" aria-label="Developer Portal">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? "is-active" : "")}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-help">
          <ShieldCheck />
          <div>
            <strong>Need help?</strong>
            <Link to="/docs">Open Developer Docs</Link>
          </div>
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
      <div className="portal-main">
        <PortalHeader 
          pageName={pageName} 
          onMenuClick={() => setMenuOpen(true)} 
        />
        <main className="portal-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Dashboard(): React.ReactElement {
  const { organization } = useAuth();

  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <p className="portal-eyebrow">Welcome to RandSeed</p>
          <h1>{organization?.name}</h1>
          <p>Connect, test, publish, and grow your web games from one place.</p>
        </div>
        <Link className="primary-action" to="/games">
          <Plus /> Create game
        </Link>
      </section>
      <section className="stat-grid" aria-label="Organization overview">
        {dashboardStats.map((stat) => (
          <article key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.note}</small>
          </article>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="portal-panel next-action">
          <div className="panel-heading">
            <div>
              <p className="portal-eyebrow">Next step</p>
              <h2>Publish your first game</h2>
            </div>
            <Gamepad2 />
          </div>
          <ol>
            <li className="is-complete">
              <span>1</span>
              <div><strong>Create organization</strong><small>Complete</small></div>
            </li>
            <li>
              <span>2</span>
              <div><strong>Add a game</strong><small>Provide your build and store details</small></div>
            </li>
            <li>
              <span>3</span>
              <div><strong>Pass sandbox checks</strong><small>Validate integration and callbacks</small></div>
            </li>
          </ol>
          <Link to="/games">Start game setup</Link>
        </section>
        <section className="portal-panel organization-summary">
          <div className="panel-heading">
            <div>
              <p className="portal-eyebrow">Platform terms</p>
              <h2>Organization details</h2>
            </div>
            <Settings />
          </div>
          <dl>
            <div><dt>Organization ID</dt><dd>{organization?.organizationId}</dd></div>
            <div><dt>Level</dt><dd>{organization?.level}</dd></div>
            <div><dt>Revenue share</dt><dd>{organization?.revenueShare}%</dd></div>
            <div><dt>Status</dt><dd><span className="status-pill">Pending review</span></dd></div>
          </dl>
        </section>
      </div>
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
      <p className="portal-eyebrow">Developer Portal</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

export default function DeveloperPortal(): React.ReactElement {
  return (
    <Routes>
      <Route
        path="/onboarding"
        element={
          <RequireSignedIn>
            <DeveloperOnboarding />
          </RequireSignedIn>
        }
      />
      <Route
        element={
          <RequireOrganization>
            <PortalShell />
          </RequireOrganization>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="games" element={<PlaceholderPage title="Games" description="Create and manage game integrations, versions, and releases." icon={Gamepad2} />} />
        <Route path="sandbox" element={<PlaceholderPage title="Sandbox" description="Preview your game and validate RandSeed host events." icon={Wrench} />} />
        <Route path="data" element={<PlaceholderPage title="Users & Orders" description="Review anonymous player activity and order history." icon={Users} />} />
        <Route path="revenue" element={<PlaceholderPage title="Revenue" description="Track estimated revenue, ledger entries, and payouts." icon={BarChart3} />} />
        <Route path="docs" element={<PlaceholderPage title="Developer Resources" description="Explore Developer Docs, AI Toolkit, and publishing guidance." icon={BookOpen} />} />
        <Route path="settings" element={<PlaceholderPage title="Organization" description="Manage your public profile, security, and integrations." icon={Settings} />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
