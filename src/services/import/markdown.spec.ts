import { describe, it, expect } from "vitest";
import { trimIndentation } from "../../../spec/support/utils.js";
import markdownService from "./markdown.js";

describe("markdown", () => {
    it("rewrites language of known language tags", () => {
        const conversionTable = {
            "nginx": "language-text-x-nginx-conf",
            "diff": "language-text-x-diff",
            "javascript": "language-application-javascript-env-backend",
            "css": "language-text-css",
            "mips": "language-text-x-asm-mips"
        };

        for (const [ input, output ] of Object.entries(conversionTable)) {
            const result = markdownService.renderToHtml(trimIndentation`\
                \`\`\`${input}
                Hi
                \`\`\`
            `, "title");
            expect(result).toBe(trimIndentation`\
                <pre><code class="${output}">Hi</code></pre>`);
        }
    });

    it("rewrites language of unknown language tags", () => {
        const result = markdownService.renderToHtml(trimIndentation`\
            \`\`\`unknownlanguage
            Hi
            \`\`\`
        `, "title");
        expect(result).toBe(trimIndentation`\
            <pre><code class="language-text-x-trilium-auto">Hi</code></pre>`);
    });

    it("converts h1 heading", () => {
        const result = markdownService.renderToHtml(trimIndentation`\
            # Hello
            ## world
            # another one
            Hello, world
        `, "title");
        expect(result).toBe(trimIndentation`\
            <h2>Hello</h2>
            <h2>world</h2>
            <h2>another one</h2>
            <p>Hello, world</p>
        `);
    });


    it("parses duplicate title with escape correctly", () => {
        const result = markdownService.renderToHtml(trimIndentation`\
            # What's new
            Hi there
        `, "What's new")
        expect(result).toBe(`\n<p>Hi there</p>\n`);
    });
});
