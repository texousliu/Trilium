import { t } from "../../services/i18n";
import { useActiveNoteContext, useIsNoteReadOnly, useNoteProperty } from "../react/hooks";
import RightPanelWidget from "./RightPanelWidget";

export default function HighlightsList() {
    const { note, noteContext } = useActiveNoteContext();
    const noteType = useNoteProperty(note, "type");
    const { isReadOnly } = useIsNoteReadOnly(note, noteContext);

    return (
        <RightPanelWidget title={t("highlights_list_2.title")}>
            {((noteType === "text" && isReadOnly) || (noteType === "doc")) && <ReadOnlyTextHighlightsList />}
            {noteType === "text" && !isReadOnly && <EditableTextHighlightsList />}
        </RightPanelWidget>
    );
}

//#region Editable text (CKEditor)
function EditableTextHighlightsList() {
    return "Editable";
}
//#endregion

//#region Read-only text
function ReadOnlyTextHighlightsList() {
    return "Read-only";
}
//#endregion
