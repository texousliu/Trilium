import { describe, it, expect } from "vitest";
import { getContent, renderCode, type Result } from "./content_renderer.js";
import { trimIndentation } from "@triliumnext/commons";
import { buildShareNote, buildShareNotes } from "../test/shaca_mocking.js";

describe("content_renderer", () => {
    beforeAll(() => {
        vi.mock("../becca/becca_loader.js", () => ({
            default: {
                load: vi.fn(),
                loaded: Promise.resolve()
            }
        }));
    });

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
            const note = buildShareNote({ content });
            const result = getContent(note);
            expect(result.content).toStrictEqual(content);
        });

        it("handles attachment link", () => {
            const content = trimIndentation`\
                <h1>Test</h1>
                <p>
                    <a class="reference-link" href="#root/iwTmeWnqBG5Q?viewMode=attachments&amp;attachmentId=q14s2Id7V6pp">
                        5863845791835102555.mp4
                    </a>
                    &nbsp;
                </p>
            `;
            const note = buildShareNote({
                content,
                attachments: [ { id: "q14s2Id7V6pp" } ]
            });
            const result = getContent(note);
            expect(result.content).toStrictEqual(trimIndentation`\
                <h1>Test</h1>
                <p>
                    <a class="reference-link attachment-link role-file" href="api/attachments/q14s2Id7V6pp/download">
                        5863845791835102555.mp4
                    </a>
                    &nbsp;
                </p>
            `);
        });

        it("renders included notes", () => {
            buildShareNotes([
                { id: "subnote1", content: `<p>Foo</p><div>Bar</div>` },
                { id: "subnote2", content: `<strong>Baz</strong>` }
            ]);
            const note = buildShareNote({
                id: "note1",
                content: trimIndentation`\
                    <p>Before</p>
                    <section class="include-note" data-note-id="subnote1" data-box-size="small">&nbsp;</section>
                    <section class="include-note" data-note-id="subnote2" data-box-size="small">&nbsp;</section>
                    <p>After</p>
                `
            });
            const result = getContent(note);
            expect(result.content).toStrictEqual(trimIndentation`\
                <p>Before</p>
                <p>Foo</p><div>Bar</div>
                <strong>Baz</strong>
                <p>After</p>
            `);
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
