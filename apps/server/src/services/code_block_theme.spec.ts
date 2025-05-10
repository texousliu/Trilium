import { describe, expect, it } from "vitest";
import { readThemesFromFileSystem } from "./code_block_theme.js";

import themeNames from "./code_block_theme_names.json" with { type: "json" };
import path = require("path");

describe("Code block theme", () => {
    it("all themes are mapped", () => {
        const themes = readThemesFromFileSystem(path.join(__dirname, "../../node_modules/@highlightjs/cdn-assets/styles"));

        const mappedThemeNames = new Set(Object.values(themeNames));
        const unmappedThemeNames = new Set<string>();

        for (const theme of themes) {
            if (!mappedThemeNames.has(theme.title)) {
                unmappedThemeNames.add(theme.title);
            }
        }

        expect(unmappedThemeNames.size, `Unmapped themes: ${Array.from(unmappedThemeNames).join(", ")}`).toBe(0);
    });
});
