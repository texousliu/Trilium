import { readFileSync } from "fs";
import { join } from "path";
import { extractClassNamesFromCss } from "../utils";

export default function buildIcons() {
    const baseDir = join(__dirname, "../../../../node_modules/@mdi/font");

    const cssFilePath = join(baseDir, "css", "materialdesignicons.min.css");
    const cssFileContent = readFileSync(cssFilePath, "utf-8");


    console.log(extractClassNamesFromCss(cssFileContent, "mdi"));
}
