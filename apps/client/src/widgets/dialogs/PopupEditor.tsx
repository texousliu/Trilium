import { useContext, useEffect, useState } from "preact/hooks";
import Modal from "../react/Modal";
import "./PopupEditor.css";
import { useTriliumEvent } from "../react/hooks";
import NoteTitleWidget from "../note_title";
import NoteIcon from "../note_icon";
import NoteContext from "../../components/note_context";
import { NoteContextContext, ParentComponent } from "../react/react_utils";
import NoteDetail from "../NoteDetail";

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

    return (
        <NoteContextContext.Provider value={noteContext}>
            <Modal
                title={<TitleRow />}
                className="popup-editor-dialog"
                size="lg"
                show={shown}
                onShown={() => {
                    parentComponent?.handleEvent("focusOnDetail", { ntxId: noteContext.ntxId });
                }}
                onHidden={() => setShown(false)}
            >
                <NoteDetail />
            </Modal>
        </NoteContextContext.Provider>
    )
}

export function TitleRow() {
    return (
        <div className="title-row">
            <NoteIcon />
            <NoteTitleWidget />
        </div>
    )
}
