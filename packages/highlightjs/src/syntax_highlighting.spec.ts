import { describe, it } from "vitest";
import definitions from "./syntax_highlighting.js";

describe("Syntax highlighting definitions", () => {
    it("every entry is readable", async () => {
        for (const [ mime, mapping ] of Object.entries(definitions)) {
            if (mapping === null) {
                continue;
            }

            await mapping.loader;
        }
    });
});
