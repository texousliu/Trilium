import type BNote from "../becca/entities/bnote";
import log from "./log";

export interface IconPackManifest {
    name: string;
    prefix: string;
    icons: Record<string, string>;
}

interface ProcessResult {
    iconMappings: Record<string, string>;
}

export function processIconPack(iconPackNote: BNote): ProcessResult | undefined {
    const manifest = iconPackNote.getJsonContentSafely() as IconPackManifest;
    if (!manifest) {
        log.error(`Icon pack is missing JSON manifest (or has syntax errors): ${iconPackNote.title} (${iconPackNote.noteId})`);
        return;
    }


    return {
        iconMappings: manifest.icons
    };
}
