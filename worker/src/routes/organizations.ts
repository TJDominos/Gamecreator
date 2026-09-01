import type { DeveloperOrganizationRow, Env } from "../types";
import { errorResponse, jsonResponse } from "../utils/response";
import { getAuthenticatedUser } from "../middleware/auth";

interface CreateOrgPayload {
  name: string;
  contactEmail: string;
  supportEmail?: string;
  logo?: string;
  description?: string;
  socialLinks?: [string, string];
}

export async function handleOrganizationRoutes(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  if (method === "GET" && pathname === "/api/organizations/my") {
    return handleGetMyOrganization(request, env);
  }

  if (method === "GET" && pathname === "/api/organizations/check-name") {
    return handleCheckOrgName(request, env);
  }

  if (method === "POST" && pathname === "/api/organizations") {
    return handleCreateOrganization(request, env);
  }

  return null;
}

async function handleGetMyOrganization(
  request: Request,
  env: Env,
): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED", request, env);
  }

  const organization = await env.DB.prepare(
    "SELECT * FROM developer_organizations WHERE owner_principal = ?",
  )
    .bind(authUser.principal_id)
    .first<DeveloperOrganizationRow>();

  return jsonResponse({ success: true, organization: organization ?? null }, 200, request, env);
}

async function handleCheckOrgName(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const name = url.searchParams.get("name")?.trim();

  if (!name) {
    return jsonResponse({ available: false, error: "Name parameter is required" }, 200, request, env);
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM developer_organizations WHERE LOWER(name) = LOWER(?)",
  )
    .bind(name)
    .first();

  return jsonResponse({ success: true, available: !existing }, 200, request, env);
}

async function handleCreateOrganization(
  request: Request,
  env: Env,
): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED", request, env);
  }

  const body = (await request.json().catch(() => null)) as CreateOrgPayload | null;
  if (!body || !body.name?.trim() || !body.contactEmail?.trim()) {
    return errorResponse("Organization name and contact email are required", 400, "INVALID_INPUT", request, env);
  }

  const trimmedName = body.name.trim();

  // Check unique name
  const existingName = await env.DB.prepare(
    "SELECT id, owner_principal FROM developer_organizations WHERE LOWER(name) = LOWER(?)",
  )
    .bind(trimmedName)
    .first<{ id: string; owner_principal: string }>();

  if (existingName && existingName.owner_principal !== authUser.principal_id) {
    return errorResponse("This organization name is already taken", 409, "NAME_EXISTS", request, env);
  }

  const now = Date.now();
  const orgId = existingName?.id ?? `RS-ORG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const socialLinksJson = JSON.stringify(body.socialLinks ?? ["", ""]);

  // Upsert developer organization
  await env.DB.prepare(
    `INSERT INTO developer_organizations (
       id, owner_principal, name, contact_email, support_email,
       logo, description, social_links_json, status, level,
       revenue_share, platform_account, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', 'L1', 0.8, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET 
       name = excluded.name,
       contact_email = excluded.contact_email,
       support_email = excluded.support_email,
       logo = excluded.logo,
       description = excluded.description,
       social_links_json = excluded.social_links_json,
       updated_at = excluded.updated_at`,
  )
    .bind(
      orgId,
      authUser.principal_id,
      trimmedName,
      body.contactEmail.trim(),
      body.supportEmail?.trim() ?? body.contactEmail.trim(),
      body.logo ?? "",
      body.description ?? "",
      socialLinksJson,
      authUser.principal_id,
      now,
      now,
    )
    .run();

  // Elevate user role to creator if currently player
  if (authUser.role === "player") {
    await env.DB.prepare("UPDATE users SET role = 'creator', updated_at = ? WHERE principal_id = ?")
      .bind(now, authUser.principal_id)
      .run();
  }

  const savedOrg = await env.DB.prepare(
    "SELECT * FROM developer_organizations WHERE id = ?",
  )
    .bind(orgId)
    .first<DeveloperOrganizationRow>();

  return jsonResponse({ success: true, organization: savedOrg }, 201, request, env);
}
