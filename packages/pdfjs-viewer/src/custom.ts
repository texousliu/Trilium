import interceptViewHistory from "./history";

const LOG_EVENT_BUS = false;

async function main() {
    // Wait for the PDF viewer application to be available.
    while (!window.PDFViewerApplication) {
        await new Promise(r => setTimeout(r, 50));
    }

    const app = window.PDFViewerApplication;
    interceptViewHistory();

    if (LOG_EVENT_BUS) {
        patchEventBus();
    }
    app.eventBus.on("documentloaded", () => {
        manageSave();
    });
    await app.initializedPromise;
};

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

main();
console.log("Custom script loaded");
