import fs from "fs";
import themeNames from "./code_block_theme_names.json" with { type: "json" }
import { t } from "i18next";

interface ColorTheme {
    val: string;
    title: string;
}

export function listSyntaxHighlightingThemes() {
    const path = "node_modules/@highlightjs/cdn-assets/styles";
    const systemThemes = readThemesFromFileSystem(path);

    return {
        "": [
            {
                val: "none",
                title: t("code_block.theme_none")
            }
        ],
        ...groupThemesByLightOrDark(systemThemes)
    }
}

function readThemesFromFileSystem(path: string): ColorTheme[] {
    return fs.readdirSync(path)
        .filter((el) => el.endsWith(".min.css"))
        .map((name) => {
            const nameWithoutExtension = name.replace(".min.css", "");            
            let title = nameWithoutExtension.replace(/-/g, " ");

            if (title in themeNames) {
                title = (themeNames as Record<string, string>)[title];
            }
            
            return {
                val: `default:${nameWithoutExtension}`,
                title: title
            };
        });
}

function groupThemesByLightOrDark(listOfThemes: ColorTheme[]) {
    const darkThemes = [];
    const lightThemes = [];

    for (const theme of listOfThemes) {
        if (theme.title.includes("Dark")) {
            darkThemes.push(theme);
        } else {
            lightThemes.push(theme);
        }
    }

    const output: Record<string, ColorTheme[]> = {};
    output[t("code_block.theme_group_light")] = lightThemes;
    output[t("code_block.theme_group_dark")] = darkThemes;
    return output;
}