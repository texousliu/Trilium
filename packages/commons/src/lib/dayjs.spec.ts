import { LOCALES } from "./i18n.js";
import { DAYJS_LOADER, dayjs } from "./dayjs.js";

describe("dayjs", () => {
    it("all dayjs locales are valid", async () => {
        for (const locale of LOCALES) {
            const dayjsLoader = DAYJS_LOADER[locale.id];
            expect(dayjsLoader, `Locale ${locale.id} missing.`).toBeDefined();

            await dayjsLoader();
        }
    });

    describe("Plugins", () => {
        it("is-same-or-before is available", () => {
            expect(dayjs("2023-10-01").isSameOrBefore(dayjs("2023-10-02"))).toBe(true);
        });

        it("is-same-or-after is available", () => {
            expect(dayjs("2023-10-02").isSameOrAfter(dayjs("2023-10-01"))).toBe(true);
        });

        it("is-between is available", () => {
            expect(dayjs("2023-10-02").isBetween(dayjs("2023-10-01"), dayjs("2023-10-03"))).toBe(true);
        });

        it("advanced format is available", () => {
            expect(dayjs("2023-10-01").format("Q")).not.toBe("Q");
        });
    });
});
