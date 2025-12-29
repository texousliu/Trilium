export function setupPdfPages() {
    const app = window.PDFViewerApplication;

    // Send initial page info when pages are initialized
    app.eventBus.on("pagesinit", () => {
        sendPageInfo();
    });

    // Also send immediately if document is already loaded
    if (app.pdfDocument && app.pdfViewer) {
        sendPageInfo();
    }

    // Track current page changes
    app.eventBus.on("pagechanging", (evt: any) => {
        window.parent.postMessage({
            type: "pdfjs-viewer-current-page",
            currentPage: evt.pageNumber
        }, "*");
    });

    // Listen for scroll-to-page requests
    window.addEventListener("message", (event) => {
        if (event.data?.type === "trilium-scroll-to-page") {
            const pageNumber = event.data.pageNumber;
            app.pdfViewer.currentPageNumber = pageNumber;
        }
    });

    // Listen for thumbnail requests
    window.addEventListener("message", async (event) => {
        if (event.data?.type === "trilium-request-thumbnail") {
            const pageNumber = event.data.pageNumber;
            console.log("[PDF Pages] Received thumbnail request for page:", pageNumber);
            await generateThumbnail(pageNumber);
        }
    });
}

function sendPageInfo() {
    const app = window.PDFViewerApplication;

    console.log("[PDF Pages] Sending page info:", {
        totalPages: app.pdfDocument?.numPages,
        currentPage: app.pdfViewer?.currentPageNumber
    });

    window.parent.postMessage({
        type: "pdfjs-viewer-page-info",
        totalPages: app.pdfDocument.numPages,
        currentPage: app.pdfViewer.currentPageNumber
    }, "*");
}

async function generateThumbnail(pageNumber: number) {
    const app = window.PDFViewerApplication;

    console.log("[PDF Pages] Generating thumbnail for page:", pageNumber);

    try {
        const page = await app.pdfDocument.getPage(pageNumber);

        // Create canvas for thumbnail
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        // Set thumbnail size (smaller than actual page)
        const viewport = page.getViewport({ scale: 0.2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render page to canvas
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        console.log("[PDF Pages] Sending thumbnail for page:", pageNumber, "size:", dataUrl.length);

        // Send thumbnail to parent
        window.parent.postMessage({
            type: "pdfjs-viewer-thumbnail",
            pageNumber,
            dataUrl
        }, "*");
    } catch (error) {
        console.error(`Error generating thumbnail for page ${pageNumber}:`, error);
    }
}
