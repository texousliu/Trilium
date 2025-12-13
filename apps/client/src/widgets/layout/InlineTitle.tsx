import "./InlineTitle.css";

import { NoteType } from "@triliumnext/commons";
import clsx from "clsx";
import { ComponentChild } from "preact";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import { Trans } from "react-i18next";

import FNote from "../../entities/fnote";
import attributes from "../../services/attributes";
import froca from "../../services/froca";
import { t } from "../../services/i18n";
import { ViewScope } from "../../services/link";
import { NOTE_TYPES, NoteTypeMapping } from "../../services/note_types";
import server from "../../services/server";
import { formatDateTime } from "../../utils/formatters";
import NoteIcon from "../note_icon";
import NoteTitleWidget from "../note_title";
import { Badge, BadgeWithDropdown } from "../react/Badge";
import { FormDropdownDivider, FormListItem } from "../react/FormList";
import { useNoteBlob, useNoteContext, useNoteProperty, useStaticTooltip, useTriliumEvent } from "../react/hooks";
import { joinElements } from "../react/react_utils";
import { useNoteMetadata } from "../ribbon/NoteInfoTab";
import { onWheelHorizontalScroll } from "../widget_utils";

const supportedNoteTypes = new Set<NoteType>([
    "text", "code"
]);

export default function InlineTitle() {
    const { note, parentComponent, viewScope } = useNoteContext();
    const type = useNoteProperty(note, "type");
    const [ shown, setShown ] = useState(shouldShow(note?.noteId, type, viewScope));
    const containerRef = useRef<HTMLDivElement>(null);
    const [ titleHidden, setTitleHidden ] = useState(false);

    useLayoutEffect(() => {
        setShown(shouldShow(note?.noteId, type, viewScope));
    }, [ note, type, viewScope ]);

    useLayoutEffect(() => {
        if (!shown) return;

        const titleRow = parentComponent.$widget[0].closest(".note-split")?.querySelector(":scope > .title-row");
        if (!titleRow) return;

        titleRow.classList.toggle("hide-title", true);
        const observer = new IntersectionObserver((entries) => {
            titleRow.classList.toggle("hide-title", entries[0].isIntersecting);
            setTitleHidden(!entries[0].isIntersecting);
        }, {
            threshold: 0.85
        });
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            titleRow.classList.remove("hide-title");
            observer.disconnect();
        };
    }, [ shown, parentComponent ]);

    return (
        <div
            ref={containerRef}
            className={clsx("inline-title", !shown && "hidden")}
        >
            <div class={clsx("inline-title-row", titleHidden && "hidden")}>
                <NoteIcon />
                <NoteTitleWidget />
            </div>

            <NoteTitleDetails />
            <NoteTypeSwitcher />
        </div>
    );
}

function shouldShow(noteId: string | undefined, type: NoteType | undefined, viewScope: ViewScope | undefined) {
    if (viewScope?.viewMode !== "default") return false;
    if (noteId?.startsWith("_options")) return true;
    return type && supportedNoteTypes.has(type);
}

//#region Title details
export function NoteTitleDetails() {
    const { note } = useNoteContext();
    const { metadata } = useNoteMetadata(note);
    const isHiddenNote = note?.noteId.startsWith("_");

    const items: ComponentChild[] = [
        (!isHiddenNote && metadata?.dateCreated &&
            <TextWithValue
                i18nKey="note_title.created_on"
                value={formatDateTime(metadata.dateCreated, "medium", "none")}
                valueTooltip={formatDateTime(metadata.dateCreated, "full", "long")}
            />),
        (!isHiddenNote && metadata?.dateModified &&
            <TextWithValue
                i18nKey="note_title.last_modified"
                value={formatDateTime(metadata.dateModified, "medium", "none")}
                valueTooltip={formatDateTime(metadata.dateModified, "full", "long")}
            />)
    ].filter(item => !!item);

    return items.length > 0 && (
        <div className="title-details">
            {joinElements(items, " • ")}
        </div>
    );
}

function TextWithValue({ i18nKey, value, valueTooltip }: {
    i18nKey: string;
    value: string;
    valueTooltip: string;
}) {
    const listItemRef = useRef<HTMLLIElement>(null);
    useStaticTooltip(listItemRef, {
        selector: "span.value",
        title: valueTooltip,
        popperConfig: { placement: "bottom" }
    });

    return (
        <li ref={listItemRef}>
            <Trans
                i18nKey={i18nKey}
                components={{
                    Value: <span className="value">{value}</span> as React.ReactElement
                }}
            />
        </li>
    );
}
//#endregion

//#region Note type switcher
const SWITCHER_PINNED_NOTE_TYPES = new Set<NoteType>([ "text", "code", "book", "canvas" ]);

