import { describe, expect, it } from "vitest";
import options from "../services/options";
import { formatDateTime } from "./formatters";

describe("formatDateTime", () => {
    it("tolerates incorrect locale", () => {
        options.set("formattingLocale", "cn_TW");

        expect(formatDateTime(new Date())).toBeTruthy();
        expect(formatDateTime(new Date(), "full", "none")).toBeTruthy();
        expect(formatDateTime(new Date(), "none", "full")).toBeTruthy();
    });
});
