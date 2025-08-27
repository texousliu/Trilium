import { t } from "i18next";
import "./FloatingButtons.css";
import Button from "./react/Button";
import ActionButton, { ActionButtonProps } from "./react/ActionButton";
import FNote from "../entities/fnote";
import NoteContext from "../components/note_context";
import { useNoteContext, useNoteLabel, useNoteLabelBoolean, useNoteProperty, useTriliumEvent, useTriliumEvents, useTriliumOption, useTriliumOptionBool } from "./react/hooks";
import { useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ParentComponent } from "./react/react_utils";
import Component from "../components/component";
import { VNode } from "preact";
import attributes from "../services/attributes";
import appContext, { EventData, EventNames } from "../components/app_context";
import protected_session_holder from "../services/protected_session_holder";
import options from "../services/options";
import { createImageSrcUrl, openInAppHelpFromUrl } from "../services/utils";
import toast from "../services/toast";
import server from "../services/server";
import { SaveSqlConsoleResponse } from "@triliumnext/commons";
import tree from "../services/tree";
import { copyImageReferenceToClipboard } from "../services/image";

interface FloatingButtonContext {
    parentComponent: Component;
    note: FNote;    
    noteContext: NoteContext;
    /** Shorthand for triggering an event from the parent component. The `ntxId` is automatically handled for convenience. */
    triggerEvent<T extends EventNames>(name: T, data?: Omit<EventData<T>, "ntxId">): void;
}

interface FloatingButtonDefinition {
    component: (context: FloatingButtonContext) => VNode;    
    isEnabled: (context: FloatingButtonContext) => boolean | Promise<boolean>;
}

const FLOATING_BUTTON_DEFINITIONS: FloatingButtonDefinition[] = [
    {
        component: RefreshBackendLogButton,
        isEnabled: ({ note, noteContext }) => note.noteId === "_backendLog" && noteContext.viewScope?.viewMode === "default",
    },
    {
        component: SwitchSplitOrientationButton,
        isEnabled: ({ note, noteContext }) => note.type === "mermaid" && note.isContentAvailable() && !note.hasLabel("readOnly") && noteContext.viewScope?.viewMode === "default"
    },
    {
        component: ToggleReadOnlyButton,
        isEnabled: ({ note, noteContext }) =>
            (note.type === "mermaid" || note.getLabelValue("viewType") === "geoMap")
            && note.isContentAvailable()
            && noteContext.viewScope?.viewMode === "default"
    },
    {
        component: EditButton,
        isEnabled: async ({ note, noteContext }) =>
            noteContext.viewScope?.viewMode === "default"
            && (!note.isProtected || protected_session_holder.isProtectedSessionAvailable())
            && !options.is("databaseReadonly")
            && await noteContext?.isReadOnly()
    },
    {
        component: ShowTocWidgetButton,
        isEnabled: ({ note, noteContext }) => 
            note.type === "text" && noteContext?.viewScope?.viewMode === "default"
            && !!noteContext.viewScope?.tocTemporarilyHidden
    },
    {
        component: ShowHighlightsListWidgetButton,
        isEnabled: ({ note, noteContext }) => 
            note.type === "text" && noteContext?.viewScope?.viewMode === "default"
            && !!noteContext.viewScope?.highlightsListTemporarilyHidden
    },
    {
        component: RunActiveNoteButton,
        isEnabled: ({ note }) => note.mime.startsWith("application/javascript") || note.mime === "text/x-sqlite;schema=trilium"
    },
    {
        component: OpenTriliumApiDocsButton,
        isEnabled: ({ note }) => note.mime.startsWith("application/javascript;env=")
    },
    {
        component: SaveToNoteButton,
        isEnabled: ({ note }) => note.mime === "text/x-sqlite;schema=trilium" && note.isHiddenCompletely()
    },
    {
        component: RelationMapButtons,
        isEnabled: ({ note }) => note.type === "relationMap"
    },
    {
        component: GeoMapButtons,
        isEnabled: ({ note }) => note?.getLabelValue("viewType") === "geoMap" && !note.hasLabel("readOnly")
    },
    {
        component: CopyImageReferenceButton,
        isEnabled: ({ note, noteContext }) =>
            ["mermaid", "canvas", "mindMap"].includes(note?.type ?? "")
            && note?.isContentAvailable() && noteContext.viewScope?.viewMode === "default"
    },
    {
        component: ExportImageButtons,
        isEnabled: ({ note, noteContext }) =>
            ["mermaid", "mindMap"].includes(note?.type ?? "")
            && note?.isContentAvailable() && noteContext?.viewScope?.viewMode === "default"
    }
];

async function getFloatingButtonDefinitions(context: FloatingButtonContext) {
    const defs: FloatingButtonDefinition[] = [];
    for (const def of FLOATING_BUTTON_DEFINITIONS) {
        if (await def.isEnabled(context)) {
            defs.push(def);
        }
    }
    return defs;
}

