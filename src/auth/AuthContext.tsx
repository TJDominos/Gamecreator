import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";
import type { UserProfileInfo } from "../types/userProfile";
import { WLAuthClient } from "./wlAuthClient";
import { authApi } from "../services/authApi";
import {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  DEFAULT_PERSONAS,
  hasPermission as checkPermission,
} from "./permissionSystem";

const SESSION_KEY = "randseed_auth_session";
const CUSTOM_TOKEN_KEY = "randseed_custom_jwt";
const USER_PROFILE_KEY = "user_profile_data";
const USER_PROFILES_KEY = "randseed_user_profiles";
const ORGANIZATIONS_KEY = "randseed_developer_organizations";

export interface UserProfile extends UserProfileInfo {
  email?: string;
  isEmailVerified?: boolean;
  role?: "player" | "creator" | "admin"; // B-side role
  [key: string]: unknown;
}

export interface DeveloperOrganization {
  accountId: string;
  name: string;
  contactEmail: string;
  supportEmail: string;
  logo: string;
  description: string;
  socialLinks: [string, string];
  organizationId: string;
  level: string;
  revenueShare: number;
  platformAccount: string;
  status: "pending_review" | "approved" | "rejected";
  createdAt: string;
}

type DeveloperOrganizationInput = Omit<
  DeveloperOrganization,
  | "accountId"
  | "organizationId"
  | "level"
  | "revenueShare"
  | "platformAccount"
  | "status"
  | "createdAt"
>;

interface AuthContextValue {
  accountId: string | null;
  profile: UserProfile | null;
  organization: DeveloperOrganization | null;
  isSignedIn: boolean;
  role: UserRole;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  switchRole: (role: UserRole) => void;
  isCreator: boolean;
  isAdmin: boolean;
  isPlayer: boolean;
  upgradeToCreator: (
    customOrg?: Partial<DeveloperOrganizationInput>,
  ) => Promise<DeveloperOrganization>;
  signIn: (accountId: string) => void;
  mockSignIn: (role: "creator" | "admin" | "player") => void;
  signInWithSSO: () => void;
  signOut: () => Promise<void>;
  updateProfile: (profile: UserProfile, accountId?: string) => void;
  saveOrganization: (
    input: DeveloperOrganizationInput,
  ) => Promise<DeveloperOrganization>;
  isOrganizationNameAvailable: (name: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readOrganizations(): Record<string, DeveloperOrganization> {
  return readJson<Record<string, DeveloperOrganization>>(ORGANIZATIONS_KEY, {});
}

function readProfiles(): Record<string, UserProfile> {
  return readJson<Record<string, UserProfile>>(USER_PROFILES_KEY, {});
}

function getInitialAccount(): string | null {
  if (typeof window !== "undefined" && localStorage.getItem("randseed_signed_out") === "true") {
    return null;
  }
  const storedAccount = readJson<string | null>(SESSION_KEY, null);
  if (storedAccount) {
    return storedAccount;
  }
  // Online / preview default: initialize with creator persona so verification works immediately
  const defaultPersona = DEFAULT_PERSONAS.creator;
  localStorage.setItem(SESSION_KEY, JSON.stringify(defaultPersona.id));
  return defaultPersona.id;
}

function readInitialProfile(): UserProfile | null {
  if (typeof window !== "undefined" && localStorage.getItem("randseed_signed_out") === "true") {
    return null;
  }
  const currentAccount = getInitialAccount();
  if (!currentAccount) {
    return null;
  }
  const profiles = readProfiles();
  if (profiles[currentAccount]) {
    return profiles[currentAccount];
  }
  const legacyProfile = readJson<UserProfile | null>(USER_PROFILE_KEY, null);
  if (legacyProfile) {
    profiles[currentAccount] = legacyProfile;
    localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
    return legacyProfile;
  }

  // Pre-seed default creator profile if fresh session
  const defaultPersona = DEFAULT_PERSONAS.creator;
  const initialProfile: UserProfile = {
    avatarUrl: defaultPersona.avatarUrl,
    username: defaultPersona.username,
    isVerified: true,
    hasStake: true,
    lastActive: "Just now",
    bio: defaultPersona.bio,
    location: "Global",
    joinedDate: "2026-01-01",
    role: "creator",
    email: defaultPersona.email,
    isEmailVerified: true,
  };
  profiles[defaultPersona.id] = initialProfile;
  localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(initialProfile));

  if (defaultPersona.organization) {
    const orgs = readOrganizations();
    orgs[defaultPersona.id] = defaultPersona.organization;
    localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(orgs));
  }

