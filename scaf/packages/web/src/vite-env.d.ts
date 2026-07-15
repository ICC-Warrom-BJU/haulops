/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Origin backend di production (mis. https://haulops-server.onrender.com).
  // Kosong di dev → path relatif /api/... lewat proxy Vite.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// @multiavatar/multiavatar ships no TypeScript declarations.
declare module '@multiavatar/multiavatar/esm' {
  export default function multiavatar(seed: string, sansEnv?: boolean): string;
}
