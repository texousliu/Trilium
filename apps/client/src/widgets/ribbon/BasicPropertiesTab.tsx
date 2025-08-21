import { useCallback, useMemo } from "preact/hooks";
import Dropdown from "../react/Dropdown";
import { NOTE_TYPES } from "../../services/note_types";
import { FormDivider, FormListBadge, FormListItem } from "../react/FormList";
import { t } from "../../services/i18n";
import { useNoteContext, useNoteProperty, useTriliumOption } from "../react/hooks";
import mime_types from "../../services/mime_types";
import { NoteType } from "@triliumnext/commons";
import server from "../../services/server";
import dialog from "../../services/dialog";

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
    const notSelectableNoteTypes = useMemo(() => NOTE_TYPES.filter((nt) => nt.reserved || nt.static).map((nt) => nt.type), []);
    
    const { note } = useNoteContext();
    const currentNoteType = useNoteProperty(note, "type") ?? undefined;
    const currentNoteMime = useNoteProperty(note, "mime");

    const changeNoteType = useCallback(async (type: NoteType, mime?: string) => {
        if (!note || (type === currentNoteType && mime === currentNoteMime)) {
            return;
        }

        // Confirm change if the note already has a content.
        if (type !== currentNoteType) {
            const blob = await note.getBlob();

            if (blob?.content && blob.content.trim().length &&
                !await (dialog.confirm(t("note_types.confirm-change")))) {
                return;
            }
        }

        await server.put(`notes/${note.noteId}/type`, { type, mime });
    }, [ note, currentNoteType, currentNoteMime ]);

    return (
        <div className="note-type-container">
            <span>{t("basic_properties.note_type")}:</span> &nbsp;
            <Dropdown
                dropdownContainerClassName="note-type-dropdown"
                text={<span className="note-type-desc">{findTypeTitle(currentNoteType, currentNoteMime)}</span>}
                disabled={notSelectableNoteTypes.includes(currentNoteType ?? "text")}
            >
                {noteTypes.map(({ isNew, isBeta, type, mime, title }) => {
                    const badges: FormListBadge[] = [];
                    if (isNew) {
                        badges.push({
                            className: "new-note-type-badge",
                            text: t("note_types.new-feature")
                        });
                    }
                    if (isBeta) {
                        badges.push({
                            text: t("note_types.beta-feature")
                        });
                    }

                    const checked = (type === currentNoteType);
                    if (type !== "code") {
                        return (
                            <FormListItem
                                checked={checked}
                                badges={badges}
                                onClick={() => changeNoteType(type, mime)}
                            >{title}</FormListItem>    
                        );
                    } else {
                        return (
                            <>
                                <FormDivider />
                                <FormListItem
                                    checked={checked}
                                    disabled                                    
                                >
                                    <strong>{title}</strong>
                                </FormListItem>
                            </>
                        )
                    }
                })}

                {mimeTypes.map(({ title, mime }) => (
                    <FormListItem onClick={() => changeNoteType("code", mime)}>
                        {title}
                    </FormListItem>
                ))}
            </Dropdown>
        </div>
    )   
}

function findTypeTitle(type?: NoteType, mime?: string | null) {
    if (type === "code") {
        const mimeTypes = mime_types.getMimeTypes();
        const found = mimeTypes.find((mt) => mt.mime === mime);

        return found ? found.title : mime;
    } else {
        const noteType = NOTE_TYPES.find((nt) => nt.type === type);

        return noteType ? noteType.title : type;
    }
}