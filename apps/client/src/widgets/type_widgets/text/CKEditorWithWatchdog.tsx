import { HTMLProps, RefObject, useEffect, useRef, useState } from "preact/compat";
import { PopupEditor, ClassicEditor, EditorWatchdog, type WatchdogConfig, CKTextEditor } from "@triliumnext/ckeditor5";
import { buildConfig, BuildEditorOptions } from "./config";

interface CKEditorWithWatchdogProps extends Pick<HTMLProps<HTMLDivElement>, "className" | "tabIndex"> {
    content: string | undefined;
    contentLanguage: string | null | undefined;
    isClassicEditor?: boolean;
    watchdogRef: RefObject<EditorWatchdog>;
    watchdogConfig?: WatchdogConfig;
    onNotificationWarning?: (evt: any, data: any) => void;
    onWatchdogStateChange?: (watchdog: EditorWatchdog<any>) => void;
    onChange: () => void;
    /** Called upon whenever a new CKEditor instance is initialized, whether it's the first initialization, after a crash or after a config change that requires it (e.g. content language). */
    onEditorInitialized?: (editor: CKTextEditor) => void;
}

export default function CKEditorWithWatchdog({ content, contentLanguage, className, tabIndex, isClassicEditor, watchdogRef: externalWatchdogRef, watchdogConfig, onNotificationWarning, onWatchdogStateChange, onChange, onEditorInitialized }: CKEditorWithWatchdogProps) {
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
                forceGplLicense: false,
                isClassicEditor: !!isClassicEditor,
                contentLanguage: contentLanguage ?? null
            });

            setEditor(editor);

            // Inspector integration.
            if (import.meta.env.VITE_CKEDITOR_ENABLE_INSPECTOR === "true") {
                const CKEditorInspector = (await import("@ckeditor/ckeditor5-inspector")).default;
                CKEditorInspector.attach(editor);
            }

            onEditorInitialized?.(editor);

            return editor;
        });

        if (onWatchdogStateChange) {
            watchdog.on("stateChange", () => onWatchdogStateChange(watchdog));
        }

        watchdog.create(container);

        return () => watchdog.destroy();
    }, [ contentLanguage ]);

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
