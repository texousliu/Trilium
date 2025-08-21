import { useCallback, useMemo } from "preact/hooks";
import Dropdown from "../react/Dropdown";
import { NOTE_TYPES } from "../../services/note_types";
import { FormListBadge, FormListItem } from "../react/FormList";
import { t } from "../../services/i18n";

export default function BasicPropertiesTab() {
    return (
        <div className="basic-properties-widget">
            <NoteTypeWidget />
        </div>
    );
}

function NoteTypeWidget() {
    const noteTypes = useMemo(() => NOTE_TYPES.filter((nt) => !nt.reserved && !nt.static), []);

    return (
        <Dropdown>
            {noteTypes.map(noteType => {
                const badges: FormListBadge[] = [];
                if (noteType.isNew) {
                    badges.push({
                        className: "new-note-type-badge",
                        text: t("note_types.new-feature")
                    });
                }
                if (noteType.isBeta) {
                    badges.push({
                        text: t("note_types.beta-feature")
                    });
                }

                return (
                    <FormListItem
                        badges={badges}
                    >{noteType.title}</FormListItem>    
                );
            })}
        </Dropdown>
    )   
}