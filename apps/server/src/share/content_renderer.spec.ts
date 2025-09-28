import { describe, it, expect } from "vitest";
import { renderCode, renderText, type Result } from "./content_renderer.js";
import { trimIndentation } from "@triliumnext/commons";
import SNote from "./shaca/entities/snote.js";

describe("content_renderer", () => {
    describe("renderText", () => {
        it("parses simple note", () => {
            const input = trimIndentation`\
                <figure class="image image-style-align-right image_resized" style="width:29.84%;">
                    <img style="aspect-ratio:150/150;" src="api/attachments/TnyuBzEXJZln/image/Trilium Demo_icon-color.svg" width="150" height="150">
                </figure>
                <p>
                    <strong>
                        Welcome to Trilium Notes!
                    </strong>
                </p>`;

            const result = {
                content: input,
                header: "",
                isEmpty: false
            };
            renderText(result, new SNote([ "root", "Note", "text", "text/plain", "1234", "2025-09-28T00:00Z", false]));
            expect(result.content).toMatch(input);
        });
    });

    describe("renderCode", () => {
        it("identifies empty content", () => {
            const emptyResult: Result = {
                header: "",
                content: "   "
            };
            renderCode(emptyResult);
            expect(emptyResult.isEmpty).toBeTruthy();
        });

        it("identifies unsupported content type", () => {
            const emptyResult: Result = {
                header: "",
                content: Buffer.from("Hello world")
            };
            renderCode(emptyResult);
            expect(emptyResult.isEmpty).toBeTruthy();
        });

        it("wraps code in <pre>", () => {
            const result: Result = {
                header: "",
                content: "\tHello\nworld"
            };
            renderCode(result);
            expect(result.isEmpty).toBeFalsy();
            expect(result.content).toBe("<pre>\tHello\nworld</pre>");
        });
    });
});
