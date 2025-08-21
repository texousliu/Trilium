import { useMemo } from "preact/hooks";
import Dropdown from "../react/Dropdown";
import { NOTE_TYPES } from "../../services/note_types";
import { FormDivider, FormListBadge, FormListItem } from "../react/FormList";
import { t } from "../../services/i18n";
import { useNoteContext, useNoteProperty, useTriliumOption } from "../react/hooks";
import mime_types from "../../services/mime_types";
import { NoteType } from "@triliumnext/commons";

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
    
    const { note } = useNoteContext();
    const type = useNoteProperty(note, "type") ?? undefined;
    const mime = useNoteProperty(note, "mime");

    return (
        <>
            <span>{t("basic_properties.note_type")}:</span> &nbsp;
            <Dropdown
                dropdownContainerClassName="note-type-dropdown"
                text={<span className="note-type-desc">{findTypeTitle(type, mime)}</span>}
            >
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
        </>
    )   
}

function findTypeTitle(type?: NoteType, mime?: string) {
    if (type === "code") {
        const mimeTypes = mime_types.getMimeTypes();
        const found = mimeTypes.find((mt) => mt.mime === mime);

        return found ? found.title : mime;
    } else {
        const noteType = NOTE_TYPES.find((nt) => nt.type === type);

        return noteType ? noteType.title : type;
    }
}