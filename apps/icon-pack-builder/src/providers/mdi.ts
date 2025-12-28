import { readFileSync } from "fs";
import { join } from "path";
import { extractClassNamesFromCss } from "../utils";
import type { IconPackData } from "../provider";

export default function buildIcons(): IconPackData {
    const baseDir = join(__dirname, "../../../../node_modules/@mdi/font");

    const cssFilePath = join(baseDir, "css", "materialdesignicons.min.css");
    const cssFileContent = readFileSync(cssFilePath, "utf-8");

    return {
        name: "Material Design Icons",
        prefix: "mdi",
        // manifest: {
        //     icons: extractClassNamesFromCss(cssFileContent, "mdi"),
        // },
    };
}
