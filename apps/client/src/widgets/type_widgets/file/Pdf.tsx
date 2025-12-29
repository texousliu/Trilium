import { useEffect } from "preact/hooks";

import FNote from "../../../entities/fnote";
import server from "../../../services/server";

export default function PdfPreview({ note }: { note: FNote }) {
    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            if (event.data?.type === "pdfjs-viewer-document-modified" && event.data?.data) {
                const blob = new Blob([event.data.data], { type: note.mime });
                server.upload(`notes/${note.noteId}/file`, new File([blob], note.title, { type: note.mime }));
            }
        }

        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [ note ]);

    return (
        <iframe
            class="pdf-preview"
            src={`pdfjs/web/viewer.html?file=../../api/notes/${note.noteId}/open`} />
    );
}
