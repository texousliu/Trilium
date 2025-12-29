export async function setupPdfLayers() {
    const app = window.PDFViewerApplication;

    // Extract immediately since we're called after documentloaded
    await extractAndSendLayers();

    // Listen for layer visibility toggle requests
    window.addEventListener("message", async (event) => {
        if (event.data?.type === "trilium-toggle-layer") {
            const layerId = event.data.layerId;
            const visible = event.data.visible;
            await toggleLayer(layerId, visible);
        }
    });
}

async function extractAndSendLayers() {
    const app = window.PDFViewerApplication;

    try {
        // Get the config from the viewer if available (has updated state), otherwise from document
        const pdfViewer = app.pdfViewer;
        const optionalContentConfig = pdfViewer?.optionalContentConfigPromise
            ? await pdfViewer.optionalContentConfigPromise
            : await app.pdfDocument.getOptionalContentConfig();

        if (!optionalContentConfig) {
            window.parent.postMessage({
                type: "pdfjs-viewer-layers",
                layers: []
            }, "*");
            return;
        }

        // Get all layer group IDs from the order
        const order = optionalContentConfig.getOrder();
        if (!order || order.length === 0) {
            window.parent.postMessage({
                type: "pdfjs-viewer-layers",
                layers: []
            }, "*");
            return;
        }

        // Flatten the order array (it can be nested) and extract group IDs
        const groupIds: string[] = [];
        const flattenOrder = (items: any[]) => {
            for (const item of items) {
                if (typeof item === 'string') {
                    groupIds.push(item);
                } else if (Array.isArray(item)) {
                    flattenOrder(item);
                } else if (item && typeof item === 'object' && item.id) {
                    groupIds.push(item.id);
                }
            }
        };
        flattenOrder(order);

        // Get group details for each ID and only include valid, toggleable layers
        const layers = groupIds.map(id => {
            const group = optionalContentConfig.getGroup(id);

            // Only include groups that have a name and usage property (actual layers)
            if (!group || !group.name || !group.usage) {
                return null;
            }

            // Use group.visible property like PDF.js viewer does
            return {
                id,
                name: group.name,
                visible: group.visible
            };
        }).filter(layer => layer !== null); // Filter out invalid layers

        window.parent.postMessage({
            type: "pdfjs-viewer-layers",
            layers
        }, "*");
    } catch (error) {
        console.error("Error extracting layers:", error);
        window.parent.postMessage({
            type: "pdfjs-viewer-layers",
            layers: []
        }, "*");
    }
}

async function toggleLayer(layerId: string, visible: boolean) {
    const app = window.PDFViewerApplication;

    try {
        const pdfViewer = app.pdfViewer;
        if (!pdfViewer) {
            return;
        }

        const optionalContentConfig = await pdfViewer.optionalContentConfigPromise;
        if (!optionalContentConfig) {
            return;
        }

        // Set visibility on the config (like PDF.js viewer does)
        optionalContentConfig.setVisibility(layerId, visible);

        // Dispatch optionalcontentconfig event with the existing config
        app.eventBus.dispatch("optionalcontentconfig", {
            source: app,
            promise: Promise.resolve(optionalContentConfig)
        });

        // Send updated layer state back
        await extractAndSendLayers();
    } catch (error) {
        console.error("Error toggling layer:", error);
    }
}