function NoteTypeSwitcher() {
    const { note } = useNoteContext();
    const blob = useNoteBlob(note);
    const currentNoteType = useNoteProperty(note, "type");
    const { pinnedNoteTypes, restNoteTypes } = useMemo(() => {
        const pinnedNoteTypes: NoteTypeMapping[] = [];
        const restNoteTypes: NoteTypeMapping[] = [];
        for (const noteType of NOTE_TYPES) {
            if (noteType.reserved || noteType.static || noteType.type === "book") continue;
            if (SWITCHER_PINNED_NOTE_TYPES.has(noteType.type)) {
                pinnedNoteTypes.push(noteType);
            } else {
                restNoteTypes.push(noteType);
            }
        }
        return { pinnedNoteTypes, restNoteTypes };
    }, []);
    const currentNoteTypeData = useMemo(() => NOTE_TYPES.find(t => t.type === currentNoteType), [ currentNoteType ]);
    const { builtinTemplates, collectionTemplates } = useBuiltinTemplates();

    return (currentNoteType && supportedNoteTypes.has(currentNoteType) &&
        <div
            className="note-type-switcher"
            onWheel={onWheelHorizontalScroll}
        >
            {blob?.contentLength === 0 && (
                <>
                    <div className="intro">{t("note_title.note_type_switcher_label", { type: currentNoteTypeData?.title.toLocaleLowerCase() })}</div>
                    {pinnedNoteTypes.map(noteType => noteType.type !== currentNoteType && (
                        <Badge
                            key={noteType.type}
                            text={noteType.title}
                            icon={`bx ${noteType.icon}`}
                            onClick={() => switchNoteType(note.noteId, noteType)}
                        />
                    ))}
                    {collectionTemplates.length > 0 && <CollectionNoteTypes noteId={note.noteId} collectionTemplates={collectionTemplates} />}
                    {builtinTemplates.length > 0 && <TemplateNoteTypes noteId={note.noteId} builtinTemplates={builtinTemplates} />}
                    {restNoteTypes.length > 0 && <MoreNoteTypes noteId={note.noteId} restNoteTypes={restNoteTypes} />}
                </>
            )}
        </div>
    );
}

function MoreNoteTypes({ noteId, restNoteTypes }: { noteId: string, restNoteTypes: NoteTypeMapping[] }) {
    return (
        <BadgeWithDropdown
            text={t("note_title.note_type_switcher_others")}
            icon="bx bx-dots-vertical-rounded"
        >
            {restNoteTypes.map(noteType => (
                <FormListItem
                    key={noteType.type}
                    icon={`bx ${noteType.icon}`}
                    onClick={() => switchNoteType(noteId, noteType)}
                >{noteType.title}</FormListItem>
            ))}
        </BadgeWithDropdown>
    );
}

function CollectionNoteTypes({ noteId, collectionTemplates }: { noteId: string, collectionTemplates: FNote[] }) {
    return (
        <BadgeWithDropdown
            text={t("note_title.note_type_switcher_collection")}
            icon="bx bx-book"
        >
            {collectionTemplates.map(collectionTemplate => (
                <FormListItem
                    key={collectionTemplate.noteId}
                    icon={collectionTemplate.getIcon()}
                    onClick={() => setTemplate(noteId, collectionTemplate.noteId)}
                >{collectionTemplate.title}</FormListItem>
            ))}
        </BadgeWithDropdown>
    );
}

function TemplateNoteTypes({ noteId, builtinTemplates }: { noteId: string, builtinTemplates: FNote[] }) {
    const [ userTemplates, setUserTemplates ] = useState<FNote[]>([]);

    async function refreshTemplates() {
        const templateNoteIds = await server.get<string[]>("search-templates");
        const templateNotes = await froca.getNotes(templateNoteIds);
        setUserTemplates(templateNotes);
    }

    // First load.
    useEffect(() => {
        refreshTemplates();
    }, []);

    // React to external changes.
    useTriliumEvent("entitiesReloaded", ({ loadResults }) => {
        if (loadResults.getAttributeRows().some(attr => attr.type === "label" && attr.name === "template")) {
            refreshTemplates();
        }
    });

    return (
        <BadgeWithDropdown
            text={t("note_title.note_type_switcher_templates")}
            icon="bx bx-copy-alt"
        >
            {userTemplates.map(template => <TemplateItem key={template.noteId} noteId={noteId} template={template} />)}
            {userTemplates.length > 0 && <FormDropdownDivider />}
            {builtinTemplates.map(template => <TemplateItem key={template.noteId} noteId={noteId} template={template} />)}
        </BadgeWithDropdown>
    );
}

function TemplateItem({ noteId, template }: { noteId: string, template: FNote }) {
    return (
        <FormListItem
            icon={template.getIcon()}
            onClick={() => setTemplate(noteId, template.noteId)}
        >{template.title}</FormListItem>
    );
}

function switchNoteType(noteId: string, { type, mime }: NoteTypeMapping) {
    return server.put(`notes/${noteId}/type`, { type, mime });
}

function setTemplate(noteId: string, templateId: string) {
    return attributes.setRelation(noteId, "template", templateId);
}

function useBuiltinTemplates() {
    const [ templates, setTemplates ] = useState<{
        builtinTemplates: FNote[];
        collectionTemplates: FNote[];
    }>({
        builtinTemplates: [],
        collectionTemplates: []
    });

    async function loadBuiltinTemplates() {
        const templatesRoot = await froca.getNote("_templates");
        if (!templatesRoot) return;
        const childNotes = await templatesRoot.getChildNotes();
        const builtinTemplates: FNote[] = [];
        const collectionTemplates: FNote[] = [];
        for (const childNote of childNotes) {
            if (!childNote.hasLabel("template")) continue;
            if (childNote.hasLabel("collection")) {
                collectionTemplates.push(childNote);
            } else {
                builtinTemplates.push(childNote);
            }
        }
        setTemplates({ builtinTemplates, collectionTemplates });
    }

    useEffect(() => {
        loadBuiltinTemplates();
    }, []);

    return templates;
}
//#endregion
