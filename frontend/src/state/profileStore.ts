import type { UserProfile } from "../auth/AuthContext";

export type ProfileLoadStatus = "idle" | "refreshing" | "ready" | "error";

export interface ProfileState {
  profile: UserProfile | null;
  status: ProfileLoadStatus;
  error: string | null;
  lastSyncedAt: number | null;
}

const listeners = new Set<() => void>();
let currentState: ProfileState = {
  profile: null,
  status: "idle",
  error: null,
  lastSyncedAt: null,
};

function update(nextState: ProfileState): void {
  currentState = nextState;
  listeners.forEach((listener) => listener());
}

export const profileState = {
  getSnapshot(): ProfileState {
    return currentState;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const profileActions = {
  hydrate(profile: UserProfile | null): void {
    update({ ...currentState, profile, status: profile ? "ready" : "idle", error: null });
  },
  beginRefresh(): void {
    update({ ...currentState, status: "refreshing", error: null });
  },
  setServerProfile(profile: UserProfile): void {
    update({ profile, status: "ready", error: null, lastSyncedAt: Date.now() });
  },
  setError(error: string): void {
    update({ ...currentState, status: "error", error });
  },
  clear(): void {
    update({ profile: null, status: "idle", error: null, lastSyncedAt: null });
  },
};

export const profileSelectors = {
  profile(state: ProfileState): UserProfile | null {
    return state.profile;
  },
  isRefreshing(state: ProfileState): boolean {
    return state.status === "refreshing";
  },
};