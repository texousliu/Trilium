import "./StatusBar.css";

import FNote from "../../entities/fnote";
import { t } from "../../services/i18n";
import { openInAppHelpFromUrl } from "../../services/utils";
import { FormListItem } from "../react/FormList";
import { useNoteContext } from "../react/hooks";
import { NoteLanguageSelector } from "../ribbon/BasicPropertiesTab";
import Breadcrumb from "./Breadcrumb";

interface StatusBarContext {
    note: FNote;
}

export default function StatusBar() {
    const { note } = useNoteContext();
    const context = note && { note } satisfies StatusBarContext;

    return (
        <div className="status-bar">
            {context && <>
                <div className="breadcrumb-row">
                    <Breadcrumb />
                </div>

                <div className="actions-row">
                    <LanguageSwitcher {...context} />
                </div>
            </>}
        </div>
    );
}

function LanguageSwitcher({ note }: StatusBarContext) {
    return (
        <NoteLanguageSelector
            note={note}
            extraChildren={(
                <FormListItem
                    onClick={() => openInAppHelpFromUrl("veGu4faJErEM")}
                    icon="bx bx-help-circle"
                >{t("note_language.help-on-languages")}</FormListItem>
            )}
            compact
        />
    );
}
