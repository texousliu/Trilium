import { useEffect, useRef, useState } from "preact/hooks";
import "./NoteMap.css";
import { getMapRootNoteId, getThemeStyle, MapType, NoteMapWidgetMode, rgb2hex } from "./utils";
import { RefObject } from "preact";
import FNote from "../../entities/fnote";
import { useElementSize, useNoteContext, useNoteLabel } from "../react/hooks";
import ForceGraph, { LinkObject, NodeObject } from "force-graph";
import { loadNotesAndRelations, Node, NotesAndRelationsData } from "./data";
import { CssData, setupRendering } from "./rendering";
import ActionButton from "../react/ActionButton";
import { t } from "../../services/i18n";
import link_context_menu from "../../menus/link_context_menu";
import appContext from "../../components/app_context";

interface NoteMapProps {
    note: FNote;
    widgetMode: NoteMapWidgetMode;
    parentRef: RefObject<HTMLElement>;
}

export default function NoteMap({ note, widgetMode, parentRef }: NoteMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const styleResolverRef = useRef<HTMLDivElement>(null);
    const [ mapTypeRaw, setMapType ] = useNoteLabel(note, "mapType");
    const mapType: MapType = mapTypeRaw === "tree" ? "tree" : "link";

    const graphRef = useRef<ForceGraph<NodeObject, LinkObject<NodeObject>>>();
    const containerSize = useElementSize(parentRef);

    // Build the note graph instance.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const graph = new ForceGraph(container);

        graphRef.current = graph;

        const mapRootId = getMapRootNoteId(note.noteId, note, widgetMode);
        if (!mapRootId) return;

        const labelValues = (name: string) => note.getLabels(name).map(l => l.value) ?? [];
        const excludeRelations = labelValues("mapExcludeRelation");
        const includeRelations = labelValues("mapIncludeRelation");
        loadNotesAndRelations(mapRootId, excludeRelations, includeRelations, mapType).then((notesAndRelations) => {
            if (!containerRef.current || !styleResolverRef.current) return;
            const cssData = getCssData(containerRef.current, styleResolverRef.current);

            // Configure rendering properties.
            setupRendering(graph, {
                cssData,
                noteId: note.noteId,
                noteIdToSizeMap: notesAndRelations.noteIdToSizeMap,
                notesAndRelations,
                themeStyle: getThemeStyle(),
                widgetMode,
                mapType
            });

            // Interaction
            graph
                .onNodeClick((node) => {
                    if (!node.id) return;
                    appContext.tabManager.getActiveContext()?.setNote((node as Node).id);
                })
                .onNodeRightClick((node, e) => {
                    if (!node.id) return;
                    link_context_menu.openContextMenu((node as Node).id, e);
                });

            // Set data
            graph.graphData(notesAndRelations);
        });

        return () => container.replaceChildren();
    }, [ note, mapType ]);

    // React to container size
    useEffect(() => {
        if (!containerSize || !graphRef.current) return;
        graphRef.current.width(containerSize.width).height(containerSize.height);
    }, [ containerSize?.width, containerSize?.height ]);

    return (
        <div className="note-map-widget">
            <div className="btn-group btn-group-sm map-type-switcher content-floating-buttons top-left" role="group">
                <MapTypeSwitcher type="link" icon="bx bx-network-chart" text={t("note-map.button-link-map")} currentMapType={mapType} setMapType={setMapType} />
                <MapTypeSwitcher type="tree" icon="bx bx-sitemap" text={t("note-map.button-tree-map")} currentMapType={mapType} setMapType={setMapType} />
            </div>

            <div ref={styleResolverRef} class="style-resolver" />
            <div ref={containerRef} className="note-map-container" />
        </div>
    )
}

function MapTypeSwitcher({ icon, text, type, currentMapType, setMapType }: {
    icon: string;
    text: string;
    type: MapType;
    currentMapType: MapType;
    setMapType: (type: MapType) => void;
}) {
    return (
        <ActionButton
            icon={icon} text={text}
            disabled={currentMapType === type}
            onClick={() => setMapType(type)}
            frame
        />
    )
}

function getCssData(container: HTMLElement, styleResolver: HTMLElement): CssData {
    const containerStyle = window.getComputedStyle(container);
    const styleResolverStyle = window.getComputedStyle(styleResolver);

    return {
        fontFamily: containerStyle.fontFamily,
        textColor: rgb2hex(containerStyle.color),
        mutedTextColor: rgb2hex(styleResolverStyle.color)
    }
}
