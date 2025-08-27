import { t } from "i18next";
import "./FloatingButtons.css";
import Button from "./react/Button";
import ActionButton from "./react/ActionButton";
import FNote from "../entities/fnote";
import NoteContext from "../components/note_context";
import { useNoteContext } from "./react/hooks";
import { useContext, useEffect, useMemo } from "preact/hooks";
import { ParentComponent } from "./react/react_utils";
import Component from "../components/component";

interface FloatingButtonContext {
    parentComponent: Component;
    note: FNote;    
    noteContext: NoteContext;
}

interface FloatingButtonDefinition {
    title: string;
    icon: string;
    isEnabled: (context: FloatingButtonContext) => boolean;
    onClick: (context: FloatingButtonContext) => void;
}

const FLOATING_BUTTON_DEFINITIONS: FloatingButtonDefinition[] = [
    {
        title: t("backend_log.refresh"),
        icon: "bx bx-refresh",
        isEnabled: ({ note, noteContext }) => note.noteId === "_backendLog" && noteContext.viewScope?.viewMode === "default",
        onClick: ({ parentComponent, noteContext }) => parentComponent.triggerEvent("refreshData", { ntxId: noteContext.ntxId })
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

    const definitions = useMemo<FloatingButtonDefinition[]>(() => {    
        if (!context) return [];
        return FLOATING_BUTTON_DEFINITIONS.filter(def => def.isEnabled(context));
    }, [ context ]);
    
    return (
        <div className="floating-buttons no-print">
            <div className="floating-buttons-children">
                {context && definitions.map(({ title, icon, onClick }) => (
                    <ActionButton
                        text={title}
                        icon={icon}
                        onClick={() => onClick(context)}
                    />
                ))}
            </div>

            <ShowFloatingButton />
        </div>
    )
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