import type NoteMeta from "../../meta/note_meta.js";
import { escapeHtml } from "../../utils";
import cssContent from "@triliumnext/ckeditor5/content.css";
import html from "html";
import { ZipExportProvider } from "./abstract_provider.js";

export default class HtmlExportProvider extends ZipExportProvider {

    private navigationMeta: NoteMeta | null = null;
    private indexMeta: NoteMeta | null = null;
    private cssMeta: NoteMeta | null = null;

    prepareMeta() {
        this.navigationMeta = {
            noImport: true,
            dataFileName: "navigation.html"
        };

        this.metaFile.files.push(this.navigationMeta);

        this.indexMeta = {
            noImport: true,
            dataFileName: "index.html"
        };

        this.metaFile.files.push(this.indexMeta);

        this.cssMeta = {
            noImport: true,
            dataFileName: "style.css"
        };

        this.metaFile.files.push(this.cssMeta);
    }

    afterDone() {
        if (!this.navigationMeta || !this.indexMeta || !this.cssMeta) {
            throw new Error("Missing meta.");
        }

        this.#saveNavigation(this.rootMeta, this.navigationMeta);
        this.#saveIndex(this.rootMeta, this.indexMeta);
        this.#saveCss(this.rootMeta, this.cssMeta);
    }

    #saveNavigationInner(meta: NoteMeta) {
        let html = "<li>";

        const escapedTitle = escapeHtml(`${meta.prefix ? `${meta.prefix} - ` : ""}${meta.title}`);

        if (meta.dataFileName && meta.noteId) {
            const targetUrl = this.getNoteTargetUrl(meta.noteId, this.rootMeta);

            html += `<a href="${targetUrl}" target="detail">${escapedTitle}</a>`;
        } else {
            html += escapedTitle;
        }

        if (meta.children && meta.children.length > 0) {
            html += "<ul>";

            for (const child of meta.children) {
                html += this.#saveNavigationInner(child);
            }

            html += "</ul>";
        }

        return `${html}</li>`;
    }

    #saveNavigation(rootMeta: NoteMeta, navigationMeta: NoteMeta) {
        if (!navigationMeta.dataFileName) {
            return;
        }

        const fullHtml = `<html>
    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="style.css">
    </head>
    <body>
        <ul>${this.#saveNavigationInner(rootMeta)}</ul>
    </body>
    </html>`;
        const prettyHtml = fullHtml.length < 100_000 ? html.prettyPrint(fullHtml, { indent_size: 2 }) : fullHtml;

        this.archive.append(prettyHtml, { name: navigationMeta.dataFileName });
    }

    #saveIndex(rootMeta: NoteMeta, indexMeta: NoteMeta) {
        let firstNonEmptyNote;
        let curMeta = rootMeta;

        if (!indexMeta.dataFileName) {
            return;
        }

        while (!firstNonEmptyNote) {
            if (curMeta.dataFileName && curMeta.noteId) {
                firstNonEmptyNote = this.getNoteTargetUrl(curMeta.noteId, rootMeta);
            }

            if (curMeta.children && curMeta.children.length > 0) {
                curMeta = curMeta.children[0];
            } else {
                break;
            }
        }

        const fullHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<frameset cols="25%,75%">
    <frame name="navigation" src="navigation.html">
    <frame name="detail" src="${firstNonEmptyNote}">
</frameset>
</html>`;

        this.archive.append(fullHtml, { name: indexMeta.dataFileName });
    }

    #saveCss(rootMeta: NoteMeta, cssMeta: NoteMeta) {
        if (!cssMeta.dataFileName) {
            return;
        }

        this.archive.append(cssContent, { name: cssMeta.dataFileName });
    }

}

