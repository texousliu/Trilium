import { HTMLProps, useEffect, useRef } from "preact/compat";
import { PopupEditor, ClassicEditor, EditorWatchdog, type WatchdogConfig } from "@triliumnext/ckeditor5";
import { buildConfig, BuildEditorOptions } from "./config";

interface CKEditorWithWatchdogProps extends Pick<HTMLProps<HTMLDivElement>, "className" | "tabIndex"> {
    isClassicEditor?: boolean;
    watchdogConfig?: WatchdogConfig;
    buildEditorOpts: Omit<BuildEditorOptions, "isClassicEditor">;
    onNotificationWarning?: (evt: any, data: any) => void;
    onWatchdogStateChange?: (watchdog: EditorWatchdog<any>) => void;
}

export default function CKEditorWithWatchdog({ className, tabIndex, isClassicEditor, watchdogConfig, buildEditorOpts, onNotificationWarning, onWatchdogStateChange }: CKEditorWithWatchdogProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const watchdog = buildWatchdog(!!isClassicEditor, watchdogConfig);
        watchdog.setCreator(async () => {
            const editor = await buildEditor(container, !!isClassicEditor, {
                ...buildEditorOpts,
                isClassicEditor: !!isClassicEditor
            });

            if (onNotificationWarning) {
                editor.plugins.get("Notification").on("show:warning", onNotificationWarning);
            }

            return editor;
        });

        if (onWatchdogStateChange) {
            watchdog.on("stateChange", () => onWatchdogStateChange(watchdog));
        }

        watchdog.create(container);

        return () => watchdog.destroy();
    }, []);

    return (
        <div ref={containerRef} className={className} tabIndex={tabIndex}>

        </div>
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
