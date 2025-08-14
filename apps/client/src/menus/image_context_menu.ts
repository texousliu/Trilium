import { t } from "../services/i18n.js";
import utils from "../services/utils.js";
import contextMenu from "./context_menu.js";
import imageService from "../services/image.js";
import mediaViewer from "../services/media_viewer.js";
import type { MediaItem } from "../services/media_viewer.js";

const PROP_NAME = "imageContextMenuInstalled";

function setupContextMenu($image: JQuery<HTMLElement>) {
    if (!utils.isElectron() || $image.prop(PROP_NAME)) {
        return;
    }

    $image.prop(PROP_NAME, true);
    $image.on("contextmenu", (e) => {
        e.preventDefault();

        contextMenu.show({
            x: e.pageX,
            y: e.pageY,
            items: [
                {
                    title: "View in Lightbox",
                    command: "viewInLightbox",
                    uiIcon: "bx bx-expand",
                    enabled: true
                },
                {
                    title: t("image_context_menu.copy_reference_to_clipboard"),
                    command: "copyImageReferenceToClipboard",
                    uiIcon: "bx bx-directions"
                },
                {
                    title: t("image_context_menu.copy_image_to_clipboard"),
                    command: "copyImageToClipboard",
                    uiIcon: "bx bx-copy"
                }
            ],
            selectMenuItemHandler: async ({ command }) => {
                if (command === "viewInLightbox") {
                    const src = $image.attr("src");
                    const alt = $image.attr("alt");
                    const title = $image.attr("title");
                    
                    if (!src) {
                        console.error("Missing image source");
                        return;
                    }
                    
                    const item: MediaItem = {
                        src: src,
                        alt: alt || "Image",
                        title: title || alt,
                        element: $image[0] as HTMLElement
                    };
                    
                    // Try to get actual dimensions
                    const imgElement = $image[0] as HTMLImageElement;
                    if (imgElement.naturalWidth && imgElement.naturalHeight) {
                        item.width = imgElement.naturalWidth;
                        item.height = imgElement.naturalHeight;
                    }
                    
                    mediaViewer.openSingle(item, {
                        bgOpacity: 0.95,
                        showHideOpacity: true,
                        pinchToClose: true,
                        closeOnScroll: false,
                        closeOnVerticalDrag: true,
                        wheelToZoom: true,
                        getThumbBoundsFn: () => {
                            // Get position for zoom animation
                            const rect = imgElement.getBoundingClientRect();
                            return {
                                x: rect.left,
                                y: rect.top,
                                w: rect.width
                            };
                        }
                    });
                } else if (command === "copyImageReferenceToClipboard") {
                    imageService.copyImageReferenceToClipboard($image);
                } else if (command === "copyImageToClipboard") {
                    try {
                        const nativeImage = utils.dynamicRequire("electron").nativeImage;
                        const clipboard = utils.dynamicRequire("electron").clipboard;

                        const src = $image.attr("src");
                        if (!src) {
                            console.error("Missing src");
                            return;
                        }

                        const response = await fetch(src);
                        const blob = await response.blob();

                        clipboard.writeImage(nativeImage.createFromBuffer(Buffer.from(await blob.arrayBuffer())));
                    } catch (error) {
                        console.error("Failed to copy image to clipboard:", error);
                    }
                } else {
                    throw new Error(`Unrecognized command '${command}'`);
                }
            }
        });
    });
}

export default {
    setupContextMenu
};
