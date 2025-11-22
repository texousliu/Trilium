import { useContext, useEffect, useState } from "preact/hooks";
import Modal from "../react/Modal";
import "./PopupEditor.css";
import { useTriliumEvent } from "../react/hooks";
import NoteTitleWidget from "../note_title";
import NoteIcon from "../note_icon";
import NoteContext from "../../components/note_context";
import { ParentComponent } from "../react/react_utils";

const noteContext = new NoteContext("_popup-editor");

export default function PopupEditor() {
    const [ shown, setShown ] = useState(false);
    const parentComponent = useContext(ParentComponent);

    useTriliumEvent("openInPopup", async ({ noteIdOrPath }) => {
        await noteContext.setNote(noteIdOrPath, {
            viewScope: {
                readOnlyTemporarilyDisabled: true
            }
        });

        setShown(true);
    });

    // Inject the note context
    useEffect(() => {
        if (!shown || !parentComponent) return;
        parentComponent.handleEventInChildren("activeContextChanged", { noteContext });
    }, [ shown ]);

    return (
        <Modal
            title={(
                <div className="title-row">
                    <NoteIcon />
                    <NoteTitleWidget />
                </div>
            )}
            className="popup-editor-dialog"
            size="lg"
            show={shown}
            onHidden={() => setShown(false)}
        >
            Body goes here
        </Modal>
    )
}