/*
 * Note:
 *
 * For floating button widgets that require content to overflow, the has-overflow CSS class should
 * be applied to the root element of the widget. Additionally, this root element may need to
 * properly handle rounded corners, as defined by the --border-radius CSS variable.
 */
export default function FloatingButtons() {
    const { note, noteContext } = useNoteContext();
    const parentComponent = useContext(ParentComponent);
    const context = useMemo<FloatingButtonContext | null>(() => {
        if (!note || !noteContext || !parentComponent) return null;

        return {
            note,
            noteContext,
            parentComponent,
            triggerEvent<T extends EventNames>(name: T, data?: Omit<EventData<T>, "ntxId">) {
                parentComponent.triggerEvent(name, {
                    ntxId: noteContext.ntxId,
                    ...data
                } as EventData<T>);
            }
        };
    }, [ note, noteContext, parentComponent ]);

    // Refresh on any note attribute change.
    const [ refreshCounter, setRefreshCounter ] = useState(0);
    useTriliumEvent("entitiesReloaded", ({ loadResults }) => {        
        if (loadResults.getAttributeRows().find(attrRow => attributes.isAffecting(attrRow, note))) {
            setRefreshCounter(refreshCounter + 1);
        }
    });
    useTriliumEvent("readOnlyTemporarilyDisabled", ({ noteContext: eventNoteContext }) => {
        if (noteContext?.ntxId === eventNoteContext.ntxId) {
            setRefreshCounter(refreshCounter + 1);
        }
    });
    useTriliumEvents(["reEvaluateTocWidgetVisibility", "reEvaluateHighlightsListWidgetVisibility"], ({ noteId }) => {
        if (noteId === note?.noteId) {
            setRefreshCounter(refreshCounter + 1);
        }
    });
    
    // Manage the list of items
    const noteMime = useNoteProperty(note, "mime");
    const [ definitions, setDefinitions ] = useState<FloatingButtonDefinition[]>([]);
    useEffect(() => {    
        if (!context) return;
        getFloatingButtonDefinitions(context).then(setDefinitions);
    }, [ context, refreshCounter, noteMime ]);

    return (
        <div className="floating-buttons no-print">
            <div className="floating-buttons-children">
                {context && definitions.map(({ component: Component }) => (
                    <Component {...context} />
                ))}
            </div>

            <ShowFloatingButton />
        </div>
    )
}

function RefreshBackendLogButton({ parentComponent, noteContext }: FloatingButtonContext) {
    return <FloatingButton
        text={t("backend_log.refresh")}
        icon="bx bx-refresh"
        onClick={() => parentComponent.triggerEvent("refreshData", { ntxId: noteContext.ntxId })}
    />
}

function SwitchSplitOrientationButton({ }: FloatingButtonContext) {
    const [ splitEditorOrientation, setSplitEditorOrientation ] = useTriliumOption("splitEditorOrientation");
    const upcomingOrientation = splitEditorOrientation === "horizontal" ? "vertical" : "horizontal";

    return <FloatingButton
        text={upcomingOrientation === "vertical" ? t("switch_layout_button.title_vertical") : t("switch_layout_button.title_horizontal")}
        icon={upcomingOrientation === "vertical" ? "bx bxs-dock-bottom" : "bx bxs-dock-left"}        
        onClick={() => setSplitEditorOrientation(upcomingOrientation)}
    />
}

function ToggleReadOnlyButton({ note }: FloatingButtonContext) {
    const [ isReadOnly, setReadOnly ] = useNoteLabelBoolean(note, "readOnly");

    return <FloatingButton
        text={isReadOnly ? t("toggle_read_only_button.unlock-editing") : t("toggle_read_only_button.lock-editing")}
        icon={isReadOnly ? "bx bx-lock-open-alt" : "bx bx-lock-alt"}
        onClick={() => setReadOnly(!isReadOnly)}
    />
}

function EditButton({ noteContext }: FloatingButtonContext) {
    const [ animationClass, setAnimationClass ] = useState("");

    // make the edit button stand out on the first display, otherwise
    // it's difficult to notice that the note is readonly
    useEffect(() => {
        setAnimationClass("bx-tada bx-lg");
        setTimeout(() => {
            setAnimationClass("");
        }, 1700);
    }, []);

    return <FloatingButton
        text={t("edit_button.edit_this_note")}
        icon="bx bx-pencil"
        className={animationClass}
        onClick={() => {
            if (noteContext.viewScope) {
                noteContext.viewScope.readOnlyTemporarilyDisabled = true;
                appContext.triggerEvent("readOnlyTemporarilyDisabled", { noteContext });
            }
        }}
    />
}

function ShowTocWidgetButton({ noteContext }: FloatingButtonContext) {
    return <FloatingButton
        text={t("show_toc_widget_button.show_toc")}
        icon="bx bx-tn-toc"
        onClick={() => {
            if (noteContext?.viewScope && noteContext.noteId) {
                noteContext.viewScope.tocTemporarilyHidden = false;
                appContext.triggerEvent("showTocWidget", { noteId: noteContext.noteId });
            }
        }}
    />
}

