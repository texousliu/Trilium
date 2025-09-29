import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { TypeWidgetProps } from "./type_widget";
import { Defaults, jsPlumb, jsPlumbInstance, OverlaySpec } from "jsplumb";
import { useEditorSpacedUpdate, useNoteBlob } from "../react/hooks";
import FNote from "../../entities/fnote";
import { ComponentChildren, RefObject } from "preact";
import froca from "../../services/froca";
import NoteLink from "../react/NoteLink";
import "./RelationMap.css";
import { t } from "../../services/i18n";
import panzoom, { PanZoomOptions } from "panzoom";

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
    const [ data, setData ] = useState<MapData>();
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<jsPlumbInstance>(null);
    const spacedUpdate = useEditorSpacedUpdate({
        note,
        getData() {
        },
        onContentChange(content) {
            if (content) {
                try {
                    setData(JSON.parse(content));
                    return;
                } catch (e) {
                    console.log("Could not parse content: ", e);
                }
            }

            setData({
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
            });
        },
        dataSaved() {

        }
    })

    const onTransform = useCallback(() => {
        if (!containerRef.current || !apiRef.current) return;
        const zoom = getZoom(containerRef.current);
        apiRef.current.setZoom(zoom);
    }, [ ]);

    usePanZoom({
        containerRef,
        options: {
            maxZoom: 2,
            minZoom: 0.3,
            smoothScroll: false,
            //@ts-expect-error Upstream incorrectly mentions no arguments.
            filterKey: function (e: KeyboardEvent) {
                // if ALT is pressed, then panzoom should bubble the event up
                // this is to preserve ALT-LEFT, ALT-RIGHT navigation working
                return e.altKey;
            }
        },
        transformData: data?.transform,
        onTransform
    });

    return (
        <div className="note-detail-relation-map note-detail-printable">
            <div className="relation-map-wrapper">
                <JsPlumb
                    apiRef={apiRef}
                    containerRef={containerRef}
                    className="relation-map-container"
                    props={{
                        Endpoint: ["Dot", { radius: 2 }],
                        Connector: "StateMachine",
                        ConnectionOverlays: uniDirectionalOverlays,
                        HoverPaintStyle: { stroke: "#777", strokeWidth: 1 },
                    }}
                >
                    {data?.notes.map(note => (
                        <NoteBox {...note} />
                    ))}
                </JsPlumb>
            </div>
        </div>
    )
}

function usePanZoom({ containerRef, options, transformData, onTransform }: {
    containerRef: RefObject<HTMLElement>;
    options: PanZoomOptions;
    transformData: MapData["transform"] | undefined;
    onTransform: () => void
}) {
    const apiRef = useRef<PanZoom>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const pzInstance = panzoom(containerRef.current, options);
        apiRef.current = pzInstance;

        if (transformData) {
            pzInstance.zoomTo(0, 0, transformData.scale);
            pzInstance.moveTo(transformData.x, transformData.y);
        } else {
            // set to initial coordinates
            pzInstance.moveTo(0, 0);
        }

        if (onTransform) {
            apiRef.current!.on("transform", onTransform);
        }

        return () => pzInstance.dispose();
    }, [ containerRef, onTransform ]);
}

function JsPlumb({ className, props, children, containerRef: externalContainerRef, apiRef }: {
    className?: string;
    props: Omit<Defaults, "container">;
    children: ComponentChildren;
    containerRef?: RefObject<HTMLElement>;
    apiRef?: RefObject<jsPlumbInstance>;
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        if (externalContainerRef) {
            externalContainerRef.current = containerRef.current;
        }

        const jsPlumbInstance = jsPlumb.getInstance({
            Container: containerRef.current,
            ...props
        });
        if (apiRef) {
            apiRef.current = jsPlumbInstance;
        }

        return () => jsPlumbInstance.cleanupListeners();
    }, [ apiRef ]);

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

function getZoom(container: HTMLDivElement) {
    const transform = window.getComputedStyle(container).transform;
    if (transform === "none") {
        return 1;
    }

    const matrixRegex = /matrix\((-?\d*\.?\d+),\s*0,\s*0,\s*-?\d*\.?\d+,\s*-?\d*\.?\d+,\s*-?\d*\.?\d+\)/;
    const matches = transform.match(matrixRegex);

    if (!matches) {
        throw new Error(t("relation_map.cannot_match_transform", { transform }));
    }

    return parseFloat(matches[1]);
}
