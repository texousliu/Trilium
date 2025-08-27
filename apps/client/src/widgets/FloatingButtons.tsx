import { t } from "i18next";
import "./FloatingButtons.css";
import Button from "./react/Button";
import ActionButton from "./react/ActionButton";
import FNote from "../entities/fnote";
import NoteContext from "../components/note_context";
import { useNoteContext, useNoteLabel, useNoteLabelBoolean, useTriliumEvent, useTriliumOption, useTriliumOptionBool } from "./react/hooks";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import { ParentComponent } from "./react/react_utils";
import Component from "../components/component";
import { VNode } from "preact";
import attributes from "../services/attributes";

interface FloatingButtonContext {
    parentComponent: Component;
    note: FNote;    
    noteContext: NoteContext;
}

interface FloatingButtonDefinition {
    component: (context: FloatingButtonContext) => VNode;    
    isEnabled: (context: FloatingButtonContext) => boolean;
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
    }
];

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
            parentComponent
        };
    }, [ note, noteContext, parentComponent ]);

    // Refresh on any note attribute change.
    const [ refreshCounter, setRefreshCounter ] = useState(0);
    useTriliumEvent("entitiesReloaded", ({ loadResults }) => {        
        if (loadResults.getAttributeRows().find(attrRow => attributes.isAffecting(attrRow, note))) {
            setRefreshCounter(refreshCounter+1);
        }
    });

    const definitions = useMemo<FloatingButtonDefinition[]>(() => {    
        if (!context) return [];
        return FLOATING_BUTTON_DEFINITIONS.filter(def => def.isEnabled(context));
    }, [ context, refreshCounter ]);
    
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
    return <ActionButton
        text={t("backend_log.refresh")}
        icon="bx bx-refresh"
        onClick={() => parentComponent.triggerEvent("refreshData", { ntxId: noteContext.ntxId })}
    />
}

function SwitchSplitOrientationButton({ }: FloatingButtonContext) {
    const [ splitEditorOrientation, setSplitEditorOrientation ] = useTriliumOption("splitEditorOrientation");
    const upcomingOrientation = splitEditorOrientation === "horizontal" ? "vertical" : "horizontal";

    return <ActionButton
        text={upcomingOrientation === "vertical" ? t("switch_layout_button.title_vertical") : t("switch_layout_button.title_horizontal")}
        icon={upcomingOrientation === "vertical" ? "bx bxs-dock-bottom" : "bx bxs-dock-left"}        
        onClick={() => setSplitEditorOrientation(upcomingOrientation)}
    />
}

function ToggleReadOnlyButton({ note }: FloatingButtonContext) {
    const [ isReadOnly, setReadOnly ] = useNoteLabelBoolean(note, "readOnly");

    return <ActionButton
        text={isReadOnly ? t("toggle_read_only_button.unlock-editing") : t("toggle_read_only_button.lock-editing")}
        icon={isReadOnly ? "bx bx-lock-open-alt" : "bx bx-lock-alt"}
        onClick={() => setReadOnly(!isReadOnly)}
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