function ShowHighlightsListWidgetButton({ noteContext }: FloatingButtonContext) {
    return <FloatingButton
        text={t("show_highlights_list_widget_button.show_highlights_list")}
        icon="bx bx-bookmarks"
        onClick={() => {
            if (noteContext?.viewScope && noteContext.noteId) {
                noteContext.viewScope.highlightsListTemporarilyHidden = false;
                appContext.triggerEvent("showHighlightsListWidget", { noteId: noteContext.noteId });
            }
        }}
    />
}

function RunActiveNoteButton() {
    return <FloatingButton
        icon="bx bx-play"
        text={t("code_buttons.execute_button_title")}
        triggerCommand="runActiveNote"
    />
}

function OpenTriliumApiDocsButton({ note }: FloatingButtonContext) {
    return <FloatingButton
        icon="bx bx-help-circle"
        text={t("code_buttons.trilium_api_docs_button_title")}
        onClick={() => openInAppHelpFromUrl(note.mime.endsWith("frontend") ? "Q2z6av6JZVWm" : "MEtfsqa5VwNi")}
    />
}

function SaveToNoteButton({ note }: FloatingButtonContext) {
    return <FloatingButton
        icon="bx bx-save"
        text={t("code_buttons.save_to_note_button_title")}
        onClick={async (e) => {
            e.preventDefault();
            const { notePath } = await server.post<SaveSqlConsoleResponse>("special-notes/save-sql-console", { sqlConsoleNoteId: note.noteId });
            if (notePath) {
                toast.showMessage(t("code_buttons.sql_console_saved_message", { "note_path": await tree.getNotePathTitle(notePath) }));
                // TODO: This hangs the navigation, for some reason.
                //await ws.waitForMaxKnownEntityChangeId();
                await appContext.tabManager.getActiveContext()?.setNote(notePath);
            }
        }}
    />
}

function RelationMapButtons({ triggerEvent }: FloatingButtonContext) {
    return (
        <>
            <FloatingButton
                icon="bx bx-folder-plus"
                text={t("relation_map_buttons.create_child_note_title")}
                onClick={() => triggerEvent("relationMapCreateChildNote")}
            />

            <FloatingButton
                icon="bx bx-crop"
                text={t("relation_map_buttons.reset_pan_zoom_title")}
                onClick={() => triggerEvent("relationMapResetPanZoom")}
            />

            <div className="btn-group">
                <FloatingButton
                    icon="bx bx-zoom-in"
                    text={t("relation_map_buttons.zoom_in_title")}
                    onClick={() => triggerEvent("relationMapResetZoomIn")}
                />

                <FloatingButton
                    icon="bx bx-zoom-out"
                    text={t("relation_map_buttons.zoom_out_title")}
                    onClick={() => triggerEvent("relationMapResetZoomOut")}
                />
            </div>
        </>
    )
}

function GeoMapButtons({ triggerEvent }) {
    return (
        <FloatingButton
            icon="bx bx-plus-circle"
            text={t("geo-map.create-child-note-title")}
            onClick={() => triggerEvent("geoMapCreateChildNote")}
        />
    );
}

function CopyImageReferenceButton({ note }: FloatingButtonContext) {
    const hiddenImageCopyRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <FloatingButton
                icon="bx bx-copy"
                text={t("copy_image_reference_button.button_title")}
                onClick={() => {
                    if (!hiddenImageCopyRef.current) return;
                    const imageEl = document.createElement("img");
                    imageEl.src = createImageSrcUrl(note);
                    hiddenImageCopyRef.current.replaceChildren(imageEl);
                    copyImageReferenceToClipboard($(hiddenImageCopyRef.current));
                    hiddenImageCopyRef.current.removeChild(imageEl);
                }}
            />

            <div ref={hiddenImageCopyRef} className="hidden-image-copy" style={{
                position: "absolute" // Take out of the the hidden image from flexbox to prevent the layout being affected
            }} />
        </>
    )
}

function ExportImageButtons({ triggerEvent }: FloatingButtonContext) {
    return (
        <>
            <FloatingButton
                icon="bx bxs-file-image"
                text={t("svg_export_button.button_title")}
                onClick={() => triggerEvent("exportSvg")}
            />

            <FloatingButton
                icon="bx bxs-file-png"
                text={t("png_export_button.button_title")}
                onClick={() => triggerEvent("exportPng")}
            />
        </>
    )
}

function FloatingButton({ className, ...props }: ActionButtonProps) {
    return <ActionButton
        className={`floating-button ${className ?? ""}`}
        noIconActionClass
        {...props}
    />
}

/**
 * Show button that displays floating button after click on close button
 */
function ShowFloatingButton() {
    return (
        <div class="show-floating-buttons">
            <Button
                className="show-floating-buttons-button"
                icon="bx bx-chevrons-left"
                text={t("show_floating_buttons_button.button_title")}
            />
        </div>
    );
}
