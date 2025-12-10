import "./NoteStatusBar.css";

import { t } from "../services/i18n";
import { openInAppHelpFromUrl } from "../services/utils";
import { FormListItem } from "./react/FormList";
import { useNoteContext } from "./react/hooks";
import { NoteLanguageSelector } from "./ribbon/BasicPropertiesTab";

export default function NoteStatusBar() {
    const { note } = useNoteContext();

    return (
        <div className="note-status-bar">
            <NoteLanguageSelector
                note={note}
                extraChildren={(
                    <FormListItem
                        onClick={() => openInAppHelpFromUrl("veGu4faJErEM")}
                        icon="bx bx-help-circle"
                    >{t("note_language.help-on-languages")}</FormListItem>
                )}
            />
        </div>
    );
}
