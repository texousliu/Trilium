import type { AttributeEditor, EditorConfig } from "@triliumnext/ckeditor5";
import { useEffect, useRef } from "preact/compat";

interface CKEditorOpts {
    className: string;
    tabIndex?: number;
    config: EditorConfig;
    editor: typeof AttributeEditor;
    disableNewlines?: boolean;
    disableSpellcheck?: boolean;
    onChange?: () => void;
}

export default function CKEditor({ className, tabIndex, editor, config, disableNewlines, disableSpellcheck, onChange }: CKEditorOpts) {
    const editorContainerRef = useRef<HTMLDivElement>(null);    

    useEffect(() => {
        if (!editorContainerRef.current) return;

        editor.create(editorContainerRef.current, config).then((textEditor) => {
            if (disableNewlines) {
                textEditor.editing.view.document.on(
                    "enter",
                    (event, data) => {
                        // disable entering new line - see https://github.com/ckeditor/ckeditor5/issues/9422
                        data.preventDefault();
                        event.stop();
                    },
                    { priority: "high" }
                );
            }

            if (disableSpellcheck) {
                const documentRoot = textEditor.editing.view.document.getRoot();
                if (documentRoot) {
                    textEditor.editing.view.change((writer) => writer.setAttribute("spellcheck", "false", documentRoot));
                }
            }

            if (onChange) {
                textEditor.model.document.on("change:data", onChange);
            }
        });
    }, []);

    return (
        <div
            ref={editorContainerRef}
            className={className}
            tabIndex={tabIndex}
        />
    )
}