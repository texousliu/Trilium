document.addEventListener("webviewerloaded", async () => {
    const app = PDFViewerApplication;
    await app.initializedPromise;
    
    app.eventBus.on("documentloaded", () => {
        const storage = app.pdfDocument.annotationStorage;
        
        storage.onSetModified = (data) => {
            console.log("Annotations modified: ", all);
            storage.resetModified();
        };

        const oldSetValue = storage.setValue;
        storage.setValue = (key, value) => {
            console.log("Setting annotation: ", key, value);
            oldSetValue.call(storage, key, value);
        }        
    });
});

console.log("Custom script loaded");