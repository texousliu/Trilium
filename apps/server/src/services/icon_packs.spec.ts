import { buildNote } from "../test/becca_easy_mocking";
import { processIconPack } from "./icon_packs";

describe("Processing icon packs", () => {
    it("doesn't crash if icon pack is incorrect type", () => {
        const iconPack = processIconPack(buildNote({
            type: "text",
            content: "Foo"
        }));
        expect(iconPack).toBeFalsy();
    });
});
