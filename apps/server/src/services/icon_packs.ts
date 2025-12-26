import type BAttachment from "../becca/entities/battachment";
import type BNote from "../becca/entities/bnote";
import log from "./log";

const PREFERRED_MIME_TYPE = [
    "font/woff2"
];

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

export function determineBestFontAttachment(iconPackNote: BNote) {
    // Map all the attachments by their MIME.
    const mappings = new Map<string, BAttachment>();
    for (const attachment of iconPackNote.getAttachmentsByRole("file")) {
        mappings.set(attachment.mime, attachment);
    }

    // Return the icon formats in order of preference.
    for (const preferredMimeType of PREFERRED_MIME_TYPE) {
        const correspondingAttachment = mappings.get(preferredMimeType);
        if (correspondingAttachment) return correspondingAttachment;
    }

    return null;
}
