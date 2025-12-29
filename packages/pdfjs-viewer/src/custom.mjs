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
                console.log("Triggered debounce save");
                const data = await app.pdfDocument.saveDocument();
                window.parent.postMessage({
                    type: "pdfjs-viewer-document-modified",
                    data: data 
                }, "*");
                storage.resetModified();
                timeout = null;
            }, 2_000);
        }
        
        storage.onSetModified = async () => {
            debouncedSave();
        };
    });
};

main();
console.log("Custom script loaded");