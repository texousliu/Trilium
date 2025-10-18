import { beforeAll, describe, expect, it } from "vitest";
import { buildNote } from "../../../test/easy-froca";
import FNote from "../../../entities/fnote";
import { buildPresentationModel, PresentationModel } from "./model";

let presentationNote!: FNote;
let data!: PresentationModel;

describe("Presentation model", () => {
    beforeAll(async () => {
        presentationNote = buildNote({
            title: "Presentation",
            id: "presentation",
            "#viewType": "presentation",
            "children": [
                {
                    id: "slide1",
                    title: "First slide",
                    children: [
                        {
                            id: "slide2",
                            title: "First-sub"
                        }
                    ]
                },
                {
                    title: "Second slide",
                    id: "slide3",
                    content: `<p>Go to&nbsp;<a class="reference-link" href="#root/presentation/slide1">First slide</a>.</p>`,
                    children: [
                        {
                            id: "slide4",
                            title: "Second-sub",
                            content: `<p>Go to&nbsp;<a class="reference-link" href="#root/presentation/slide2">First-sub</a>.</p>`,
                        }
                    ]
                }
            ]
        });
        data = await buildPresentationModel(presentationNote);
    });

    it("it correctly maps horizontal and vertical slides", () => {
        expect(data).toMatchObject({
            slides: [
                {
                    noteId: "slide1",
                    verticalSlides: [
                        {
                            noteId: "slide2"
                        }
                    ]
                },
                {
                    noteId: "slide3",
                    verticalSlides: [
                        {
                            noteId: "slide4"
                        }
                    ]
                }
            ]
        })
    });

    it("empty slides don't render children", () => {
        expect(data.slides[0].content.__html).toStrictEqual("");
    });

    it("rewrites links to other slides", () => {
        expect(data.slides[1].content.__html).toStrictEqual(`<div class="ck-content"><p>Go to&nbsp;<a class="reference-link" href="#/slide1"><span class="bx bx-folder"></span>First slide</a>.</p></div>`);
        expect(data.slides[1].verticalSlides![0].content.__html).toStrictEqual(`<div class="ck-content"><p>Go to&nbsp;<a class="reference-link" href="#/slide2"><span class="bx bx-note"></span>First-sub</a>.</p></div>`);
    });

    it("doesn't rewrite links if they are not part of the slideshow", () => {

    });
});
