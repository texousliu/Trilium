import markdownExportService from "../../../src/services/export/md.js";
import { trimIndentation } from "../../support/utils.js";

describe("Markdown export", () => {
    it("trims language tag for code blocks", () => {
        const html = trimIndentation`\
            <p>A diff:</p>
            <pre><code class="language-text-x-diff">Hello
            -world
            +worldy
            </code></pre>`;
        const expected = trimIndentation`\
            A diff:

            \`\`\`diff
            Hello
            -world
            +worldy

            \`\`\``;

        expect(markdownExportService.toMarkdown(html)).toBe(expected);
    });
});