import type ForceGraph from "force-graph";
import { Link, Node, NotesAndRelationsData } from "./data";
import { NodeObject } from "force-graph";
import { getColorForNode, NoteMapWidgetMode } from "./utils";

export interface CssData {
    fontFamily: string;
    textColor: string;
    mutedTextColor: string;
}

interface RenderData {
    noteIdToSizeMap: Record<string, number>;
    cssData: CssData;
    noteId: string;
    themeStyle: "light" | "dark";
    widgetMode: NoteMapWidgetMode;
    notesAndRelations: NotesAndRelationsData;
}

export function setupRendering(graph: ForceGraph, { noteId, themeStyle, widgetMode, noteIdToSizeMap, notesAndRelations, cssData }: RenderData) {
    // variables for the hover effect. We have to save the neighbours of a hovered node in a set. Also we need to save the links as well as the hovered node itself
    const neighbours = new Set();
    const highlightLinks = new Set();
    let hoverNode: NodeObject | null = null;
    let zoomLevel: number;

    function paintNode(node: Node, color: string, ctx: CanvasRenderingContext2D) {
        const { x, y } = node;
        if (!x || !y) {
            return;
        }
        const size = noteIdToSizeMap[node.id];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, 2 * Math.PI, false);
        ctx.fill();

        const toRender = zoomLevel > 2 || (zoomLevel > 1 && size > 6) || (zoomLevel > 0.3 && size > 10);

        if (!toRender) {
            return;
        }

        ctx.fillStyle = cssData.textColor;
        ctx.font = `${size}px ${cssData.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let title = node.name;

        if (title.length > 15) {
            title = `${title.substr(0, 15)}...`;
        }

        ctx.fillText(title, x, y + Math.round(size * 1.5));
    }

    // main code for highlighting hovered nodes and neighbours. here we "style" the nodes. the nodes are rendered several hundred times per second.
    graph
        .d3AlphaDecay(0.01)
        .d3VelocityDecay(0.08)
        .maxZoom(7)
        .warmupTicks(30)
        .nodeCanvasObject((_node, ctx) => {
            const node: Node = _node as Node;
            if (hoverNode == node) {
                //paint only hovered node
                paintNode(node, "#661822", ctx);
                neighbours.clear(); //clearing neighbours or the effect would be maintained after hovering is over
                for (const _link of notesAndRelations.links) {
                    const link = _link as unknown as Link;
                    //check if node is part of a link in the canvas, if so add it´s neighbours and related links to the previous defined variables to paint the nodes
                    if (link.source.id == node.id || link.target.id == node.id) {
                        neighbours.add(link.source);
                        neighbours.add(link.target);
                        highlightLinks.add(link);
                        neighbours.delete(node);
                    }
                }
            } else if (neighbours.has(node) && hoverNode != null) {
                //paint neighbours
                paintNode(node, "#9d6363", ctx);
            } else {
                paintNode(node, getColorForNode(node, noteId, themeStyle, widgetMode), ctx); //paint rest of nodes in canvas
            }
        })
        //check if hovered and set the hovernode variable, saving the hovered node object into it. Clear links variable everytime you hover. Without clearing links will stay highlighted
        .onNodeHover((node) => {
            hoverNode = node || null;
            highlightLinks.clear();
        })
        .onZoom((zoom) => zoomLevel = zoom.k);
}

