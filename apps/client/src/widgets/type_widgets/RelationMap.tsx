import { useEffect, useRef, useState } from "preact/hooks";
import { TypeWidgetProps } from "./type_widget";
import { Defaults, jsPlumb, OverlaySpec } from "jsplumb";
import { useNoteBlob } from "../react/hooks";
import FNote from "../../entities/fnote";
import { ComponentChildren } from "preact";
import froca from "../../services/froca";
import NoteLink from "../react/NoteLink";
import "./RelationMap.css";
import { t } from "../../services/i18n";

interface MapData {
    notes: {
        noteId: string;
        x: number;
        y: number;
    }[];
    transform: {
        x: number,
        y: number,
        scale: number
    }
}

const uniDirectionalOverlays: OverlaySpec[] = [
    [
        "Arrow",
        {
            location: 1,
            id: "arrow",
            length: 14,
            foldback: 0.8
        }
    ],
    ["Label", { label: "", id: "label", cssClass: "connection-label" }]
];

export default function RelationMap({ note }: TypeWidgetProps) {
    const data = useData(note);

    return (
        <div className="note-detail-relation-map note-detail-printable">
            <div className="relation-map-wrapper">
                <JsPlumb
                    className="relation-map-container"
                    props={{
                        Endpoint: ["Dot", { radius: 2 }],
                        Connector: "StateMachine",
                        ConnectionOverlays: uniDirectionalOverlays,
                        HoverPaintStyle: { stroke: "#777", strokeWidth: 1 },
                    }}
                >
                    {data.notes.map(note => (
                        <NoteBox {...note} />
                    ))}
                </JsPlumb>
            </div>
        </div>
    )
}

function useData(note: FNote) {
    const blob = useNoteBlob(note);
    let content: MapData | null = null;

    if (blob?.content) {
        try {
            content = JSON.parse(blob.content);
        } catch (e) {
            console.log("Could not parse content: ", e);
        }
    }

    if (!content) {
        content = {
            notes: [],
            // it is important to have this exact value here so that initial transform is the same as this
            // which will guarantee note won't be saved on first conversion to the relation map note type
            // this keeps the principle that note type change doesn't destroy note content unless user
            // does some actual change
            transform: {
                x: 0,
                y: 0,
                scale: 1
            }
        };
    }

    return content;
}

function JsPlumb({ className, props, children }: {
    className?: string;
    props: Omit<Defaults, "container">;
    children: ComponentChildren;
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const jsPlumbInstance = jsPlumb.getInstance({
            Container: containerRef.current,
            ...props
        });

        return () => jsPlumbInstance.cleanupListeners();
    }, []);

    return (
        <div ref={containerRef} className={className}>
            {children}
        </div>
    )
}

function NoteBox({ noteId, x, y }: MapData["notes"][number]) {
    const [ note, setNote ] = useState<FNote | null>();
    useEffect(() => {
        froca.getNote(noteId).then(setNote);
    }, [ noteId ]);

    return note && (
        <div
            id={noteIdToId(noteId)}
            className={`note-box ${note?.getCssClass()}`}
            style={{
                left: x,
                top: y
            }}
        >
            <NoteLink className="title" notePath={noteId} noTnLink />
            <div className="endpoint" title={t("relation_map.start_dragging_relations")} />
        </div>
    )
}

function noteIdToId(noteId: string) {
    return `rel-map-note-${noteId}`;
}

function idToNoteId(id: string) {
    return id.substr(13);
}
