import { buildNote } from "../test/becca_easy_mocking";
import { IconPackManifest, processIconPack } from "./icon_packs";

describe("Processing icon packs", () => {
    it("doesn't crash if icon pack is incorrect type", () => {
        const iconPack = processIconPack(buildNote({
            type: "text",
            content: "Foo"
        }));
        expect(iconPack).toBeFalsy();
    });

    it("processes manifest", () => {
        const manifest: IconPackManifest = {
            name: "Boxicons v2",
            prefix: "bx",
            icons: {
                "bx-ball": "\ue9c2",
                "bxs-party": "\uec92"
            }
        };
        const iconPack = processIconPack(buildNote({
            type: "text",
            content: JSON.stringify(manifest)
        }));
        expect(iconPack?.iconMappings).toMatchObject({
            "bx-ball": "\ue9c2",
            "bxs-party": "\uec92"
        });
    });
});
