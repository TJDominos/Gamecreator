/**
 * Unified Permission & Role-Based Access Control (RBAC) System
 * 
 * Designed to power the Creator Center independently before backend SSO is linked,
 * while maintaining a 1:1 mapping contract with the future Cloudflare D1 / IC SSO schema.
 * Aligned with docs/database/sso_schema.md.
 */

import type { UserProfile } from "./AuthContext";

export type UserRole = "creator" | "admin" | "player";

export type Permission =
  | "dashboard:access"
  | "game:create"
  | "game:edit"
  | "game:review"
  | "bounty:view"
  | "bounty:subscribe"
  | "bounty:manage"
  | "org:manage";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  creator: [
    "dashboard:access",
    "game:create",
    "game:edit",
    "bounty:view",
    "bounty:subscribe",
    "org:manage",
  ],
  admin: [
    "dashboard:access",
    "game:create",
    "game:edit",
    "game:review",
    "bounty:view",
    "bounty:subscribe",
    "bounty:manage",
    "org:manage",
  ],
  player: [
    "bounty:view",
  ],
};

export interface PersonaDefinition {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatarUrl: string;
  bio: string;
  title: string;
  organization: {
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
    status: "approved" | "pending_review" | "rejected";
    createdAt: string;
  } | null;
}

export const DEFAULT_PERSONAS: Record<UserRole, PersonaDefinition> = {
  creator: {
    id: "usr_creator_alex",
    username: "Alex Vance",
    email: "alex@retrogames.studio",
    role: "creator",
    isEmailVerified: true,
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=creator_alex",
    bio: "Indie game designer building AI-powered arcade classics.",
    title: "Game Creator & Studio Lead",
    organization: {
      accountId: "usr_creator_alex",
      name: "Retro Games Studio",
      contactEmail: "contact@retrogames.studio",
      supportEmail: "support@retrogames.studio",
      logo: "https://api.dicebear.com/7.x/identicon/svg?seed=retrogames",
      description: "Pioneering interactive arcade titles with generative mechanics.",
      socialLinks: ["https://twitter.com/retrogames", "https://github.com/retrogames"],
      organizationId: "RS-ORG-RETRO",
      level: "Verified Studio",
      revenueShare: 70,
      platformAccount: "platform_retrogames",
      status: "approved",
      createdAt: "2026-01-15T08:00:00.000Z",
    },
  },
  admin: {
    id: "usr_admin_sarah",
    username: "Sarah Chen",
    email: "sarah.chen@randseed.org",
    role: "admin",
    isEmailVerified: true,
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=admin_sarah",
    bio: "RandSeed Foundation Operations & Developer Relations Reviewer.",
    title: "Platform Operations Admin",
    organization: {
      accountId: "usr_admin_sarah",
      name: "RandSeed Foundation Ops",
      contactEmail: "ops@randseed.org",
      supportEmail: "support@randseed.org",
      logo: "https://api.dicebear.com/7.x/identicon/svg?seed=randseedops",
      description: "Official platform review, game auditing, and bounty settlements committee.",
      socialLinks: ["https://randseed.org", "https://twitter.com/randseed"],
      organizationId: "RS-ORG-ADMIN",
      level: "Platform Admin",
      revenueShare: 100,
      platformAccount: "platform_admin_ops",
      status: "approved",
      createdAt: "2025-10-01T00:00:00.000Z",
    },
  },
  player: {
    id: "usr_player_david",
    username: "David Kim",
    email: "david.k@gamemail.io",
    role: "player",
    isEmailVerified: true,
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=player_david",
    bio: "Avid web gamer and aspiring game developer.",
    title: "Community Gamer",
    organization: null,
  },
};

/**
 * Check if a given role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Visual styling token for role badges
 */
export function getRoleBadgeStyle(role: UserRole): {
  label: string;
  tag: string;
  bg: string;
  color: string;
  borderColor: string;
  description: string;
} {
  switch (role) {
    case "admin":
      return {
        label: "Admin",
        tag: "Admin",
        bg: "#fef2f2",
        color: "#b91c1c",
        borderColor: "#fecaca",
        description: "Full access to Review Games, Manage Bounties, and Platform audits",
      };
    case "creator":
      return {
        label: "Creator",
        tag: "Creator",
        bg: "#f3e8ff",
        color: "#7e22ce",
        borderColor: "#e9d5ff",
        description: "Build games, sync with Git, deploy to sandboxes, and accept bounties",
      };
    case "player":
    default:
      return {
        label: "Player",
        tag: "Player",
        bg: "#f1f5f9",
        color: "#475569",
        borderColor: "#cbd5e1",
        description: "Community player browsing bounties, eligible to onboard as a Creator",
      };
  }
}

/**
 * Mapping Adapter for future Backend SSO integration.
 * When Cloudflare D1 / IC SSO delivers the authenticated shadow user:
 * - If user.role === 'admin' -> maps to 'admin'
 * - If user.role === 'creator' || user.hasOrganization -> maps to 'creator'
 * - Otherwise -> 'player'
 */
export function mapBackendUserToRole(backendUser?: {
  role?: string;
  is_admin?: boolean;
}): UserRole {
  if (backendUser?.role === "admin" || backendUser?.is_admin) {
    return "admin";
  }
  if (backendUser?.role === "creator") {
    return "creator";
  }
  return "player";
}
