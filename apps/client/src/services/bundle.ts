import BasicWidget from "../widgets/basic_widget.js";
import RightPanelWidget from "../widgets/right_panel_widget.js";
import froca from "./froca.js";
import type { Entity, WidgetDefinition } from "./frontend_script_api.js";
import { t } from "./i18n.js";
import ScriptContext from "./script_context.js";
import server from "./server.js";
import toast from "./toast.js";
import toastService, { showError } from "./toast.js";
import utils, { getErrorMessage } from "./utils.js";

// TODO: Deduplicate with server.
export interface Bundle {
    script: string;
    html: string;
    noteId: string;
    allNoteIds: string[];
}

type LegacyWidget = (BasicWidget | RightPanelWidget) & {
    parentWidget?: string;
};
type Widget = LegacyWidget | WidgetDefinition;

async function getAndExecuteBundle(noteId: string, originEntity = null, script = null, params = null) {
    const bundle = await server.post<Bundle>(`script/bundle/${noteId}`, {
        script,
        params
    });

    return await executeBundle(bundle, originEntity);
}

export async function executeBundle(bundle: Bundle, originEntity?: Entity | null, $container?: JQuery<HTMLElement>) {
    const apiContext = await ScriptContext(bundle.noteId, bundle.allNoteIds, originEntity, $container);

    try {
        return await function () {
            return eval(`const apiContext = this; (async function() { ${bundle.script}\r\n})()`);
        }.call(apiContext);
    } catch (e: any) {
        const note = await froca.getNote(bundle.noteId);
        toastService.showPersistent({
            id: `custom-script-failure-${note?.noteId}`,
            title: t("toast.bundle-error.title"),
            icon: "bx bx-error-circle",
            message: t("toast.bundle-error.message", {
                id: note?.noteId,
                title: note?.title,
                message: e.message
            })
        });
        logError("Widget initialization failed: ", e);
    }
}

async function executeStartupBundles() {
    const isMobile = utils.isMobile();
    const scriptBundles = await server.get<Bundle[]>(`script/startup${  isMobile ? "?mobile=true" : ""}`);

    for (const bundle of scriptBundles) {
        await executeBundle(bundle);
    }
}

export class WidgetsByParent {
    private byParent: Record<string, Widget[]>;

    constructor() {
        this.byParent = {};
    }

    add(widget: Widget) {
        if ("type" in widget && widget.type === "react-widget") {
            // React-based script.
            const reactWidget = widget as WidgetDefinition;
            this.byParent[reactWidget.parent] = this.byParent[reactWidget.parent] || [];
            this.byParent[reactWidget.parent].push(widget);
        } else if ("parentWidget" in widget && widget.parentWidget) {
            this.byParent[widget.parentWidget] = this.byParent[widget.parentWidget] || [];
            this.byParent[widget.parentWidget].push(widget);
        } else {
            console.log(`Custom widget does not have mandatory 'parentWidget' property defined`);
        }
    }

    get(parentName: string) {
        if (!this.byParent[parentName]) {
            return [];
        }

        return (
            this.byParent[parentName]
                // previously, custom widgets were provided as a single instance, but that has the disadvantage
                // for splits where we actually need multiple instaces and thus having a class to instantiate is better
                // https://github.com/zadam/trilium/issues/4274
                .map((w: any) => {
                    if ("type" in w && w.type === "react-widget") {
                        try {
                            return w.render();
                        } catch (e: unknown) {
                            toast.showErrorTitleAndMessage(t("toast.widget-render-error.title"), getErrorMessage(e));
                            return null;
                        }
                    }

                    return (w.prototype ? new w() : w);
                })
                .filter(Boolean)
        );
    }
}

async function getWidgetBundlesByParent() {
    const widgetsByParent = new WidgetsByParent();

    try {
        const scriptBundles = await server.get<Bundle[]>("script/widgets");

        for (const bundle of scriptBundles) {
            let widget;

            try {
                widget = await executeBundle(bundle);
                if (widget) {
                    widget._noteId = bundle.noteId;
                    widgetsByParent.add(widget);
                }
            } catch (e: any) {
                const noteId = bundle.noteId;
                const note = await froca.getNote(noteId);
                toastService.showPersistent({
                    id: `custom-script-failure-${noteId}`,
                    title: t("toast.bundle-error.title"),
                    icon: "bx bx-error-circle",
                    message: t("toast.bundle-error.message", {
                        id: noteId,
                        title: note?.title,
                        message: e.message
                    })
                });

                logError("Widget initialization failed: ", e);
                continue;
            }
        }
    } catch (e) {
        toastService.showPersistent({
            title: t("toast.widget-list-error.title"),
            message: getErrorMessage(e),
            icon: "bx bx-error-circle"
        });
    }

    return widgetsByParent;
}

export default {
    executeBundle,
    getAndExecuteBundle,
    executeStartupBundles,
    getWidgetBundlesByParent
};
