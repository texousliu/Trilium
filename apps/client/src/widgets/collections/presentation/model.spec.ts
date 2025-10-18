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
                    children: [
                        {
                            id: "slide4",
                            title: "Second-sub"
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
});
