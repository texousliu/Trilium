import { LOCALES } from "@triliumnext/commons";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const scriptDir = dirname(fileURLToPath(import.meta.url));

describe("i18n", () => {
    it("translations are valid JSON", () => {
        for (const locale of LOCALES) {
            if (locale.contentOnly) {
                continue;
            }

            const translationPath = join(scriptDir, "..", "translations", locale.id, "translation.json");
            const translationFile = readFileSync(translationPath, { encoding: "utf-8" });
            expect(() => JSON.parse(translationFile), `JSON error while parsing locale '${locale.id}' at "${translationPath}"`)
                .not.toThrow();
        }
    });
});
