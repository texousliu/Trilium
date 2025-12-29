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
        const optionalContentConfig = await app.pdfDocument.getOptionalContentConfig();
        
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

        // Get group details for each ID
        const layers = groupIds.map(id => {
            const group = optionalContentConfig.getGroup(id);
            return {
                id,
                name: group?.name || `Layer ${id}`,
                visible: optionalContentConfig.isVisible(id)
            };
        }).filter(layer => layer.name); // Filter out invalid layers

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
        const optionalContentConfig = await app.pdfDocument.getOptionalContentConfig();
        
        if (!optionalContentConfig) {
            return;
        }

        // Set visibility
        optionalContentConfig.setVisibility(layerId, visible);

        // Trigger re-render
        app.eventBus.dispatch("optionalcontentconfigchanged");

        // Send updated layer state back
        await extractAndSendLayers();
    } catch (error) {
        console.error("Error toggling layer:", error);
    }
}
