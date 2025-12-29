import type { PDFDocumentProxy } from "pdfjs-dist";

declare global {
    interface Window {
        PDFViewerApplication?: {
            initializedPromise: Promise<void>;
            pdfDocument: PDFDocumentProxy;
            eventBus: {
                on(event: string, listener: (...args: any[]) => void): void;
                dispatch(event: string, data?: any): void;
            };
        };
    }
}
