import { useEffect, useRef, useState } from "preact/hooks";
import "./NoteMap.css";
import { getMapRootNoteId, NoteMapWidgetMode, rgb2hex } from "./utils";
import { RefObject } from "preact";
import FNote from "../../entities/fnote";
import { useNoteContext, useNoteLabel } from "../react/hooks";
import ForceGraph, { LinkObject, NodeObject } from "force-graph";
import { loadNotesAndRelations, NotesAndRelationsData } from "./data";

interface CssData {
    fontFamily: string;
    textColor: string;
    mutedTextColor: string;
}

interface NoteMapProps {
    note: FNote;
    widgetMode: NoteMapWidgetMode;
}

type MapType = "tree" | "link";

export default function NoteMap({ note, widgetMode }: NoteMapProps) {
    console.log("Got note", note);
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
            <NoteGraph containerRef={containerRef} note={note} widgetMode={widgetMode} mapType={mapType} />
        </div>
    )
}

function NoteGraph({ containerRef, note, widgetMode, mapType }: {
    containerRef: RefObject<HTMLDivElement>;
    note: FNote;
    widgetMode: NoteMapWidgetMode;
    mapType: MapType;
}) {
    const graphRef = useRef<ForceGraph<NodeObject, LinkObject<NodeObject>>>();
    const [ data, setData ] = useState<NotesAndRelationsData>();
    console.log("Got data ", data);

    // Build the note graph instance.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const { width, height } = container.getBoundingClientRect();
        const graph = new ForceGraph(container)
            .width(width)
            .height(height);
        graphRef.current = graph;

        const mapRootId = getMapRootNoteId(note.noteId, note, widgetMode);
        if (!mapRootId) return;

        const labelValues = (name: string) => note.getLabels(name).map(l => l.value) ?? [];
        const excludeRelations = labelValues("mapExcludeRelation");
        const includeRelations = labelValues("mapIncludeRelation");
        loadNotesAndRelations(mapRootId, excludeRelations, includeRelations, mapType).then((data) => {
            console.log("Got data ", data);
        });

        return () => container.replaceChildren();
    }, [ note ]);

    // Render the data.
    useEffect(() => {
        if (!graphRef.current || !data) return;
        graphRef.current.graphData(data);
    }, [ data ]);


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
