import interceptPersistence from "./persistence";

const LOG_EVENT_BUS = false;

async function main() {
    console.log("Hi");
    interceptPersistence(getCustomAppOptions());

    // Wait for the PDF viewer application to be available.
    while (!window.PDFViewerApplication) {
        await new Promise(r => setTimeout(r, 50));
    }
    const app = window.PDFViewerApplication;

    if (LOG_EVENT_BUS) {
        patchEventBus();
    }
    app.eventBus.on("documentloaded", () => {
        manageSave();
        extractAndSendToc();
        setupScrollToHeading();
    });
    await app.initializedPromise;
};

function getCustomAppOptions() {
    const urlParams = new URLSearchParams(window.location.search);

    return {
        localeProperties: {
            // Read from URL query
            lang: urlParams.get("lang") || "en"
        }
    };
}

function manageSave() {
    const app = window.PDFViewerApplication;
    const storage = app.pdfDocument.annotationStorage;
    let timeout = null;

    function debouncedSave() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(async () => {
            if (!storage) return;
            const data = await app.pdfDocument.saveDocument();
            window.parent.postMessage({
                type: "pdfjs-viewer-document-modified",
                data: data
            }, "*");
            storage.resetModified();
            timeout = null;
        }, 2_000);
    }

    app.pdfDocument.annotationStorage.onSetModified = debouncedSave;  // works great for most cases, including forms.
    app.eventBus.on("annotationeditorcommit", debouncedSave);
    app.eventBus.on("annotationeditorparamschanged", debouncedSave);
    app.eventBus.on("annotationeditorstateschanged", evt => {   // needed for detecting when annotations are moved around.
        const { activeEditorId } = evt;

        // When activeEditorId becomes null, an editor was just committed
        if (activeEditorId === null) {
            debouncedSave();
        }
    });
}

function patchEventBus() {
    const eventBus = window.PDFViewerApplication.eventBus;
    const originalDispatch = eventBus.dispatch.bind(eventBus);

    eventBus.dispatch = (type: string, data?: any) => {
        console.log("PDF.js event:", type, data);
        return originalDispatch(type, data);
    };
}

async function extractAndSendToc() {
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
        const outlineMap = new Map();
        const toc = convertOutlineToToc(outline, 0, outlineMap);

        // Store the map globally so setupScrollToHeading can access it
        (window as any).TRILIUM_OUTLINE_MAP = outlineMap;

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

main();
console.log("Custom script loaded");

function setupScrollToHeading() {
    window.addEventListener("message", async (event) => {
        if (event.data?.type === "trilium-scroll-to-heading") {
            const headingId = event.data.headingId;
            const outlineMap = (window as any).TRILIUM_OUTLINE_MAP as Map<string, any>;

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
