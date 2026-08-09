/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAIN_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
