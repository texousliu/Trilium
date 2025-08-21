import { useCallback, useMemo } from "preact/hooks";
import Dropdown from "../react/Dropdown";
import { NOTE_TYPES } from "../../services/note_types";
import { FormDivider, FormListBadge, FormListItem } from "../react/FormList";
import { t } from "../../services/i18n";
import { useTriliumOption } from "../react/hooks";
import mime_types from "../../services/mime_types";

export default function BasicPropertiesTab() {
    return (
        <div className="basic-properties-widget">
            <NoteTypeWidget />
        </div>
    );
}

function NoteTypeWidget() {
    const noteTypes = useMemo(() => NOTE_TYPES.filter((nt) => !nt.reserved && !nt.static), []);
    const [ codeNotesMimeTypes ] = useTriliumOption("codeNotesMimeTypes");
    const mimeTypes = useMemo(() => mime_types.getMimeTypes().filter(mimeType => mimeType.enabled), [ codeNotesMimeTypes ]);

    return (
        <Dropdown dropdownContainerClassName="note-type-dropdown">
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

                if (noteType.type !== "code") {
                    return (
                        <FormListItem
                            badges={badges}
                        >{noteType.title}</FormListItem>    
                    );
                } else {
                    return (
                        <>
                            <FormDivider />
                            <FormListItem disabled>
                                <strong>{noteType.title}</strong>
                            </FormListItem>
                        </>
                    )
                }
            })}

            {mimeTypes.map(mimeType => (
                <FormListItem>{mimeType.title}</FormListItem>
            ))}
        </Dropdown>
    )   
}