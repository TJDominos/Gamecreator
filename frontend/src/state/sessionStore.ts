export type SessionKind = "anonymous" | "authenticated";

export interface ApiSession {
  token: string;
  kind: SessionKind;
  principalId?: string;
  expiresAt?: number;
}

export interface SessionState {
  session: ApiSession | null;
}

const listeners = new Set<() => void>();
let currentState: SessionState = { session: null };

function updateSession(session: ApiSession | null): void {
  currentState = { session };
  listeners.forEach((listener) => listener());
}

function readExpiry(token: string): number | undefined {
  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

export const sessionState = {
  getSnapshot(): SessionState {
    return currentState;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const sessionActions = {
  establishAnonymous(token: string): void {
    const normalizedToken = token.trim();
    if (normalizedToken) {
      updateSession({ token: normalizedToken, kind: "anonymous", expiresAt: readExpiry(normalizedToken) });
    }
  },
  establishAuthenticated(token: string, principalId?: string): void {
    const normalizedToken = token.trim();
    if (normalizedToken) {
      updateSession({ token: normalizedToken, kind: "authenticated", principalId, expiresAt: readExpiry(normalizedToken) });
    }
  },
  clear(): void {
    updateSession(null);
  },
};

export const sessionSelectors = {
  token(state: SessionState): string | null {
    return state.session?.token ?? null;
  },
  kind(state: SessionState): SessionKind | null {
    return state.session?.kind ?? null;
  },
  isAnonymous(state: SessionState): boolean {
    return state.session?.kind === "anonymous";
  },
  isAuthenticated(state: SessionState): boolean {
    return state.session?.kind === "authenticated";
  },
};