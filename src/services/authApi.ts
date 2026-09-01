import { request } from "./apiClient";
import type { UserProfile, DeveloperOrganization } from "../auth/AuthContext";

export interface SsoExchangeResponse {
  success: boolean;
  token: string;
  customToken: string;
  uid: string;
  user: {
    principal_id: string;
    role: "player" | "creator" | "admin";
    email: string | null;
    isEmailVerified: boolean;
    devNotificationEmail?: string | null;
    tosAcceptedVersion?: string | null;
    kycStatus?: string;
    lastPortalLoginAt?: number;
    createdAt?: number;
  };
  organization: DeveloperOrganization | null;
}

export interface MeResponse {
  success: boolean;
  user: {
    principal_id: string;
    role: "player" | "creator" | "admin";
    email: string | null;
    isEmailVerified: boolean;
    devNotificationEmail?: string | null;
    tosAcceptedVersion?: string | null;
    kycStatus?: string;
    lastPortalLoginAt?: number;
    createdAt?: number;
  };
  organization: DeveloperOrganization | null;
}

export interface CreateOrgInput {
  name: string;
  contactEmail: string;
  supportEmail?: string;
  logo?: string;
  description?: string;
  socialLinks?: [string, string];
}

export const authApi = {
  async verifySSO(ssoToken: string): Promise<SsoExchangeResponse> {
    return request<SsoExchangeResponse>("/api/auth/sso", {
      method: "POST",
      body: JSON.stringify({ sso_token: ssoToken }),
    });
  },

  async getMe(): Promise<MeResponse> {
    return request<MeResponse>("/api/auth/me", {
      method: "GET",
    });
  },

  async mockLogin(role: "player" | "creator" | "admin"): Promise<SsoExchangeResponse> {
    return request<SsoExchangeResponse>("/api/auth/mock-login", {
      method: "POST",
      body: JSON.stringify({ role }),
    });
  },

  async updateProfile(data: {
    dev_notification_email?: string;
    tos_accepted_version?: string;
    kyc_status?: string;
  }): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async getMyOrganization(): Promise<{ success: boolean; organization: DeveloperOrganization | null }> {
    return request<{ success: boolean; organization: DeveloperOrganization | null }>("/api/organizations/my", {
      method: "GET",
    });
  },

  async checkOrgNameAvailable(name: string): Promise<{ success: boolean; available: boolean }> {
    return request<{ success: boolean; available: boolean }>(
      `/api/organizations/check-name?name=${encodeURIComponent(name)}`,
      {
        method: "GET",
      },
    );
  },

  async createOrganization(
    input: CreateOrgInput,
  ): Promise<{ success: boolean; organization: DeveloperOrganization }> {
    return request<{ success: boolean; organization: DeveloperOrganization }>(
      "/api/organizations",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },
};
