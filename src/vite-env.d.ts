/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_STORAGE_URL: string
  readonly VITE_SOCKET_URL?: string
  readonly VITE_STORAGE_SECRET_KEY?: string
  readonly VITE_ENCRYPTION_KEY:string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}