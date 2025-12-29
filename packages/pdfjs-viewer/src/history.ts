export default function interceptViewHistory() {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
        if (key === "pdfjs.history") {
            console.log(`Intercepted setting view history: ${key} = ${value}`);
            window.parent.postMessage({
                type: "pdfjs-viewer-save-view-history",
                data: value
            }, "*");
            return;
        }

        return originalSetItem.call(this, key, value);
    }

    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key: string) {
        if (key === "pdfjs.history") {
            return JSON.stringify(window.TRILIUM_VIEW_HISTORY_STORE || {});
        }

        return originalGetItem.call(this, key);
    }
}
