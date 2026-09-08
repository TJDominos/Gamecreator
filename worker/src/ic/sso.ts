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

const idlFactory = ({ IDL: idl }: { IDL: typeof IDL }) => idl.Service({
  redeem_sso_authorization_code: idl.Func(
    [idl.Text, idl.Text, idl.Text, idl.Text],
    [idl.Opt(SsoAuthorizationCode)],
    [],
  ),
});

type IdentityActor = {
  redeem_sso_authorization_code: (code: string, audience: string, redirectUri: string, codeVerifier: string) => Promise<[] | [SsoAuthorizationCodeValue]>;
};

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
