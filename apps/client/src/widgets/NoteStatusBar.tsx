import "./NoteStatusBar.css";

import { NoteLanguageSelector } from "./ribbon/BasicPropertiesTab";

export default function NoteStatusBar() {
    return (
        <div className="note-status-bar">
            <NoteLanguageSelector />
        </div>
    );
}
