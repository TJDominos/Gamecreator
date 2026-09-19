/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAIN_SITE_URL?: string;
  readonly VITE_WL_LOGIN_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GITHUB_OIDC_AUDIENCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
