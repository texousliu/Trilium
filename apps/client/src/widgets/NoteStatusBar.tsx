import { t } from "../services/i18n";
import { openInAppHelpFromUrl } from "../services/utils";
import "./NoteStatusBar.css";
import { FormListItem } from "./react/FormList";

import { NoteLanguageSelector } from "./ribbon/BasicPropertiesTab";

export default function NoteStatusBar() {
    return (
        <div className="note-status-bar">
            <NoteLanguageSelector extraChildren={(
                <FormListItem
                    onClick={() => openInAppHelpFromUrl("veGu4faJErEM")}
                    icon="bx bx-help-circle"
                >{t("note_language.help-on-languages")}</FormListItem>
            )} />
        </div>
    );
}
