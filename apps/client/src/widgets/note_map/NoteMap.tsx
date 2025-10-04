import { useEffect, useRef, useState } from "preact/hooks";
import "./NoteMap.css";
import { getMapRootNoteId, getThemeStyle, NoteMapWidgetMode, rgb2hex } from "./utils";
import { RefObject } from "preact";
import FNote from "../../entities/fnote";
import { useElementSize, useNoteContext, useNoteLabel } from "../react/hooks";
import ForceGraph, { LinkObject, NodeObject } from "force-graph";
import { loadNotesAndRelations, NotesAndRelationsData } from "./data";
import { CssData, setupRendering } from "./rendering";

interface NoteMapProps {
    note: FNote;
    widgetMode: NoteMapWidgetMode;
    parentRef: RefObject<HTMLElement>;
}

type MapType = "tree" | "link";

export default function NoteMap({ note, widgetMode, parentRef }: NoteMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const styleResolverRef = useRef<HTMLDivElement>(null);
    const [ cssData, setCssData ] = useState<CssData>();
    const [ mapTypeRaw ] = useNoteLabel(note, "mapType");
    const mapType: MapType = mapTypeRaw === "tree" ? "tree" : "link";

    useEffect(() => {
        if (!containerRef.current || !styleResolverRef.current) return;
        setCssData(getCssData(containerRef.current, styleResolverRef.current));
    }, []);

    return (
        <div className="note-map-widget">
            <div ref={styleResolverRef} class="style-resolver" />
            <NoteGraph parentRef={parentRef} containerRef={containerRef} note={note} widgetMode={widgetMode} mapType={mapType} cssData={cssData} />
        </div>
    )
}

function NoteGraph({ containerRef, parentRef, note, widgetMode, mapType, cssData }: {
    containerRef: RefObject<HTMLDivElement>;
    parentRef: RefObject<HTMLElement>;
    note: FNote;
    widgetMode: NoteMapWidgetMode;
    mapType: MapType;
    cssData: CssData;
}) {
    const graphRef = useRef<ForceGraph<NodeObject, LinkObject<NodeObject>>>();
    const containerSize = useElementSize(parentRef);

    // Build the note graph instance.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const graph = new ForceGraph(container);

        graphRef.current = graph;

        const mapRootId = getMapRootNoteId(note.noteId, note, widgetMode);
        console.log("Map root ID ", mapRootId);
        if (!mapRootId) return;

        const labelValues = (name: string) => note.getLabels(name).map(l => l.value) ?? [];
        const excludeRelations = labelValues("mapExcludeRelation");
        const includeRelations = labelValues("mapIncludeRelation");
        loadNotesAndRelations(mapRootId, excludeRelations, includeRelations, mapType).then((notesAndRelations) => {
            setupRendering(graph, {
                cssData,
                noteId: note.noteId,
                noteIdToSizeMap: notesAndRelations.noteIdToSizeMap,
                notesAndRelations,
                themeStyle: getThemeStyle(),
                widgetMode
            });
            graph.graphData(notesAndRelations);
        });

        return () => container.replaceChildren();
    }, [ note ]);

    // React to container size
    useEffect(() => {
        if (!containerSize || !graphRef.current) return;
        graphRef.current.width(containerSize.width).height(containerSize.height);
    }, [ containerSize?.width, containerSize?.height ]);

    return <div ref={containerRef} className="note-map-container" />;
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
