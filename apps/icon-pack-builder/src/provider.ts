import type { IconPackManifest } from "@triliumnext/server/src/services/icon_packs";

export interface IconPackData {
    name: string;
    prefix: string;
    manifest: IconPackManifest;
    fontFile: {
        name: string;
        mime: string;
        content: Buffer;
    }
}
