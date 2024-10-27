import fs from "fs";

export function listSyntaxHighlightingThemes() {
    const path = "node_modules/@highlightjs/cdn-assets/styles";
    const allThemes = fs
        .readdirSync(path)
        .filter((el) => el.endsWith(".min.css"))
        .map((name) => {
            const nameWithoutExtension = name.replace(".min.css", "");            
            
            return {
                val: `default:${nameWithoutExtension}`,
                title: nameWithoutExtension.replace(/-/g, " ")
            };
        });
    return allThemes;
}