import { lint } from "./eslint.js";
import { trimIndentation } from "../../../../spec/support/utils.js";
import { describe, expect, it } from "vitest";

describe("Linter", () => {
    it("reports some basic errors", async () => {
        const result = await lint(trimIndentation`
            for (const i = 0; i<10; i++) {
            }
        `);
        expect(result).toMatchObject([
            { message: "'i' is constant.", },
            { message: "Empty block statement." }
        ]);
    });

    it("reports no error for correct script", async () => {
        const result = await lint(trimIndentation`
            const foo = "bar";
            console.log(foo.toString());
            for (const x of [ 1, 2, 3]) {
                console.log(x?.toString());
            }

            api.showMessage("Hi");
        `);
        expect(result.length).toBe(0);
    });
});
