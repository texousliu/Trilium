import { HTMLProps, RefObject, useEffect, useRef, useState } from "preact/compat";
import { PopupEditor, ClassicEditor, EditorWatchdog, type WatchdogConfig, CKTextEditor } from "@triliumnext/ckeditor5";
import { buildConfig, BuildEditorOptions } from "./config";
import { Editor } from "tabulator-tables";

interface CKEditorWithWatchdogProps extends Pick<HTMLProps<HTMLDivElement>, "className" | "tabIndex"> {
    content?: string;
    isClassicEditor?: boolean;
    watchdogRef: RefObject<EditorWatchdog>;
    watchdogConfig?: WatchdogConfig;
    buildEditorOpts: Omit<BuildEditorOptions, "isClassicEditor">;
    onNotificationWarning?: (evt: any, data: any) => void;
    onWatchdogStateChange?: (watchdog: EditorWatchdog<any>) => void;
    onChange: () => void;
}

export default function CKEditorWithWatchdog({ content, className, tabIndex, isClassicEditor, watchdogRef: externalWatchdogRef, watchdogConfig, buildEditorOpts, onNotificationWarning, onWatchdogStateChange, onChange }: CKEditorWithWatchdogProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const watchdogRef = useRef<EditorWatchdog>(null);
    const [ editor, setEditor ] = useState<CKTextEditor>();

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const watchdog = buildWatchdog(!!isClassicEditor, watchdogConfig);
        watchdogRef.current = watchdog;
        externalWatchdogRef.current = watchdog;
        watchdog.setCreator(async () => {
            const editor = await buildEditor(container, !!isClassicEditor, {
                ...buildEditorOpts,
                isClassicEditor: !!isClassicEditor
            });

            setEditor(editor);

            return editor;
        });

        if (onWatchdogStateChange) {
            watchdog.on("stateChange", () => onWatchdogStateChange(watchdog));
        }

        watchdog.create(container);

        return () => watchdog.destroy();
    }, []);

    // React to content changes.
    useEffect(() => editor?.setData(content ?? ""), [ editor, content ]);

    // React to notification warning callback.
    useEffect(() => {
        if (!onNotificationWarning || !editor) return;
        const notificationPlugin = editor.plugins.get("Notification");
        notificationPlugin.on("show:warning", onNotificationWarning);
        return () => notificationPlugin.off("show:warning", onNotificationWarning);
    }, [ editor, onNotificationWarning ]);

    // React to on change listener.
    useEffect(() => {
        if (!editor) return;
        editor.model.document.on("change:data", onChange);
        return () => editor.model.document.off("change:data", onChange);
    }, [ editor, onChange ]);

    return (
        <div ref={containerRef} className={className} tabIndex={tabIndex} />
    );
}

function buildWatchdog(isClassicEditor: boolean, watchdogConfig?: WatchdogConfig) {
    if (isClassicEditor) {
        return new EditorWatchdog(ClassicEditor, watchdogConfig);
    } else {
        return new EditorWatchdog(PopupEditor, watchdogConfig);
    }
}

async function buildEditor(element: HTMLElement, isClassicEditor: boolean, opts: BuildEditorOptions) {
    const editorClass = isClassicEditor ? ClassicEditor : PopupEditor;
    let config = await buildConfig(opts);
    let editor = await editorClass.create(element, config);

    if (editor.isReadOnly) {
        editor.destroy();

        opts.forceGplLicense = true;
        config = await buildConfig(opts);
        editor = await editorClass.create(element, config);
    }
    return editor;
}
