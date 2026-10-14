/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Link text pages as …/index.html (for hosts that don't serve a folder's index). */
  readonly VITE_PAGE_INDEX?: string;
}
