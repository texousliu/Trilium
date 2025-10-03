import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { TypeWidgetProps } from "../type_widget";
import { Defaults, jsPlumb, jsPlumbInstance, OverlaySpec } from "jsplumb";
import { useEditorSpacedUpdate, useNoteBlob, useNoteProperty, useTriliumEvent, useTriliumEvents } from "../../react/hooks";
import FNote from "../../../entities/fnote";
import { ComponentChildren, RefObject } from "preact";
import froca from "../../../services/froca";
import NoteLink from "../../react/NoteLink";
import "./RelationMap.css";
import { t } from "../../../services/i18n";
import panzoom, { PanZoomOptions } from "panzoom";
import dialog from "../../../services/dialog";
import server from "../../../services/server";
import toast from "../../../services/toast";
import { CreateChildrenResponse, RelationMapPostResponse, RelationMapRelation } from "@triliumnext/commons";
import contextMenu from "../../../menus/context_menu";
import appContext from "../../../components/app_context";
import RelationMapApi, { MapData, MapDataNoteEntry } from "./api";
import setupOverlays, { uniDirectionalOverlays } from "./overlays";
import { JsPlumb, JsPlumbItem } from "./jsplumb";

interface Clipboard {
    noteId: string;
    title: string;
}

type RelationType = "uniDirectional" | "biDirectional" | "inverse";

interface ClientRelation extends RelationMapRelation {
    type: RelationType;
    render: boolean;
}

