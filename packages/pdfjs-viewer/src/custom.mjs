async function main() {
    // Wait for the PDF viewer application to be available.
    while (!window.PDFViewerApplication) {
        await new Promise(r => setTimeout(r, 50));
    }

    const app = PDFViewerApplication;
    await app.initializedPromise;    

    app.eventBus.on("documentloaded", () => {
        const storage = app.pdfDocument.annotationStorage;
        let timeout = null;

        function debouncedSave() {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(async () => {
                if (!storage) return;
                const data = await app.pdfDocument.saveDocument(storage);
                window.parent.postMessage({
                    type: "pdfjs-viewer-document-modified",
                    data: data 
                }, "*");
                storage.resetModified();
                timeout = null;
            }, 2_000);
        }
        
        app.eventBus.on("annotationeditorcommit", debouncedSave);
        app.eventBus.on("annotationeditorparamschanged", debouncedSave);
        app.eventBus.on("annotationeditorstateschanged", evt => {
            const { activeEditorId } = evt;

            // When activeEditorId becomes null, an editor was just committed
            if (activeEditorId === null) {
                debouncedSave();
            }
        });
    });
};

main();
console.log("Custom script loaded");