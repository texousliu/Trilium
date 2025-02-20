import { describe, expect, it } from "vitest";
import * as i18n from "./i18n.js";
import path from "path";
import fs from "fs";

describe("i18n", () => {
    it("frontend translations are valid JSON", () => {
        const translationDir = "src/public/translations";
        const locales = i18n.getLocales();

        for (const locale of locales) {
            const translationPath = path.join(translationDir, locale.id, "translation.json");
            const translationFile = fs.readFileSync(translationPath, { encoding: "utf-8" });
            expect(() => {
                JSON.parse(translationFile);
            }, `JSON error while parsing locale '${locale.id}' at "${translationPath}"`).not.toThrow();
        }
    });
});