export default function RelationMap({ note, ntxId }: TypeWidgetProps) {
    const [ data, setData ] = useState<MapData>();
    const containerRef = useRef<HTMLDivElement>(null);
    const mapApiRef = useRef<RelationMapApi>(null);
    const pbApiRef = useRef<jsPlumbInstance>(null);

    const spacedUpdate = useEditorSpacedUpdate({
        note,
        getData() {
            return {
                content: JSON.stringify(data),
            };
        },
        onContentChange(content) {
            let newData: MapData | null = null;

            if (content) {
                try {
                    newData = JSON.parse(content);
                } catch (e) {
                    console.log("Could not parse content: ", e);
                }
            }

            if (!newData) {
                newData = {
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

            setData(newData);
            mapApiRef.current = new RelationMapApi(note, newData, (newData, refreshUi) => {
                if (refreshUi) {
                    setData(newData);
                }
                spacedUpdate.scheduleUpdate();
            });
        },
        dataSaved() {

        }
    });

    const onTransform = useCallback((pzInstance: PanZoom) => {
        if (!containerRef.current || !mapApiRef.current || !pbApiRef.current || !data) return;
        const zoom = getZoom(containerRef.current);
        mapApiRef.current.setTransform(pzInstance.getTransform());
        pbApiRef.current.setZoom(zoom);
    }, [ data ]);

    const clickCallback = useNoteCreation({
        containerRef,
        note,
        ntxId,
        mapApiRef
    });

    usePanZoom({
        ntxId,
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

    useRelationData(note.noteId, data, mapApiRef, pbApiRef);

    return (
        <div className="note-detail-relation-map note-detail-printable">
            <div className="relation-map-wrapper" onClick={clickCallback}>
                <JsPlumb
                    apiRef={pbApiRef}
                    containerRef={containerRef}
                    className="relation-map-container"
                    props={{
                        Endpoint: ["Dot", { radius: 2 }],
                        Connector: "StateMachine",
                        ConnectionOverlays: uniDirectionalOverlays,
                        HoverPaintStyle: { stroke: "#777", strokeWidth: 1 },
                    }}
                    onInstanceCreated={setupOverlays}
                >
                    {data?.notes.map(note => (
                        <NoteBox {...note} mapApiRef={mapApiRef} />
                    ))}
                </JsPlumb>
            </div>
        </div>
    )
}

function usePanZoom({ ntxId, containerRef, options, transformData, onTransform }: {
    ntxId: string | null | undefined;
    containerRef: RefObject<HTMLDivElement>;
    options: PanZoomOptions;
    transformData: MapData["transform"] | undefined;
    onTransform: (pzInstance: PanZoom) => void
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
            apiRef.current!.on("transform", () => onTransform(pzInstance));
        }

        return () => pzInstance.dispose();
    }, [ containerRef, onTransform ]);

    useTriliumEvents([ "relationMapResetPanZoom", "relationMapResetZoomIn", "relationMapResetZoomOut" ], ({ ntxId: eventNtxId }, eventName) => {
        const pzInstance = apiRef.current;
        if (eventNtxId !== ntxId || !pzInstance) return;

        if (eventName === "relationMapResetPanZoom" && containerRef.current) {
            const zoom = getZoom(containerRef.current);
            pzInstance.zoomTo(0, 0, 1 / zoom);
            pzInstance.moveTo(0, 0);
        } else if (eventName === "relationMapResetZoomIn") {
            pzInstance.zoomTo(0, 0, 1.2);
        } else if (eventName === "relationMapResetZoomOut") {
            pzInstance.zoomTo(0, 0, 0.8);
        }
    });
}

async function useRelationData(noteId: string, mapData: MapData | undefined, mapApiRef: RefObject<RelationMapApi>, jsPlumbRef: RefObject<jsPlumbInstance>) {
    const noteIds = mapData?.notes.map((note) => note.noteId);
    const [ relations, setRelations ] = useState<ClientRelation[]>();
    const [ inverseRelations, setInverseRelations ] = useState<RelationMapPostResponse["inverseRelations"]>();

    async function refresh() {
        if (!noteIds) return;

        const data = await server.post<RelationMapPostResponse>("relation-map", { noteIds, relationMapNoteId: noteId });
        const relations: ClientRelation[] = [];

        for (const _relation of data.relations) {
            const relation = _relation as ClientRelation;   // we inject a few variables.
            const match = relations.find(
                (rel) =>
                    rel.name === data.inverseRelations[relation.name] &&
                    ((rel.sourceNoteId === relation.sourceNoteId && rel.targetNoteId === relation.targetNoteId) ||
                        (rel.sourceNoteId === relation.targetNoteId && rel.targetNoteId === relation.sourceNoteId))
            );

            if (match) {
                match.type = relation.type = relation.name === data.inverseRelations[relation.name] ? "biDirectional" : "inverse";
                relation.render = false; // don't render second relation
            } else {
                relation.type = "uniDirectional";
                relation.render = true;
            }

            relations.push(relation);
            setInverseRelations(data.inverseRelations);
        }

        setRelations(relations);
        mapApiRef.current?.cleanupOtherNotes(Object.keys(data.noteTitles));
    }

    useEffect(() => {
        refresh();
    }, [ noteId, mapData, jsPlumbInstance ]);

    // Refresh on the canvas.
    useEffect(() => {
        const jsPlumbInstance = jsPlumbRef.current;
        if (!jsPlumbInstance) return;

        jsPlumbInstance.batch(async () => {
            if (!mapData || !relations) {
                return;
            }

            jsPlumbInstance.deleteEveryEndpoint();

            for (const relation of relations) {
                if (!relation.render) {
                    continue;
                }

                const connection = jsPlumbInstance.connect({
                    source: noteIdToId(relation.sourceNoteId),
                    target: noteIdToId(relation.targetNoteId),
                    type: relation.type
                });

                // TODO: Does this actually do anything.
                //@ts-expect-error
                connection.id = relation.attributeId;

                if (relation.type === "inverse") {
                    connection.getOverlay("label-source").setLabel(relation.name);
                    connection.getOverlay("label-target").setLabel(inverseRelations?.[relation.name] ?? "");
                } else {
                    connection.getOverlay("label").setLabel(relation.name);
                }

                connection.canvas.setAttribute("data-connection-id", connection.id);
            }
        });
    }, [ relations, mapData ]);
}

function useNoteCreation({ ntxId, note, containerRef, mapApiRef }: {
    ntxId: string | null | undefined;
    note: FNote;
    containerRef: RefObject<HTMLDivElement>;
    mapApiRef: RefObject<RelationMapApi>;
}) {
    const clipboardRef = useRef<Clipboard>(null);
    useTriliumEvent("relationMapCreateChildNote", async ({ ntxId: eventNtxId }) => {
        if (eventNtxId !== ntxId) return;
        const title = await dialog.prompt({ message: t("relation_map.enter_title_of_new_note"), defaultValue: t("relation_map.default_new_note_title") });
        if (!title?.trim()) return;

        const { note: createdNote } = await server.post<CreateChildrenResponse>(`notes/${note.noteId}/children?target=into`, {
            title,
            content: "",
            type: "text"
        });

        toast.showMessage(t("relation_map.click_on_canvas_to_place_new_note"));
        clipboardRef.current = {
            noteId: createdNote.noteId,
            title
        };
    });
    const onClickHandler = useCallback((e: MouseEvent) => {
        const clipboard = clipboardRef.current;
        if (clipboard && containerRef.current && mapApiRef.current) {
            const zoom = getZoom(containerRef.current);
            let { x, y } = getMousePosition(e, containerRef.current, zoom);

            // modifying position so that the cursor is on the top-center of the box
            x -= 80;
            y -= 15;

            mapApiRef.current.createItem({ noteId: clipboard.noteId, x, y });
            clipboardRef.current = null;
        }
    }, []);
    return onClickHandler;
}

function NoteBox({ noteId, x, y, mapApiRef }: MapDataNoteEntry & { mapApiRef: RefObject<RelationMapApi> }) {
    const [ note, setNote ] = useState<FNote | null>();
    const title = useNoteProperty(note, "title");
    useEffect(() => {
        froca.getNote(noteId).then(setNote);
    }, [ noteId ]);

    const contextMenuHandler = useCallback((e: MouseEvent) => {
        e.preventDefault();
        contextMenu.show({
            x: e.pageX,
            y: e.pageY,
            items: [
                {
                    title: t("relation_map.open_in_new_tab"),
                    uiIcon: "bx bx-empty",
                    handler: () => appContext.tabManager.openTabWithNoteWithHoisting(noteId)
                },
                {
                    title: t("relation_map.remove_note"),
                    uiIcon: "bx bx-trash",
                    handler: async () => {
                        if (!note) return;
                        const result = await dialog.confirmDeleteNoteBoxWithNote(note.title);
                        if (typeof result !== "object" || !result.confirmed) return;

                        mapApiRef.current?.removeItem(noteId, result.isDeleteNoteChecked);
                    }
                },
                {
                    title: t("relation_map.edit_title"),
                    uiIcon: "bx bx-pencil",
                    handler: async () => {
                        const title = await dialog.prompt({
                            title: t("relation_map.rename_note"),
                            message: t("relation_map.enter_new_title"),
                            defaultValue: note?.title,
                        });

                        if (!title) {
                            return;
                        }

                        await server.put(`notes/${noteId}/title`, { title });
                    }
                }
            ],
            selectMenuItemHandler() {}
        })
    }, [ note ]);

    return note && (
        <JsPlumbItem
            id={noteIdToId(noteId)}
            className={`note-box ${note?.getCssClass()}`}
            onContextMenu={contextMenuHandler}
            x={x} y={y}
            draggable={{
                start() {},
                drag() {},
                stop(params) {
                    const noteId = idToNoteId(params.el.id);
                    const [ x, y ] = params.pos;
                    mapApiRef.current?.moveNote(noteId, x, y);
                },
            }}
        >
            <NoteLink className="title" title={title} notePath={noteId} noTnLink noContextMenu />
            <div className="endpoint" title={t("relation_map.start_dragging_relations")} />
        </JsPlumbItem>
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

function getMousePosition(evt: MouseEvent, container: HTMLDivElement, zoom: number) {
    const rect = container.getBoundingClientRect();

    return {
        x: ((evt.clientX ?? 0) - rect.left) / zoom,
        y: ((evt.clientY ?? 0) - rect.top) / zoom
    };
}
