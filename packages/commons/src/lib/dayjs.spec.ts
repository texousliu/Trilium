import { LOCALES } from "./i18n.js";
import { DAYJS_LOADER } from "./dayjs.js";

describe("dayjs", () => {
    it("all dayjs locales are valid", async () => {
        for (const locale of LOCALES) {
            const dayjsLoader = DAYJS_LOADER[locale.id];
            expect(dayjsLoader, `Locale ${locale.id} missing.`).toBeDefined();

            await dayjsLoader();
        }
    });
});
