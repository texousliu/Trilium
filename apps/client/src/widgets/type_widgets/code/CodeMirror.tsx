import { useEffect, useRef } from "preact/hooks";
import { EditorConfig, default as VanillaCodeMirror } from "@triliumnext/codemirror";
import { useTriliumOptionBool } from "../../react/hooks";

interface CodeMirrorProps extends Omit<EditorConfig, "parent"> {
    content: string;
    mime: string;
    className?: string;
}

export default function CodeMirror({ className, content, mime, ...extraOpts }: CodeMirrorProps) {
    const parentRef = useRef<HTMLPreElement>(null);
    const codeEditorRef = useRef<VanillaCodeMirror>(null);
    const [ codeLineWrapEnabled ] = useTriliumOptionBool("codeLineWrapEnabled");

    useEffect(() => {
        if (!parentRef.current) return;

        const codeEditor = new VanillaCodeMirror({
            parent: parentRef.current,
            lineWrapping: codeLineWrapEnabled,
            ...extraOpts
        });
        codeEditorRef.current = codeEditor;

        return () => codeEditor.destroy();
    }, []);

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
