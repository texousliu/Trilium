import { t } from "i18next";
import "./FloatingButtons.css";
import { useNoteContext, useNoteProperty, useTriliumEvent, useTriliumEvents } from "./react/hooks";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import { ParentComponent } from "./react/react_utils";
import attributes from "../services/attributes";
import { EventData, EventNames } from "../components/app_context";
import { FLOATING_BUTTON_DEFINITIONS, FloatingButtonContext, FloatingButtonDefinition } from "./FloatingButtonsDefinitions";
import ActionButton from "./react/ActionButton";

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

    // Manage the user-adjustable visibility of the floating buttons.
    const [ visible, setVisible ] = useState(true);
    useEffect(() => setVisible(true), [ note ]);

    return (
        <div className="floating-buttons no-print">
            <div className={`floating-buttons-children ${!visible ? "temporarily-hidden" : ""}`}>
                {context && definitions.map(({ component: Component }) => (
                    <Component {...context} />
                ))}

                {definitions.length && <CloseFloatingButton setVisible={setVisible} />}
            </div>

            {!visible && definitions.length && <ShowFloatingButton setVisible={setVisible} /> }
        </div>
    )
}

/**
 * Show button that displays floating button after click on close button
 */
function ShowFloatingButton({ setVisible }: { setVisible(visible: boolean): void }) {
    return (
        <div className="show-floating-buttons">
            <ActionButton
                className="show-floating-buttons-button"
                icon="bx bx-chevrons-left"
                text={t("show_floating_buttons_button.button_title")}
                onClick={() => setVisible(true)}
                noIconActionClass
            />
        </div>
    );
}

function CloseFloatingButton({ setVisible }: { setVisible(visible: boolean): void }) {
    return (
        <div className="close-floating-buttons">
            <ActionButton
                className="close-floating-buttons-button"
                icon="bx bx-chevrons-right"
                text={t("hide_floating_buttons_button.button_title")}
                onClick={() => setVisible(false)}                
                noIconActionClass
            />
        </div>
    );
}