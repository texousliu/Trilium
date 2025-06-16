/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    /** The license key for CKEditor premium features. */
    readonly VITE_CKEDITOR_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
