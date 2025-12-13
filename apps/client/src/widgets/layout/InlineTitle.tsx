import "./InlineTitle.css";

import { NoteType } from "@triliumnext/commons";
import clsx from "clsx";
import { ComponentChild } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Trans } from "react-i18next";

import { t } from "../../services/i18n";
import { ViewScope } from "../../services/link";
import { NOTE_TYPES } from "../../services/note_types";
import server from "../../services/server";
import { formatDateTime } from "../../utils/formatters";
import NoteIcon from "../note_icon";
import NoteTitleWidget from "../note_title";
import { Badge } from "../react/Badge";
import { useNoteBlob, useNoteContext, useNoteProperty, useStaticTooltip } from "../react/hooks";
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
    const containerRef=  useRef<HTMLDivElement>(null);

    useEffect(() => {
        setShown(shouldShow(note?.noteId, type, viewScope));
    }, [ note, type, viewScope ]);

    useEffect(() => {
        if (!shown) return;

        const titleRow = parentComponent.$widget[0]
            .closest(".note-split")
            ?.querySelector("&> .title-row");
        if (!titleRow) return;

        const observer = new IntersectionObserver((entries) => {
            titleRow.classList.toggle("collapse", entries[0].isIntersecting);
        });
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            titleRow.classList.remove("collapse");
            observer.disconnect();
        };
    }, [ shown, parentComponent ]);

    return (
        <div
            ref={containerRef}
            className={clsx("inline-title", !shown && "hidden")}
        >
            <div class="inline-title-row">
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
function NoteTypeSwitcher() {
    const { note } = useNoteContext();
    const blob = useNoteBlob(note);
    const currentNoteType = useNoteProperty(note, "type");
    const noteTypes = useMemo(() => NOTE_TYPES.filter((nt) => !nt.reserved && !nt.static), []);
    const currentNoteTypeData = useMemo(() => noteTypes.find(t => t.type === currentNoteType), [ noteTypes, currentNoteType ]);

    return (note?.type === "text" &&
        <div
            className="note-type-switcher"
            onWheel={onWheelHorizontalScroll}
        >
            <div className="intro">{t("note_title.note_type_switcher_label", { type: currentNoteTypeData?.title.toLocaleLowerCase() })}</div>
            {blob?.contentLength === 0 && noteTypes.map(noteType => noteType.type !== currentNoteType && (
                <Badge
                    key={noteType.type}
                    text={noteType.title}
                    icon={`bx ${noteType.icon}`}
                    onClick={() => server.put(`notes/${note.noteId}/type`, { type: noteType.type, mime: noteType.mime })}
                />
            ))}
        </div>
    );
}
//#endregion
