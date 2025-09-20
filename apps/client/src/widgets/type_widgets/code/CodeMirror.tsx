import { useEffect, useRef } from "preact/hooks";
import { EditorConfig, getThemeById, default as VanillaCodeMirror } from "@triliumnext/codemirror";
import { useSyncedRef, useTriliumEvent, useTriliumOption, useTriliumOptionBool } from "../../react/hooks";
import { refToJQuerySelector } from "../../react/react_utils";
import { RefObject } from "preact";
import { CODE_THEME_DEFAULT_PREFIX as DEFAULT_PREFIX } from "../constants";

interface CodeMirrorProps extends Omit<EditorConfig, "parent"> {
    content: string;
    mime: string;
    className?: string;
    ntxId: string | null | undefined;
    editorRef?: RefObject<VanillaCodeMirror>;
    containerRef?: RefObject<HTMLPreElement>;
}

export default function CodeMirror({ className, content, mime, ntxId, editorRef: externalEditorRef, containerRef: externalContainerRef, ...extraOpts }: CodeMirrorProps) {
    const parentRef = useSyncedRef(externalContainerRef);
    const codeEditorRef = useRef<VanillaCodeMirror>();
    const [ codeLineWrapEnabled ] = useTriliumOptionBool("codeLineWrapEnabled");
    const [ codeNoteTheme ] = useTriliumOption("codeNoteTheme");
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

    // React to theme changes.
    useEffect(() => {
        if (codeEditorRef.current && codeNoteTheme.startsWith(DEFAULT_PREFIX)) {
            const theme = getThemeById(codeNoteTheme.substring(DEFAULT_PREFIX.length));
            if (theme) {
                codeEditorRef.current.setTheme(theme);
            }
        }
    }, [ codeEditorRef, codeNoteTheme ]);

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
