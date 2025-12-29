async function main() {
    // Wait for the PDF viewer application to be available.
    while (!window.PDFViewerApplication) {
        await new Promise(r => setTimeout(r, 50));
    }

    const app = PDFViewerApplication;
    await app.initializedPromise;
    
    app.eventBus.on("documentloaded", () => {
        const storage = app.pdfDocument.annotationStorage;
        
        storage.onSetModified = async () => {
            console.log("Document modified");
            const data = await app.pdfDocument.saveDocument();
            window.parent.postMessage({
                type: "pdfjs-viewer-document-modified",
                data: data 
            }, "*");
            storage.resetModified();
        };
    });
};

main();
console.log("Custom script loaded");