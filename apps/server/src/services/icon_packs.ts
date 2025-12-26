import type BNote from "../becca/entities/bnote";
import log from "./log";

interface Manifest {
    name: string;
    prefix: string;
    icons: Record<string, string>;
}

export function processIconPack(iconPackNote: BNote) {
    const manifest = iconPackNote.getJsonContentSafely();
    if (!manifest) {
        log.error(`Icon pack is missing JSON manifest (or has syntax errors): ${iconPackNote.title} (${iconPackNote.noteId})`);
        return;
    }

    console.log("Got manifest", manifest);
}
