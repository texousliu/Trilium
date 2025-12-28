import { readFileSync } from "node:fs";
import { join } from "node:path";

import { IconPackData } from "../provider";
import { getModulePath } from "../utils";

export default function buildIcons(): IconPackData {
    const packName = "regular";
    const baseDir = join(getModulePath("@phosphor-icons/web"), "src", packName);
    const iconIndex = JSON.parse(readFileSync(join(baseDir, "selection.json"), "utf-8"));
    const icons: IconPackData["manifest"]["icons"] = {};

    function removeSuffix(name: string) {
        if (name.endsWith(`-${packName}`)) {
            name = name.split("-").slice(0, -1).join("-");
        }
        return name;
    }

    for (const icon of iconIndex.icons) {
        const terms = icon.properties.name.split(", ").map((t: string) => removeSuffix(t));
        const name = removeSuffix(icon.icon.tags[0]);

        const id = `ph-${name}`;
        icons[id] = {
            glyph: `${String.fromCharCode(icon.properties.code)}`,
            terms
        };
    }

    return {
        name: "Phosphor Icons",
        prefix: "ph",
        manifest: {
            icons
        },
        fontFile: {
            name: "phosphor-webfont.woff2",
            mime: "font/woff2",
            content: readFileSync(join(baseDir, "Phosphor.woff2"))
        }
    };
}
