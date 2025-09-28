import { describe, it, expect } from "vitest";
import { getContent, renderCode, renderText, type Result } from "./content_renderer.js";
import { trimIndentation } from "@triliumnext/commons";
import { buildShareNote } from "../test/shaca_mocking.js";

describe("content_renderer", () => {
    it("Reports protected notes not being renderable", () => {
        const note = buildShareNote({ isProtected: true });
        const result = getContent(note);
        expect(result.content).toStrictEqual("<p>Protected note cannot be displayed</p>");
    });

    describe("Text note", () => {
        it("parses simple note", () => {
            const content = trimIndentation`\
                <figure class="image image-style-align-right image_resized" style="width:29.84%;">
                    <img style="aspect-ratio:150/150;" src="api/attachments/TnyuBzEXJZln/image/Trilium Demo_icon-color.svg" width="150" height="150">
                </figure>
                <p>
                    <strong>
                        Welcome to Trilium Notes!
                    </strong>
                </p>`;
            const note = buildShareNote({
                title: "Note",
                content
            });
            const result = getContent(note);
            expect(result.content).toStrictEqual(content);
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
