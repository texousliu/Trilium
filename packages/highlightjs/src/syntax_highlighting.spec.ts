import { describe, it } from "vitest";
import definitions from "./syntax_highlighting.js";
import hljs from "highlight.js";

describe("Syntax highlighting definitions", () => {
    it("every entry is readable", async () => {
        for (const [ mime, mapping ] of Object.entries(definitions)) {
            if (mapping === null) {
                continue;
            }

            const language = (await mapping.loader).default;

            hljs.registerLanguage(mime, language);
            hljs.highlight("Hello world", {
                language: mime
            });
        }
    });
});
