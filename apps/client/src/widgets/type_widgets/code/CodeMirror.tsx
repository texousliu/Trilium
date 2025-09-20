import { useEffect, useRef } from "preact/hooks";
import { EditorConfig, default as VanillaCodeMirror } from "@triliumnext/codemirror";
import { useSyncedRef, useTriliumEvent, useTriliumOptionBool } from "../../react/hooks";
import { refToJQuerySelector } from "../../react/react_utils";
import { RefObject } from "preact";

interface CodeMirrorProps extends Omit<EditorConfig, "parent"> {
    content: string;
    mime: string;
    className?: string;
    ntxId: string | null | undefined;
    editorRef?: RefObject<VanillaCodeMirror>;
}

export default function CodeMirror({ className, content, mime, ntxId, editorRef: externalEditorRef, ...extraOpts }: CodeMirrorProps) {
    const parentRef = useRef<HTMLPreElement>(null);
    const codeEditorRef = useRef<VanillaCodeMirror>();
    const [ codeLineWrapEnabled ] = useTriliumOptionBool("codeLineWrapEnabled");
    const initialized = $.Deferred();

    // Integration within Trilium's event system.
    useTriliumEvent("executeWithCodeEditor", async ({ resolve, ntxId: eventNtxId }) => {
        if (eventNtxId !== ntxId) return;
        await initialized.promise();
        resolve(codeEditorRef.current!);
    });

    useTriliumEvent("executeWithContentElement", async ({ resolve, ntxId: eventNtxId}) => {
        if (eventNtxId !== ntxId) return;
        await initialized.promise();
        resolve(refToJQuerySelector(parentRef));
    });

    // Create CodeMirror instance.
    useEffect(() => {
        if (!parentRef.current) return;

        const codeEditor = new VanillaCodeMirror({
            parent: parentRef.current,
            lineWrapping: codeLineWrapEnabled,
            ...extraOpts
        });
        codeEditorRef.current = codeEditor;
        if (externalEditorRef) {
            externalEditorRef.current = codeEditor;
        }
        initialized.resolve();

        return () => codeEditor.destroy();
    }, []);

    // React to text changes.
    useEffect(() => {
        const codeEditor = codeEditorRef.current;
        codeEditor?.setText(content ?? "");
        codeEditor?.setMimeType(mime);
        codeEditor?.clearHistory();
    }, [content]);

    return (
        <pre ref={parentRef} className={className} />
    )
}
