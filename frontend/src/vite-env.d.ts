/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_AI_SERVICE_URL: string
  readonly VITE_MAP_SERVICE_URL: string
  readonly VITE_SPEECH_SERVICE_URL: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}