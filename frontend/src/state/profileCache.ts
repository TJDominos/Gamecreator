import type { UserProfile } from "../auth/AuthContext";

const PROFILE_CACHE_KEY = "randseed_creator_profile_cache_v1";

type CachedProfile = Pick<
  UserProfile,
  "avatarUrl" | "username" | "isVerified" | "hasStake" | "lastActive" | "bio" | "location" | "joinedDate"
> & {
  role?: UserProfile["role"];
  roles?: UserProfile["roles"];
  creatorOrgName?: UserProfile["creatorOrgName"];
};

function readAll(): Record<string, CachedProfile> {
  if (typeof window === "undefined") return {};
  try {
    const value = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!value) return {};
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as Record<string, CachedProfile> : {};
  } catch {
    return {};
  }
}

export const profileCache = {
  read(accountId: string): Partial<UserProfile> | null {
    return readAll()[accountId] ?? null;
  },
  write(accountId: string, profile: UserProfile): void {
    if (typeof window === "undefined") return;
    const profiles = readAll();
    const {
      avatarUrl,
      username,
      isVerified,
      hasStake,
      lastActive,
      bio,
      location,
      joinedDate,
      role,
      roles,
      creatorOrgName,
    } = profile;
    profiles[accountId] = {
      avatarUrl,
      username,
      isVerified,
      hasStake,
      lastActive,
      bio,
      location,
      joinedDate,
      role,
      roles,
      creatorOrgName,
    };
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profiles));
  },
  remove(accountId: string): void {
    if (typeof window === "undefined") return;
    const profiles = readAll();
    delete profiles[accountId];
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profiles));
  },
};