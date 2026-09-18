import { Actor, HttpAgent } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import type { Env } from "../types";

const SsoAuthorizationCode = IDL.Record({
  code: IDL.Text,
  principal_id: IDL.Text,
  email: IDL.Opt(IDL.Text),
  is_email_verified: IDL.Bool,
  audience: IDL.Text,
  redirect_uri: IDL.Text,
  expires_at_ms: IDL.Int,
  code_challenge: IDL.Text,
});

const UserProfile = IDL.Record({
  ic_account_id: IDL.Text,
  principal_id: IDL.Text,
  user_name: IDL.Text,
  logo: IDL.Text,
  bio: IDL.Opt(IDL.Text),
  country: IDL.Opt(IDL.Text),
  registration_time: IDL.Opt(IDL.Int),
  last_play_time: IDL.Opt(IDL.Int),
  last_login_time: IDL.Opt(IDL.Int),
  risk_level: IDL.Opt(IDL.Nat),
  achievements: IDL.Vec(IDL.Text),
  withdrawal_addresses: IDL.Vec(IDL.Text),
  user_sub_account: IDL.Vec(IDL.Text),
  email: IDL.Opt(IDL.Text),
  badges: IDL.Vec(IDL.Text),
});

const idlFactory = ({ IDL: idl }: { IDL: typeof IDL }) => idl.Service({
  redeem_sso_authorization_code: idl.Func(
    [idl.Text, idl.Text, idl.Text, idl.Text],
    [idl.Opt(SsoAuthorizationCode)],
    [],
  ),
  query_user_by_principal_id: idl.Func(
    [idl.Text],
    [idl.Opt(UserProfile)],
    ["query"],
  ),
});

type IdentityActor = {
  redeem_sso_authorization_code: (code: string, audience: string, redirectUri: string, codeVerifier: string) => Promise<[] | [SsoAuthorizationCodeValue]>;
  query_user_by_principal_id: (principalId: string) => Promise<[] | [UserProfileValue]>;
};

export interface UserProfileValue {
  user_name: string;
  logo: string;
}

export interface SsoAuthorizationCodeValue {
  code: string;
  principal_id: string;
  email: [] | [string];
  is_email_verified: boolean;
  audience: string;
  redirect_uri: string;
  expires_at_ms: bigint;
}

export async function redeemSsoAuthorizationCode(
  code: string,
  audience: string,
  redirectUri: string,
  codeVerifier: string,
  env: Env,
): Promise<SsoAuthorizationCodeValue | null> {
  if (!env.WL_USER_CANISTER_ID) {
    throw new Error("WL user canister is not configured");
  }

  const agent = await HttpAgent.create({
    host: env.IC_GATEWAY_URL || "https://ic0.app",
  });
  const actor = Actor.createActor<IdentityActor>(idlFactory, {
    agent,
    canisterId: env.WL_USER_CANISTER_ID,
  });
  const result = await actor.redeem_sso_authorization_code(code, audience, redirectUri, codeVerifier);
  return result[0] || null;
}

export async function querySsoUserProfile(
  principalId: string,
  env: Env,
): Promise<UserProfileValue | null> {
  if (!env.WL_USER_CANISTER_ID) return null;

  try {
    const agent = await HttpAgent.create({
      host: env.IC_GATEWAY_URL || "https://ic0.app",
    });
    const actor = Actor.createActor<IdentityActor>(idlFactory, {
      agent,
      canisterId: env.WL_USER_CANISTER_ID,
    });
    const result = await actor.query_user_by_principal_id(principalId);
    return result[0] || null;
  } catch (error) {
    console.warn("Unable to load SSO user profile", {
      principalId,
      error: error instanceof Error ? error.message : "unknown error",
    });
    return null;
  }
}
