import { join } from "path";
import NoteMeta from "../../meta/note_meta";
import { ZipExportProvider } from "./abstract_provider";
import { RESOURCE_DIR } from "../../resource_dir";
import { getResourceDir, isDev } from "../../utils";
import fs from "fs";
import { renderNoteForExport } from "../../../share/content_renderer";
import type BNote from "../../../becca/entities/bnote.js";
import type BBranch from "../../../becca/entities/bbranch.js";

export default class ShareThemeExportProvider extends ZipExportProvider {

    private assetsMeta: NoteMeta[] = [];

    prepareMeta(): void {
        const assets = [
            "style.css",
            "script.js",
            "boxicons.css",
            "boxicons.eot",
            "boxicons.woff2",
            "boxicons.woff",
            "boxicons.ttf",
            "boxicons.svg",
            "icon-color.svg"
        ];

        for (const asset of assets) {
            const assetMeta = {
                noImport: true,
                dataFileName: asset
            };
            this.assetsMeta.push(assetMeta);
            this.metaFile.files.push(assetMeta);
        }
    }

    prepareContent(title: string, content: string | Buffer, noteMeta: NoteMeta, note: BNote, branch: BBranch): string | Buffer {
        if (!noteMeta?.notePath?.length) {
            throw new Error("Missing note path.");
        }
        const basePath = "../".repeat(noteMeta.notePath.length - 1);

        content = renderNoteForExport(note, branch, basePath);

        return content;
    }

    afterDone(): void {
        this.#saveAssets(this.rootMeta, this.assetsMeta);
    }

    #saveAssets(rootMeta: NoteMeta, assetsMeta: NoteMeta[]) {
        for (const assetMeta of assetsMeta) {
            if (!assetMeta.dataFileName) {
                continue;
            }

            let cssContent = getShareThemeAssets(assetMeta.dataFileName);
            this.archive.append(cssContent, { name: assetMeta.dataFileName });
        }
    }

}

function getShareThemeAssets(nameWithExtension: string) {
    // Rename share.css to style.css.
    if (nameWithExtension === "style.css") {
        nameWithExtension = "share.css";
    } else if (nameWithExtension === "script.js") {
        nameWithExtension = "share.js";
    }

    let path: string | undefined;
    if (nameWithExtension === "icon-color.svg") {
        path = join(RESOURCE_DIR, "images", nameWithExtension);
    } else if (isDev) {
        path = join(getResourceDir(), "..", "..", "client", "dist", "src", nameWithExtension);
    }

    if (!path) {
        throw new Error("Not yet defined.");
    }

    return fs.readFileSync(path);
}
