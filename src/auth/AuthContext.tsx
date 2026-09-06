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
  isSsoFrameOpen: boolean;
  role: UserRole;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  switchRole: (role: UserRole) => void;
  isCreator: boolean;
  isAdmin: boolean;
  isPlayer: boolean;
  upgradeToCreator: (
    customOrg?: Partial<DeveloperOrganizationInput>,
  ) => Promise<DeveloperOrganization | null>;
  signIn: (accountId: string) => void;
  signInWithSSO: () => void;
  closeSsoFrame: () => void;
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

function createOrganizationId(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RS-ORG-${suffix}`;
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<DeveloperOrganization | null>(null);
  const [isSsoFrameOpen, setIsSsoFrameOpen] = useState(false);

  const processSsoToken = useCallback(async (ssoToken: string) => {
    try {
      console.log("Processing SSO Token via Cloudflare Worker/Mock...");

      try {
        const ssoRes = await authApi.verifySSO(ssoToken);
        if (ssoRes && ssoRes.token) {
          const uid = ssoRes.uid || ssoRes.user.principal_id;
          localStorage.removeItem("randseed_signed_out");
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

          return;
        }
      } catch (apiErr) {
        console.warn("Worker API unreachable", apiErr);
      }
    } catch (error) {
      console.error("SSO Exchange failed", error);
    }
  }, []);

  // [PIPELINE A & INIT & POPUP LISTENER]: Intercept SSO Token on mount or restore session
  useEffect(() => {
    const handlePostMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "RANDSEED_SSO_SUCCESS" && event.data.ssoToken) {
        console.log("Received SSO Token from popup message", event.origin);
        void processSsoToken(event.data.ssoToken);
      } else if (event.data && event.data.type === "RANDSEED_SSO_CANCEL") {
        console.log("SSO login cancelled by user in popup");
      }
    };

    window.addEventListener("message", handlePostMessage);

    const initAuth = async () => {
      // 1. Check if we are returning from Main Site with an sso_token in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get("sso_token");

      if (ssoToken) {
        await processSsoToken(ssoToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // 2. Fallback: Check local storage for existing Custom Token / Session
      const storedSession = readJson<string | null>(SESSION_KEY, null);
      const token = localStorage.getItem(CUSTOM_TOKEN_KEY);

      if (storedSession && token) {
        setAccountId(storedSession);
        authApi.getMe()
          .then((meRes) => {
            if (meRes && meRes.user) {
              if (meRes.token) {
                localStorage.setItem(CUSTOM_TOKEN_KEY, meRes.token);
              }
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
            } else {
              void signOut();
            }
          })
          .catch(() => {
            void signOut();
          });
      } else if (!token) {
        // Clear any orphan session keys
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(USER_PROFILE_KEY);
        setAccountId(null);
        setProfile(null);
        setOrganization(null);
      }
    };

    initAuth();

    return () => {
      window.removeEventListener("message", handlePostMessage);
    };
  }, [processSsoToken]);

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

  // [PIPELINE B]: Open centered popup to Main Site to get SSO Token (no whole page redirect)
  const signInWithSSO = useCallback(() => {
    const mainSiteUrl =
      import.meta.env.VITE_WL_LOGIN_URL ||
      (import.meta.env.VITE_MAIN_SITE_URL
        ? `${import.meta.env.VITE_MAIN_SITE_URL}/login`
        : "https://dev.randseed.org/login");

    const currentOrigin = window.location.origin;
    const currentUrl = encodeURIComponent(window.location.origin + window.location.pathname);
    const targetUrl = `${mainSiteUrl}?redirect_uri=${currentUrl}&mode=popup&origin=${encodeURIComponent(currentOrigin)}`;
    setIsSsoFrameOpen(true);
    window.dispatchEvent(new CustomEvent("randseed:sso-target", { detail: targetUrl }));
  }, []);

  const closeSsoFrame = useCallback(() => {
    setIsSsoFrameOpen(false);
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
      const currentAcc = accountId;
      if (!currentAcc) {
        throw new Error("You must sign in before upgrading to creator.");
      }
      await authApi.becomeCreator();

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

      return organization;
    },
    [accountId, organization, profile],
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

      return nextOrganization;
    },
    [accountId, isOrganizationNameAvailable],
  );

  const currentRole: UserRole = (profile?.role as UserRole) || "player";
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
      isSsoFrameOpen,
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
      signInWithSSO,
      closeSsoFrame,
      signOut,
      updateProfile,
      saveOrganization,
      isOrganizationNameAvailable,
    }),
    [
      accountId,
      profile,
      organization,
      isSsoFrameOpen,
      currentRole,
      permissions,
      hasPermission,
      switchRole,
      upgradeToCreator,
      signIn,
      signInWithSSO,
      closeSsoFrame,
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
