import type BAttachment from "../becca/entities/battachment";
import type BNote from "../becca/entities/bnote";
import log from "./log";
import search from "./search/services/search";

const PREFERRED_MIME_TYPE = [
    "font/woff2",
    "font/woff",
    "font/ttf"
] as const;

const MIME_TO_CSS_FORMAT_MAPPINGS: Record<typeof PREFERRED_MIME_TYPE[number], string> = {
    "font/ttf": "truetype",
    "font/woff": "woff",
    "font/woff2": "woff2"
};

export interface IconPackManifest {
    name: string;
    prefix: string;
    icons: Record<string, string>;
}

interface ProcessResult {
    manifest: IconPackManifest;
    fontMime: string;
    fontAttachmentId: string;
}

export function getIconPacks() {
    return search.searchNotes("#iconPack")
        .map(iconPackNote => processIconPack(iconPackNote))
        .filter(Boolean) as ProcessResult[];
}

export function processIconPack(iconPackNote: BNote): ProcessResult | undefined {
    const manifest = iconPackNote.getJsonContentSafely() as IconPackManifest;
    if (!manifest) {
        log.error(`Icon pack is missing JSON manifest (or has syntax errors): ${iconPackNote.title} (${iconPackNote.noteId})`);
        return;
    }

    const attachment = determineBestFontAttachment(iconPackNote);
    if (!attachment || !attachment.attachmentId) {
        log.error(`Icon pack is missing WOFF/WOFF2/TTF attachment: ${iconPackNote.title} (${iconPackNote.noteId})`);
        return;
    }

    return {
        manifest,
        fontMime: attachment.mime,
        fontAttachmentId: attachment.attachmentId
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

export function generateCss({ manifest, fontAttachmentId, fontMime }: ProcessResult) {
    const iconDeclarations: string[] = [];
    for (const [ key, mapping ] of Object.entries(manifest.icons)) {
        iconDeclarations.push(`.${manifest.prefix}.${key}::before { content: '\\${mapping.charCodeAt(0).toString(16)}'; }`);
    }

    return `\
        @font-face {
            font-family: 'trilium-icon-pack-${manifest.prefix}';
            font-weight: normal;
            font-style: normal;
            src: url('/api/attachments/${fontAttachmentId}/download') format('${MIME_TO_CSS_FORMAT_MAPPINGS[fontMime]}');
        }

        .${manifest.prefix} {
            font-family: 'trilium-icon-pack-${manifest.prefix}' !important;
            font-weight: normal;
            font-style: normal;
            font-variant: normal;
            line-height: 1;
            text-rendering: auto;
            display: inline-block;
            text-transform: none;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        ${iconDeclarations.join("\n")}
    `;
}
