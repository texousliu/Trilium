import { useEffect, useRef } from "preact/hooks";

import FNote from "../../../entities/fnote";
import server from "../../../services/server";

const VARIABLE_WHITELIST = new Set([
    "root-background",
    "main-background-color",
    "main-border-color",
    "main-text-color"
]);

export default function PdfPreview({ note }: { note: FNote }) {
    const iframeRef =  useRef<HTMLIFrameElement>(null);

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
            ref={iframeRef}
            class="pdf-preview"
            src={`pdfjs/web/viewer.html?file=../../api/notes/${note.noteId}/open`}
            onLoad={() => {
                const doc = iframeRef.current?.contentDocument;
                if (!doc) return;

                const style = doc.createElement('style');
                style.id = 'client-root-vars';
                style.textContent = cssVarsToString(getRootCssVariables());

                doc.head.appendChild(style);
            }}
        />
    );
}

function getRootCssVariables() {
    const styles = getComputedStyle(document.documentElement);
    const vars = {};

    for (let i = 0; i < styles.length; i++) {
        const prop = styles[i];
        if (prop.startsWith('--') && VARIABLE_WHITELIST.has(prop.substring(2))) {
            vars[`--tn-${prop.substring(2)}`] = styles.getPropertyValue(prop).trim();
        }
    }

    return vars;
}

function cssVarsToString(vars) {
    return `:root {\n${Object.entries(vars)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n')}\n}`;
}
