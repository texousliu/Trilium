import "./InlineTitle.css";

import { NoteType } from "@triliumnext/commons";
import clsx from "clsx";
import { ComponentChild } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Trans } from "react-i18next";

import FNote from "../../entities/fnote";
import { formatDateTime } from "../../utils/formatters";
import NoteIcon from "../note_icon";
import NoteTitleWidget from "../note_title";
import { useNoteContext, useStaticTooltip } from "../react/hooks";
import { joinElements } from "../react/react_utils";
import { useNoteMetadata } from "../ribbon/NoteInfoTab";

const supportedNoteTypes = new Set<NoteType>([
    "text", "code"
]);

export default function InlineTitle() {
    const { note, parentComponent } = useNoteContext();
    const [ shown, setShown ] = useState(shouldShow(note));
    const containerRef=  useRef<HTMLDivElement>(null);

    useEffect(() => {
        setShown(shouldShow(note));
    }, [ note ]);

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
        </div>
    );
}

function shouldShow(note: FNote | null | undefined) {
    if (!note) return false;
    return supportedNoteTypes.has(note.type);
}

export function NoteTitleDetails() {
    const { note, noteContext } = useNoteContext();
    const { metadata } = useNoteMetadata(note);
    const isHiddenNote = note?.noteId.startsWith("_");
    const isDefaultView = noteContext?.viewScope?.viewMode === "default";

    const items: ComponentChild[] = [
        (isDefaultView && !isHiddenNote && metadata?.dateCreated &&
            <TextWithValue
                i18nKey="note_title.created_on"
                value={formatDateTime(metadata.dateCreated, "medium", "none")}
                valueTooltip={formatDateTime(metadata.dateCreated, "full", "long")}
            />),
        (isDefaultView && !isHiddenNote && metadata?.dateModified &&
            <TextWithValue
                i18nKey="note_title.last_modified"
                value={formatDateTime(metadata.dateModified, "medium", "none")}
                valueTooltip={formatDateTime(metadata.dateModified, "full", "long")}
            />)
    ].filter(item => !!item);

    return items.length && (
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
