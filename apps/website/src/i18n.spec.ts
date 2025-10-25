import { describe, expect, it } from "vitest";
import { mapLocale } from "./i18n";

describe("mapLocale", () => {
    it("maps Chinese", () => {
        expect(mapLocale("zh-TW")).toStrictEqual("zh-Hant");
        expect(mapLocale("zh-CN")).toStrictEqual("zh-Hans");
    });

    it("maps languages without countries", () => {
        expect(mapLocale("ro-RO")).toStrictEqual("ro");
        expect(mapLocale("ro")).toStrictEqual("ro");
    });
});
