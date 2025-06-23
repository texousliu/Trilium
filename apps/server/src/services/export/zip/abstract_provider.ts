import { Archiver } from "archiver";
import type { default as NoteMeta, NoteMetaFile } from "../../meta/note_meta.js";
import type BNote from "../../../becca/entities/bnote.js";
import type BBranch from "../../../becca/entities/bbranch.js";

type RewriteLinksFn = (content: string, noteMeta: NoteMeta) => string;

export interface AdvancedExportOptions {
    /**
     * If `true`, then only the note's content will be kept. If `false` (default), then each page will have its own <html> template.
     */
    skipHtmlTemplate?: boolean;

    /**
     * Provides a custom function to rewrite the links found in HTML or Markdown notes. This method is called for every note imported, if it's of the right type.
     *
     * @param originalRewriteLinks the original rewrite links function. Can be used to access the default behaviour without having to reimplement it.
     * @param getNoteTargetUrl the method to obtain a note's target URL, used internally by `originalRewriteLinks` but can be used here as well.
     * @returns a function to rewrite the links in HTML or Markdown notes.
     */
    customRewriteLinks?: (originalRewriteLinks: RewriteLinksFn, getNoteTargetUrl: (targetNoteId: string, sourceMeta: NoteMeta) => string | null) => RewriteLinksFn;
}

export interface ZipExportProviderData {
    branch: BBranch;
    getNoteTargetUrl: (targetNoteId: string, sourceMeta: NoteMeta) => string | null;
    metaFile: NoteMetaFile;
    rootMeta: NoteMeta;
    archive: Archiver;
    zipExportOptions?: AdvancedExportOptions;
    rewriteFn: RewriteLinksFn;
}

export abstract class ZipExportProvider {
    branch: BBranch;
    metaFile: NoteMetaFile;
    getNoteTargetUrl: (targetNoteId: string, sourceMeta: NoteMeta) => string | null;
    rootMeta: NoteMeta;
    archive: Archiver;
    zipExportOptions?: AdvancedExportOptions;
    rewriteFn: RewriteLinksFn;

    constructor(data: ZipExportProviderData) {
        this.branch = data.branch;
        this.metaFile = data.metaFile;
        this.getNoteTargetUrl = data.getNoteTargetUrl;
        this.rootMeta = data.rootMeta;
        this.archive = data.archive;
        this.zipExportOptions = data.zipExportOptions;
        this.rewriteFn = data.rewriteFn;
    }

    abstract prepareMeta(): void;
    abstract prepareContent(title: string, content: string | Buffer, noteMeta: NoteMeta, note: BNote | undefined, branch: BBranch): string | Buffer;
    abstract afterDone(): void;
}
