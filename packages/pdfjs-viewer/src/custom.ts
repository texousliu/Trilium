const LOG_EVENT_BUS = false;

async function main() {
    // Wait for the PDF viewer application to be available.
    while (!window.PDFViewerApplication) {
        await new Promise(r => setTimeout(r, 50));
    }

    const app = window.PDFViewerApplication;
    if (LOG_EVENT_BUS) {
        patchEventBus();
    }
    app.eventBus.on("documentloaded", () => {
        interceptViewHistory();
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

function interceptViewHistory() {
    const app = window.PDFViewerApplication;
    let activeFingerprint: string = app.pdfDocument.fingerprints[0];

    const store = app.store;
    store._writeToStorage = async function() {
        const fileEntry = store.database.files?.find(f => f.fingerprint === activeFingerprint);
        const databaseStr = JSON.stringify(fileEntry);
        console.log("Write attempt.", databaseStr);
    }
    store._readFromStorage = async function() {
        console.log("Read attempt", activeFingerprint);
        return "{}";
    }
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