  return initialProfile;
}

function createOrganizationId(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RS-ORG-${suffix}`;
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [accountId, setAccountId] = useState<string | null>(getInitialAccount);
  const [profile, setProfile] = useState<UserProfile | null>(readInitialProfile);
  const [organization, setOrganization] =
    useState<DeveloperOrganization | null>(() => {
      const currentAccount = getInitialAccount();
      if (!currentAccount) return null;
      const orgs = readOrganizations();
      if (orgs[currentAccount]) return orgs[currentAccount];
      if (currentAccount === DEFAULT_PERSONAS.creator.id) {
        return DEFAULT_PERSONAS.creator.organization;
      }
      return null;
    });

  // [PIPELINE A & INIT]: Intercept SSO Token on mount or restore session
  useEffect(() => {
    const initAuth = async () => {
      // 1. Check if we are returning from Main Site with an sso_token in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get("sso_token");

      if (ssoToken) {
        try {
          console.log("Intercepted SSO Token. Exchanging via Cloudflare Worker...");
          
          let exchangeSuccess = false;
          try {
            // Real exchange with Cloudflare Worker D1 backend
            const ssoRes = await authApi.verifySSO(ssoToken);
            if (ssoRes && ssoRes.token) {
              const uid = ssoRes.uid || ssoRes.user.principal_id;
              localStorage.setItem(CUSTOM_TOKEN_KEY, ssoRes.token);
              localStorage.setItem(SESSION_KEY, JSON.stringify(uid));

              const profiles = readProfiles();
              const updatedProfile: UserProfile = {
                avatarUrl: profiles[uid]?.avatarUrl || "",
                username: profiles[uid]?.username || (ssoRes.user.email?.split("@")[0] ?? uid.substring(0, 10)),
                isVerified: ssoRes.user.isEmailVerified,
                hasStake: profiles[uid]?.hasStake ?? false,
                lastActive: "Just now",
                bio: profiles[uid]?.bio || "",
                location: profiles[uid]?.location || "",
                joinedDate: profiles[uid]?.joinedDate || new Date().toISOString().split("T")[0],
                role: ssoRes.user.role,
                email: ssoRes.user.email ?? undefined,
                isEmailVerified: ssoRes.user.isEmailVerified,
              };

              profiles[uid] = updatedProfile;
              localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
              localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));

              setAccountId(uid);
              setProfile(updatedProfile);

              if (ssoRes.organization) {
                const orgs = readOrganizations();
                orgs[uid] = ssoRes.organization;
                localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(orgs));
                setOrganization(ssoRes.organization);
              }

              exchangeSuccess = true;
            }
          } catch (apiErr) {
            console.warn("Worker API unreachable, using client-side mock exchange fallback", apiErr);
          }

          if (!exchangeSuccess) {
            // Fallback client simulation if API server is offline
            const uid = `randseed:usr_${ssoToken.substring(0, 8)}`;
            const customToken = `jwt_mock_${ssoToken}`;
            const mockRole = ssoToken.includes("admin") ? "admin" : ssoToken.includes("creator") ? "creator" : "player";
            const mockEmail = `test_${mockRole}@example.com`;
            const mockEmailVerified = ssoToken.includes("verified");

            localStorage.setItem(CUSTOM_TOKEN_KEY, customToken);
            localStorage.setItem(SESSION_KEY, JSON.stringify(uid));

            const profiles = readProfiles();
            const fallbackProfile: UserProfile = {
              avatarUrl: "",
              username: `${mockRole}_${uid.substring(0, 6)}`,
              isVerified: mockEmailVerified,
              hasStake: false,
              lastActive: "Just now",
              bio: "",
              location: "",
              joinedDate: new Date().toISOString().split("T")[0],
              role: mockRole,
              email: mockEmail,
              isEmailVerified: mockEmailVerified,
            };

            profiles[uid] = fallbackProfile;
            localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
            localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(fallbackProfile));

            setAccountId(uid);
            setProfile(fallbackProfile);
          }

          // Clean up the URL to remove the sso_token for security and UX
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        } catch (error) {
          console.error("SSO Exchange failed", error);
        }
      }

      // 2. Fallback: Check local storage for existing Custom Token / Session
      const storedSession = readJson<string | null>(SESSION_KEY, null);
      if (storedSession) {
        setAccountId(storedSession);
        // Sync fresh profile & organization from D1 backend if token exists
        const token = localStorage.getItem(CUSTOM_TOKEN_KEY);
        if (token && !token.startsWith("jwt_mock_")) {
          authApi.getMe()
            .then((meRes) => {
              if (meRes && meRes.user) {
                setProfile((prev) => ({
                  ...prev,
                  avatarUrl: prev?.avatarUrl || "",
                  username: prev?.username || (meRes.user.email?.split("@")[0] ?? storedSession),
                  isVerified: meRes.user.isEmailVerified,
                  hasStake: prev?.hasStake ?? false,
                  lastActive: prev?.lastActive || "Recently",
                  bio: prev?.bio || "",
                  location: prev?.location || "",
                  joinedDate: prev?.joinedDate || new Date().toISOString().split("T")[0],
                  role: meRes.user.role,
                  email: meRes.user.email ?? undefined,
                  isEmailVerified: meRes.user.isEmailVerified,
                }));
                if (meRes.organization) {
                  setOrganization(meRes.organization);
                }
              }
            })
            .catch(() => {
              // Ignore background fetch error
            });
        }
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    setOrganization(accountId ? readOrganizations()[accountId] ?? null : null);
    const nextProfile = accountId ? readProfiles()[accountId] ?? null : null;
    setProfile(nextProfile);
    if (nextProfile) {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(nextProfile));
    } else {
      localStorage.removeItem(USER_PROFILE_KEY);
    }
  }, [accountId]);

  const signIn = useCallback((nextAccountId: string) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextAccountId));
    const profiles = readProfiles();
    if (!profiles[nextAccountId]) {
      const defaultProfile: UserProfile = {
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${nextAccountId}`,
        username: nextAccountId.startsWith("0x")
          ? `${nextAccountId.substring(0, 6)}...${nextAccountId.substring(nextAccountId.length - 4)}`
          : nextAccountId,
        isVerified: true,
        hasStake: false,
        lastActive: "Just now",
        bio: "",
        location: "",
        joinedDate: new Date().toISOString().split("T")[0],
        role: "creator",
        email: nextAccountId.includes("@") ? nextAccountId : `${nextAccountId.substring(0, 8)}@web3.user`,
        isEmailVerified: true,
      };
      profiles[nextAccountId] = defaultProfile;
      localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(defaultProfile));
      setProfile(defaultProfile);
    }
    setAccountId(nextAccountId);
  }, []);

  // [DEV ONLY]: Mock Sign In with Cloudflare Worker support
  const mockSignIn = useCallback(async (role: "creator" | "admin" | "player") => {
    try {
      const res = await authApi.mockLogin(role);
      if (res && res.token) {
        localStorage.setItem(CUSTOM_TOKEN_KEY, res.token);
        localStorage.setItem(SESSION_KEY, JSON.stringify(res.uid));

        const nextProfile: UserProfile = {
          avatarUrl: "",
          username: `${role}_user`,
          isVerified: res.user.isEmailVerified,
          hasStake: false,
          lastActive: "Just now",
          bio: "",
          location: "",
          joinedDate: new Date().toISOString().split("T")[0],
          role: res.user.role,
          email: res.user.email ?? undefined,
          isEmailVerified: res.user.isEmailVerified,
        };

        const profiles = readProfiles();
        profiles[res.uid] = nextProfile;
        localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(nextProfile));

        setAccountId(res.uid);
        setProfile(nextProfile);
        if (res.organization) {
          setOrganization(res.organization);
        }
        return;
      }
    } catch (e) {
      console.warn("Mock login API call failed, falling back to URL redirect mock", e);
    }

    const ssoToken =
      role === "admin"
        ? "mock_admin_token_verified"
        : role === "creator"
        ? "mock_creator_token_verified"
        : "mock_player_token_unverified";

    window.location.href = `/?sso_token=${ssoToken}`;
  }, []);

  // [PIPELINE B]: Redirect user to Main Site to get SSO Token
  const signInWithSSO = useCallback(() => {
    const isLocalhost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    const mainSiteUrl =
      import.meta.env.VITE_WL_LOGIN_URL ||
      (import.meta.env.VITE_MAIN_SITE_URL
        ? `${import.meta.env.VITE_MAIN_SITE_URL}/login`
        : isLocalhost
        ? `${window.location.protocol}//${window.location.hostname}:3001/login`
        : "https://test.randseed.org/login");

    const currentUrl = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `${mainSiteUrl}?redirect_uri=${currentUrl}`;
  }, []);

  const signOut = useCallback(async () => {
    const client = WLAuthClient.getInstance();
    await client.logout(); // Clear local IC identity if it exists

    localStorage.setItem("randseed_signed_out", "true");
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CUSTOM_TOKEN_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    setAccountId(null);
    setProfile(null);
    setOrganization(null);
  }, []);

  const switchRole = useCallback((targetRole: UserRole) => {
    localStorage.removeItem("randseed_signed_out");
    const targetPersona = DEFAULT_PERSONAS[targetRole];
    const newProfile: UserProfile = {
      avatarUrl: targetPersona.avatarUrl,
      username: targetPersona.username,
      isVerified: targetPersona.isEmailVerified,
      hasStake: true,
      lastActive: "Just now",
      bio: targetPersona.bio,
      location: "Global",
      joinedDate: "2026-01-01",
      role: targetRole,
      email: targetPersona.email,
      isEmailVerified: targetPersona.isEmailVerified,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(targetPersona.id));
    localStorage.setItem(CUSTOM_TOKEN_KEY, `jwt_local_${targetRole}`);

    const profiles = readProfiles();
    profiles[targetPersona.id] = newProfile;
    localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));

    const orgs = readOrganizations();
    if (targetPersona.organization) {
      orgs[targetPersona.id] = targetPersona.organization;
      localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(orgs));
      setOrganization(targetPersona.organization);
    } else {
      setOrganization(null);
    }

    setAccountId(targetPersona.id);
    setProfile(newProfile);
  }, []);

  const upgradeToCreator = useCallback(
    async (customOrg?: Partial<DeveloperOrganizationInput>) => {
      const currentAcc = accountId || DEFAULT_PERSONAS.creator.id;
      const orgName = customOrg?.name || `${profile?.username || "Developer"}'s Studio`;
      
      const newOrg: DeveloperOrganization = {
        accountId: currentAcc,
        name: orgName,
        contactEmail: customOrg?.contactEmail || profile?.email || "creator@randseed.org",
        supportEmail: customOrg?.supportEmail || profile?.email || "support@randseed.org",
        logo: customOrg?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(orgName)}`,
        description: customOrg?.description || "Game creator studio on RandSeed platform.",
        socialLinks: customOrg?.socialLinks || ["https://randseed.org", ""],
        organizationId: createOrganizationId(),
        level: "Creator",
        revenueShare: 70,
        platformAccount: `platform_${currentAcc.replace(/[^a-zA-Z0-9]/g, "").slice(-10)}`,
        status: "approved",
        createdAt: new Date().toISOString(),
      };

      const orgs = readOrganizations();
      orgs[currentAcc] = newOrg;
      localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(orgs));
      setOrganization(newOrg);

      const updatedProfile: UserProfile = {
        avatarUrl: profile?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentAcc}`,
        username: profile?.username || "Creator",
        isVerified: true,
        hasStake: true,
        lastActive: "Just now",
        bio: profile?.bio || "",
        location: profile?.location || "Global",
        joinedDate: profile?.joinedDate || new Date().toISOString().split("T")[0],
        role: "creator",
        email: profile?.email || "creator@randseed.org",
        isEmailVerified: true,
      };

      const profiles = readProfiles();
      profiles[currentAcc] = updatedProfile;
      localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setAccountId(currentAcc);
      localStorage.removeItem("randseed_signed_out");

      return newOrg;
    },
    [accountId, profile],
  );

  const updateProfile = useCallback(
    (nextProfile: UserProfile, profileAccountId?: string) => {
      const targetAccount = profileAccountId ?? accountId;
      if (!targetAccount) {
        throw new Error("You must sign in before updating a profile.");
      }
      const profiles = readProfiles();
      profiles[targetAccount] = nextProfile;
      localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(nextProfile));
      setProfile(nextProfile);
    },
    [accountId],
  );

  const isOrganizationNameAvailable = useCallback(
    (name: string) => {
      const normalizedName = name.trim().toLocaleLowerCase();
      return !Object.values(readOrganizations()).some(
        (item) =>
          item.accountId !== accountId &&
          item.name.trim().toLocaleLowerCase() === normalizedName,
      );
    },
    [accountId],
  );

  const saveOrganization = useCallback<AuthContextValue["saveOrganization"]>(
    async (input) => {
      if (!accountId) {
        throw new Error("You must sign in before creating an organization.");
      }
      if (!isOrganizationNameAvailable(input.name)) {
        throw new Error("This organization name is already in use.");
      }
      if (
        !input.name.trim() ||
        !input.contactEmail.trim() ||
        !input.supportEmail.trim() ||
        !input.description.trim()
      ) {
        throw new Error("Complete all required organization fields.");
      }

      let createdFromApi: DeveloperOrganization | null = null;
      try {
        const res = await authApi.createOrganization({
          name: input.name,
          contactEmail: input.contactEmail,
          supportEmail: input.supportEmail,
          logo: input.logo,
          description: input.description,
          socialLinks: input.socialLinks,
        });
        if (res && res.organization) {
          createdFromApi = res.organization;
        }
      } catch (err) {
        console.warn("Could not persist organization to Cloudflare D1, storing locally", err);
      }

      const existing = readOrganizations()[accountId];
      const nextOrganization: DeveloperOrganization = createdFromApi ?? {
        ...input,
        accountId,
        organizationId: existing?.organizationId ?? createOrganizationId(),
        level: existing?.level ?? "Starter",
        revenueShare: existing?.revenueShare ?? 70,
        platformAccount:
          existing?.platformAccount ??
          `platform_${accountId.replace(/[^a-zA-Z0-9]/g, "").slice(-10)}`,
        status: "pending_review",
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };

      const organizations = readOrganizations();
      organizations[accountId] = nextOrganization;
      localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(organizations));
      setOrganization(nextOrganization);

      // Upgrade local role to creator
      setProfile((prev) => (prev ? { ...prev, role: "creator" } : prev));

      return nextOrganization;
    },
    [accountId, isOrganizationNameAvailable],
  );

  const currentRole: UserRole = (profile?.role as UserRole) || (accountId ? "creator" : "player");
  const permissions = useMemo(() => ROLE_PERMISSIONS[currentRole] || [], [currentRole]);
  const hasPermission = useCallback(
    (perm: Permission) => checkPermission(currentRole, perm),
    [currentRole],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      accountId,
      profile,
      organization,
      isSignedIn: Boolean(accountId),
      role: currentRole,
      permissions,
      hasPermission,
      switchRole,
      isCreator: currentRole === "creator",
      isAdmin: currentRole === "admin",
      isPlayer: currentRole === "player",
      upgradeToCreator,
      signIn,
      mockSignIn,
      signInWithSSO,
      signOut,
      updateProfile,
      saveOrganization,
      isOrganizationNameAvailable,
    }),
    [
      accountId,
      profile,
      organization,
      currentRole,
      permissions,
      hasPermission,
      switchRole,
      upgradeToCreator,
      signIn,
      mockSignIn,
      signInWithSSO,
      signOut,
      updateProfile,
      saveOrganization,
      isOrganizationNameAvailable,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
