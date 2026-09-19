import {
  sessionActions,
  sessionSelectors,
  sessionState,
  type SessionKind,
} from "../state/sessionStore";

export function getAuthToken(): string | null {
  return sessionSelectors.token(sessionState.getSnapshot());
}

export function setAuthToken(token: string | null | undefined): void {
  if (token) {
    sessionActions.establishAuthenticated(token);
  } else {
    sessionActions.clear();
  }
}

export function clearAuthToken(): void {
  sessionActions.clear();
}

export function setAnonymousSessionToken(token: string): void {
  sessionActions.establishAnonymous(token);
}

export function getAuthTokenKind(): SessionKind | null {
  return sessionSelectors.kind(sessionState.getSnapshot());
}