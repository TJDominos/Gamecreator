import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UserProfileInfo } from "../types/userProfile";

const SESSION_KEY = "randseed_auth_session";
const USER_PROFILE_KEY = "user_profile_data";
const USER_PROFILES_KEY = "randseed_user_profiles";
const ORGANIZATIONS_KEY = "randseed_developer_organizations";

export interface UserProfile extends UserProfileInfo {
  email?: string;
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
  status: "pending_review";
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
  signIn: (accountId: string) => void;
  signOut: () => void;
  updateProfile: (profile: UserProfile, accountId?: string) => void;
  saveOrganization: (
    input: DeveloperOrganizationInput,
  ) => DeveloperOrganization;
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

function readInitialProfile(): UserProfile | null {
  const currentAccount = readJson<string | null>(SESSION_KEY, null);
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
  }
  return legacyProfile;
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
  const [accountId, setAccountId] = useState<string | null>(() =>
    readJson<string | null>(SESSION_KEY, null),
  );
  const [profile, setProfile] = useState<UserProfile | null>(readInitialProfile);
  const [organization, setOrganization] =
    useState<DeveloperOrganization | null>(() => {
      const currentAccount = readJson<string | null>(SESSION_KEY, null);
      return currentAccount ? readOrganizations()[currentAccount] ?? null : null;
    });

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
    setAccountId(nextAccountId);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    setAccountId(null);
    setProfile(null);
    setOrganization(null);
  }, []);

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
    (input) => {
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

      const existing = readOrganizations()[accountId];
      const nextOrganization: DeveloperOrganization = {
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

  const value = useMemo<AuthContextValue>(
    () => ({
      accountId,
      profile,
      organization,
      isSignedIn: Boolean(accountId),
      signIn,
      signOut,
      updateProfile,
      saveOrganization,
      isOrganizationNameAvailable,
    }),
    [
      accountId,
      profile,
      organization,
      signIn,
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
