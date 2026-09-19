import { DelegationIdentity, DelegationChain, Ed25519KeyIdentity } from "@dfinity/identity";
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

const DELEGATION_STORAGE_KEY = "wl_delegation";
const SESSION_KEY_STORAGE_KEY = "wl_session_key";
const LOGIN_METHOD_STORAGE_KEY = "wl_login_method";
const WALLET_SESSION_STORAGE_KEY = "wl_wallet_session";

export type LoginMethod = 'email' | 'wallet' | 'passkey' | 'ii';
export type WalletSession = any; // Replace with actual type if available

export interface StoredDelegation {
  identity: DelegationIdentity;
  sessionKey: Ed25519KeyIdentity;
  loginMethod: LoginMethod;
  walletSession: WalletSession | null;
}

// Minimal stub for the storage abstraction you use (wlAuthClientStorage)
export const wlAuthClientStorage = {
  async setItem(key: string, value: any): Promise<void> {
    if (value === undefined || value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  },
  async getItem<T = any>(key: string): Promise<T | null> {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  },
  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
};

export async function saveDelegation(
  identity: DelegationIdentity,
  sessionKey: Ed25519KeyIdentity,
  loginMethod: LoginMethod,
  walletSession: WalletSession | null,
): Promise<void> {
  await wlAuthClientStorage.setItem(
    DELEGATION_STORAGE_KEY,
    identity.getDelegation().toJSON(),
  );
  await wlAuthClientStorage.setItem(
    SESSION_KEY_STORAGE_KEY,
    sessionKey.toJSON(),
  );
  await wlAuthClientStorage.setItem(LOGIN_METHOD_STORAGE_KEY, loginMethod);
  await wlAuthClientStorage.setItem(WALLET_SESSION_STORAGE_KEY, walletSession);
}

export async function restoreStoredDelegation(): Promise<StoredDelegation | null> {
  const delegationData = await wlAuthClientStorage.getItem<any>(DELEGATION_STORAGE_KEY);
  const sessionKeyData = await wlAuthClientStorage.getItem<any>(SESSION_KEY_STORAGE_KEY);
  const loginMethod = await wlAuthClientStorage.getItem<LoginMethod>(LOGIN_METHOD_STORAGE_KEY);
  const walletSession = await wlAuthClientStorage.getItem<WalletSession>(WALLET_SESSION_STORAGE_KEY);

  if (!delegationData || !sessionKeyData) {
    return null;
  }

  try {
    const delegationChain = DelegationChain.fromJSON(
      typeof delegationData === 'string' ? delegationData : JSON.stringify(delegationData)
    );
    const sessionKey = Ed25519KeyIdentity.fromJSON(
      typeof sessionKeyData === 'string' ? sessionKeyData : JSON.stringify(sessionKeyData)
    );
    const identity = DelegationIdentity.fromDelegation(
      sessionKey,
      delegationChain,
    );

    return {
      identity,
      sessionKey,
      loginMethod: loginMethod ?? 'email',
      walletSession: walletSession ?? null,
    };
  } catch (error) {
    console.error("Failed to restore delegation identity:", error);
    await clearStoredDelegation();
    return null;
  }
}

export async function clearStoredDelegation(): Promise<void> {
  await wlAuthClientStorage.removeItem(DELEGATION_STORAGE_KEY);
  await wlAuthClientStorage.removeItem(SESSION_KEY_STORAGE_KEY);
  await wlAuthClientStorage.removeItem(LOGIN_METHOD_STORAGE_KEY);
  await wlAuthClientStorage.removeItem(WALLET_SESSION_STORAGE_KEY);
}

/**
 * A singleton client pattern mirroring WLAuthClient from your main repo.
 */
export class WLAuthClient {
  private static instance: WLAuthClient;
  private identity: DelegationIdentity | null = null;
  private sessionKey: Ed25519KeyIdentity | null = null;
  private principal: Principal | null = null;
  private loginMethod: LoginMethod | null = null;

  private constructor() {}

  public static getInstance(): WLAuthClient {
    if (!WLAuthClient.instance) {
      WLAuthClient.instance = new WLAuthClient();
    }
    return WLAuthClient.instance;
  }

  public async init(): Promise<boolean> {
    const stored = await restoreStoredDelegation();
    if (stored) {
      this.identity = stored.identity;
      this.sessionKey = stored.sessionKey;
      this.loginMethod = stored.loginMethod;
      this.principal = stored.identity.getPrincipal();
      return true;
    }
    return false;
  }

  public getIdentity(): DelegationIdentity | null {
    return this.identity;
  }

  public getPrincipal(): Principal | null {
    return this.principal;
  }

  public getLoginMethod(): LoginMethod | null {
    return this.loginMethod;
  }

  // Example method structure for logging in via II
  public async loginByII(internetIdentityAuthClient: any): Promise<void> {
    // 1. Fetch delegation from II / your backend
    // 2. Build DelegationChain and Identity
    // 3. Save to storage
    // 
    // const delegationChain = DelegationChain.fromDelegations([delegationWithSignature], userPublicKey);
    // this.sessionKey = Ed25519KeyIdentity.generate(); // Or restore/manage session key
    // this.identity = DelegationIdentity.fromDelegation(this.sessionKey, delegationChain);
    // this.principal = this.identity.getPrincipal();
    // this.loginMethod = 'ii';
    // 
    // await saveDelegation(this.identity, this.sessionKey, this.loginMethod, null);
    
    console.warn("loginByII is a stub in the portal.");
  }
  
  public async logout(): Promise<void> {
    this.identity = null;
    this.sessionKey = null;
    this.principal = null;
    this.loginMethod = null;
    await clearStoredDelegation();
  }
}
