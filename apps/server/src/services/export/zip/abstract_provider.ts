import { Archiver } from "archiver";
import type { default as NoteMeta, NoteMetaFile } from "../../meta/note_meta.js";

interface ZipExportProviderData {
    getNoteTargetUrl: (targetNoteId: string, sourceMeta: NoteMeta) => string | null;
    metaFile: NoteMetaFile;
    rootMeta: NoteMeta;
    archive: Archiver;
}

export abstract class ZipExportProvider {

    metaFile: NoteMetaFile;
    getNoteTargetUrl: (targetNoteId: string, sourceMeta: NoteMeta) => string | null;
    rootMeta: NoteMeta;
    archive: Archiver;

    constructor(data: ZipExportProviderData) {
        this.metaFile = data.metaFile;
        this.getNoteTargetUrl = data.getNoteTargetUrl;
        this.rootMeta = data.rootMeta;
        this.archive = data.archive;
    }

    abstract prepareMeta(): void;
    abstract afterDone(): void;
}
