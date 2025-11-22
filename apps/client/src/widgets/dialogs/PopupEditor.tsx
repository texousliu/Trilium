import { useState } from "preact/hooks";
import Modal from "../react/Modal";
import "./PopupEditor.css";
import { useTriliumEvent } from "../react/hooks";
import NoteTitleWidget from "../note_title";
import NoteIcon from "../note_icon";

export default function PopupEditor() {
    const [ shown, setShown ] = useState(false);

    useTriliumEvent("openInPopup", () => {
        setShown(true);
    });

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
