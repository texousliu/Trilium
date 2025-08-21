import { useCallback, useMemo } from "preact/hooks";
import Dropdown from "../react/Dropdown";
import { NOTE_TYPES } from "../../services/note_types";
import { FormDivider, FormListBadge, FormListItem } from "../react/FormList";
import { t } from "../../services/i18n";
import { useNoteContext, useNoteLabel, useNoteLabelBoolean, useNoteProperty, useTriliumOption } from "../react/hooks";
import mime_types from "../../services/mime_types";
import { NoteType } from "@triliumnext/commons";
import server from "../../services/server";
import dialog from "../../services/dialog";
import FormToggle from "../react/FormToggle";
import FNote from "../../entities/fnote";
import protected_session from "../../services/protected_session";
import FormDropdownList from "../react/FormDropdownList";

export default function BasicPropertiesTab() {
    const { note } = useNoteContext();
    
    return (
        <div className="basic-properties-widget">        
            <NoteTypeWidget note={note} />
            <ProtectedNoteSwitch note={note} />
            <EditabilitySelect note={note} />
        </div>
    );
}

function NoteTypeWidget({ note }: { note?: FNote | null }) {
    const noteTypes = useMemo(() => NOTE_TYPES.filter((nt) => !nt.reserved && !nt.static), []);
    const [ codeNotesMimeTypes ] = useTriliumOption("codeNotesMimeTypes");
    const mimeTypes = useMemo(() => mime_types.getMimeTypes().filter(mimeType => mimeType.enabled), [ codeNotesMimeTypes ]);
    const notSelectableNoteTypes = useMemo(() => NOTE_TYPES.filter((nt) => nt.reserved || nt.static).map((nt) => nt.type), []);
    
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

function ProtectedNoteSwitch({ note }: { note?: FNote | null }) {
    const isProtected = useNoteProperty(note, "isProtected");

    return (
        <div className="protected-note-switch-container">
            <FormToggle
                currentValue={isProtected}
                onChange={(shouldProtect) => note && protected_session.protectNote(note.noteId, shouldProtect, false)}
                switchOnName={t("protect_note.toggle-on")} switchOnTooltip={t("protect_note.toggle-on-hint")}
                switchOffName={t("protect_note.toggle-off")} switchOffTooltip={t("protect_note.toggle-off-hint")}
            />
        </div>
    )
}

function EditabilitySelect({ note }: { note?: FNote | null }) {
    const [ readOnly, setReadOnly ] = useNoteLabelBoolean(note, "readOnly");
    const [ autoReadOnlyDisabled, setAutoReadOnlyDisabled ] = useNoteLabelBoolean(note, "autoReadOnlyDisabled");    

    const options = useMemo(() => ([
        {
            value: "auto",
            label: t("editability_select.auto"),
            description: t("editability_select.note_is_editable"),
        },
        {
            value: "readOnly",
            label: t("editability_select.read_only"),
            description: t("editability_select.note_is_read_only")
        },
        {
            value: "autoReadOnlyDisabled",
            label: t("editability_select.always_editable"),
            description: t("editability_select.note_is_always_editable")
        }
    ]), []);

    return (
        <div class="editability-select-container">
            <span>{t("basic_properties.editable")}:</span> &nbsp;

            <FormDropdownList
                values={options}
                currentValue={ readOnly ? "readOnly" : autoReadOnlyDisabled ? "autoReadOnlyDisabled" : "auto" }
                keyProperty="value" titleProperty="label" descriptionProperty="description"
                onChange={(editability: string) => {
                    setReadOnly(editability === "readOnly");
                    setAutoReadOnlyDisabled(editability === "autoReadOnlyDisabled");
                }}
            />
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