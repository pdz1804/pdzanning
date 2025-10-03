/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly PROD: boolean
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
