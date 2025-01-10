import { trimIndentation } from "../../../spec/support/utils.js";
import markdownService from "./markdown.js";

describe("markdown", () => {
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
});
