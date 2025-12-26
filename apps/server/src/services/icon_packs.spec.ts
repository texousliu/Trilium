import { buildNote } from "../test/becca_easy_mocking";
import { determineBestFontAttachment, generateCss, IconPackManifest, processIconPack } from "./icon_packs";

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
        expect(iconPack?.manifest).toMatchObject(manifest);
    });
});

describe("Mapping attachments", () => {
    it("handles woff2", () => {
        const iconPackNote = buildNote({
            type: "text",
            attachments: [
                {
                    role: "file",
                    title: "Font",
                    mime: "font/woff2"
                }
            ]
        });
        const attachment = determineBestFontAttachment(iconPackNote);
        expect(attachment?.mime).toStrictEqual("font/woff2");
    });

    it("handles woff", () => {
        const iconPackNote = buildNote({
            type: "text",
            attachments: [
                {
                    role: "file",
                    title: "Font",
                    mime: "font/woff"
                }
            ]
        });
        const attachment = determineBestFontAttachment(iconPackNote);
        expect(attachment?.mime).toStrictEqual("font/woff");
    });

    it("handles ttf", () => {
        const iconPackNote = buildNote({
            type: "text",
            attachments: [
                {
                    role: "file",
                    title: "Font",
                    mime: "font/ttf"
                }
            ]
        });
        const attachment = determineBestFontAttachment(iconPackNote);
        expect(attachment?.mime).toStrictEqual("font/ttf");
    });

    it("prefers woff2", () => {
        const iconPackNote = buildNote({
            type: "text",
            attachments: [
                {
                    role: "file",
                    title: "Font",
                    mime: "font/woff"
                },
                {
                    role: "file",
                    title: "Font",
                    mime: "font/ttf"
                },
                {
                    role: "file",
                    title: "Font",
                    mime: "font/woff2"
                }
            ]
        });
        const attachment = determineBestFontAttachment(iconPackNote);
        expect(attachment?.mime).toStrictEqual("font/woff2");
    });
});

describe("CSS generation", () => {
    it("generates the CSS", () => {
        const manifest: IconPackManifest = {
            name: "Boxicons v2",
            prefix: "bx",
            icons: {
                "bx-ball": "\ue9c2",
                "bxs-party": "\uec92"
            }
        };
        const iconPackNote = buildNote({
            type: "text",
            content: JSON.stringify(manifest),
            attachments: [
                {
                    role: "file",
                    title: "Font",
                    mime: "font/woff2"
                }
            ]
        });
        const processedResult = processIconPack(iconPackNote);
        expect(processedResult).toBeTruthy();
        const css = generateCss(processedResult!, iconPackNote);

        console.log(css);
        expect(css).toContain("@font-face");
        expect(css).toContain("font-family: 'trilium-icon-pack-bx'");
    });
});
