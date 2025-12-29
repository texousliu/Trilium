let outlineMap: Map<string, any> | null = null;

export async function extractAndSendToc() {
    const app = window.PDFViewerApplication;

    try {
        const outline = await app.pdfDocument.getOutline();

        if (!outline || outline.length === 0) {
            window.parent.postMessage({
                type: "pdfjs-viewer-toc",
                data: null
            }, "*");
            return;
        }

        // Store outline items with their destinations for later scrolling
        outlineMap = new Map();
        const toc = convertOutlineToToc(outline, 0, outlineMap);

        window.parent.postMessage({
            type: "pdfjs-viewer-toc",
            data: toc
        }, "*");
    } catch (error) {
        window.parent.postMessage({
            type: "pdfjs-viewer-toc",
            data: null
        }, "*");
    }
}

function convertOutlineToToc(outline: any[], level = 0, outlineMap?: Map<string, any>, parentId = ""): any[] {
    return outline.map((item, index) => {
        const id = parentId ? `${parentId}-${index}` : `pdf-outline-${index}`;

        if (outlineMap) {
            outlineMap.set(id, item);
        }

        return {
            title: item.title,
            level: level,
            dest: item.dest,
            id: id,
            items: item.items && item.items.length > 0 ? convertOutlineToToc(item.items, level + 1, outlineMap, id) : []
        };
    });
}

export function setupScrollToHeading() {
    window.addEventListener("message", async (event) => {
        if (event.data?.type === "trilium-scroll-to-heading") {
            const headingId = event.data.headingId;

            if (!outlineMap) return;

            const outlineItem = outlineMap.get(headingId);
            if (!outlineItem || !outlineItem.dest) return;

            const app = window.PDFViewerApplication;

            // Navigate to the destination
            try {
                const dest = typeof outlineItem.dest === 'string'
                    ? await app.pdfDocument.getDestination(outlineItem.dest)
                    : outlineItem.dest;

                if (dest) {
                    app.pdfLinkService.goToDestination(dest);
                }
            } catch (error) {
                console.error("Error navigating to heading:", error);
            }
        }
    });
}
