import path from "path";
import fs from "fs";
import type { HiddenSubtreeItem } from "./hidden_subtree.js";
import type NoteMeta from "./meta/note_meta.js";
import type { NoteMetaFile } from "./meta/note_meta.js";
import { fileURLToPath } from "url";
import { isDev } from "./utils.js";

export function getHelpHiddenSubtreeData() {
    const srcRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
    const appDir = path.join(srcRoot, "public", isDev ? "app" : "app-dist");
    const helpDir = path.join(appDir, "doc_notes", "en", "User Guide");
    const metaFilePath = path.join(helpDir, "!!!meta.json");
    const metaFileContent = JSON.parse(fs.readFileSync(metaFilePath).toString("utf-8"));

    try {
        return parseNoteMetaFile(metaFileContent as NoteMetaFile);
    } catch (e) {
        console.warn(e);
        return [];
    }
}

function parseNoteMetaFile(noteMetaFile: NoteMetaFile): HiddenSubtreeItem[] {
    if (!noteMetaFile.files) {
        return [];
    }

    const metaRoot = parseNoteMeta(noteMetaFile.files[0]);
    return metaRoot.children ?? [];
}

function parseNoteMeta(noteMeta: NoteMeta): HiddenSubtreeItem {
    const item: HiddenSubtreeItem = {
        id: `_help_${noteMeta.noteId}`,
        title: noteMeta.title,
        type: "doc"
    };

    if (noteMeta.children) {
        const children: HiddenSubtreeItem[] = [];
        for (const childMeta of noteMeta.children) {
            children.push(parseNoteMeta(childMeta));
        }

        item.children = children;
    }

    return item;
}
