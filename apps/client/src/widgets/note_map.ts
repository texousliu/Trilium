import server from "../services/server.js";
import attributeService from "../services/attributes.js";
import hoistedNoteService from "../services/hoisted_note.js";
import appContext, { type EventData } from "../components/app_context.js";
import NoteContextAwareWidget from "./note_context_aware_widget.js";
import linkContextMenuService from "../menus/link_context_menu.js";
import utils from "../services/utils.js";
import { t } from "../services/i18n.js";
import type ForceGraph from "force-graph";
import type { GraphData, LinkObject, NodeObject } from "force-graph";
import type FNote from "../entities/fnote.js";

const esc = utils.escapeHtml;

const TPL = /*html*/`<div class="note-map-widget">
    <div class="btn-group btn-group-sm map-type-switcher content-floating-buttons top-left" role="group">
      <button type="button" class="btn bx bx-network-chart tn-tool-button" title="${t("note-map.button-link-map")}" data-type="link"></button>
      <button type="button" class="btn bx bx-sitemap tn-tool-button" title="${t("note-map.button-tree-map")}" data-type="tree"></button>
    </div>

    <!-- UI for dragging Notes and link force -->

    <div class="btn-group-sm fixnodes-type-switcher content-floating-buttons bottom-left" role="group">
      <button type="button" data-toggle="button" class="btn bx bx-lock-alt tn-tool-button" title="${t("note_map.fix-nodes")}" data-type="moveable"></button>
      <input type="range" class="slider" min="1" title="${t("note_map.link-distance")}" max="100" value="40" >
    </div>


    <div class="note-map-container"></div>
</div>`;

type WidgetMode = "type" | "ribbon";
type Data = GraphData<NodeObject, LinkObject<NodeObject>>;



export default class NoteMapWidget extends NoteContextAwareWidget {

    private fixNodes: boolean;
    private widgetMode: WidgetMode;

    private themeStyle!: string;
    private $container!: JQuery<HTMLElement>;
    private $styleResolver!: JQuery<HTMLElement>;
    private $fixNodesButton!: JQuery<HTMLElement>;
    graph!: ForceGraph;
    private noteIdToSizeMap!: Record<string, number>;
    private zoomLevel!: number;
    private nodes!: Node[];

    constructor(widgetMode: WidgetMode) {
        super();
        this.fixNodes = false; // needed to save the status of the UI element. Is set later in the code
        this.widgetMode = widgetMode; // 'type' or 'ribbon'
    }

    doRender() {
        this.$widget = $(TPL);

        this.$container = this.$widget.find(".note-map-container");
        this.$styleResolver = this.$widget.find(".style-resolver");
        this.$fixNodesButton = this.$widget.find(".fixnodes-type-switcher > button");

        new ResizeObserver(() => this.setDimensions()).observe(this.$container[0]);

        this.$widget.find(".map-type-switcher button").on("click", async (e) => {
            const type = $(e.target).closest("button").attr("data-type");

            await attributeService.setLabel(this.noteId ?? "", "mapType", type);
        });

        // Reading the status of the Drag nodes Ui element. Changing it´s color when activated.
        // Reading Force value of the link distance.
        this.$fixNodesButton.on("click", async (event) => {
            this.fixNodes = !this.fixNodes;
            this.$fixNodesButton.toggleClass("toggled", this.fixNodes);
        });

        super.doRender();
    }

    async refreshWithNote(note: FNote) {
        this.$widget.show();

        const ForceGraph = (await import("force-graph")).default;
        this.graph = new ForceGraph(this.$container[0])
            //Code to fixate nodes when dragged
            .onNodeDragEnd((node) => {
                if (this.fixNodes) {
                    node.fx = node.x;
                    node.fy = node.y;
                } else {
                    node.fx = undefined;
                    node.fy = undefined;
                }
            })

            // set link width to immitate a highlight effekt. Checking the condition if any links are saved in the previous defined set highlightlinks
            .linkWidth((link) => (highlightLinks.has(link) ? 3 : 0.4))
            .linkColor((link) => (highlightLinks.has(link) ? "white" : this.cssData.mutedTextColor))
            .linkDirectionalArrowLength(4)
            .linkDirectionalArrowRelPos(0.95)

            // Rendering code was here

            .nodePointerAreaPaint((node, _, ctx) => this.paintNode(node as Node, this.getColorForNode(node as Node), ctx))
            .nodePointerAreaPaint((node, color, ctx) => {
                if (!node.id) {
                    return;
                }

                ctx.fillStyle = color;
                ctx.beginPath();
                if (node.x && node.y) {
                    ctx.arc(node.x, node.y, this.noteIdToSizeMap[node.id], 0, 2 * Math.PI, false);
                }
                ctx.fill();
            })
            .nodeLabel((node) => esc((node as Node).name))
            .onNodeClick((node) => {
                if (node.id) {
                    appContext.tabManager.getActiveContext()?.setNote((node as Node).id);
                }
            })
            .onNodeRightClick((node, e) => {
                if (node.id) {
                    linkContextMenuService.openContextMenu((node as Node).id, e);
                }
            });

        if (this.mapType === "link") {
            this.graph
                .linkLabel((l) => `${esc((l as Link).source.name)} - <strong>${esc((l as Link).name)}</strong> - ${esc((l as Link).target.name)}`)
                .linkCanvasObject((link, ctx) => this.paintLink(link as Link, ctx))
                .linkCanvasObjectMode(() => "after");
        }

        const nodeLinkRatio = data.nodes.length / data.links.length;
        const magnifiedRatio = Math.pow(nodeLinkRatio, 1.5);
        const charge = -20 / magnifiedRatio;
        const boundedCharge = Math.min(-3, charge);
        let distancevalue = 40; // default value for the link force of the nodes

        this.$widget.find(".fixnodes-type-switcher input").on("change", async (e) => {
            distancevalue = parseInt(e.target.closest("input")?.value ?? "0");
            this.graph.d3Force("link")?.distance(distancevalue);

            this.renderData(data);
        });

        this.graph.d3Force("center")?.strength(0.2);
        this.graph.d3Force("charge")?.strength(boundedCharge);
        this.graph.d3Force("charge")?.distanceMax(1000);

        this.renderData(data);
    }

    setZoomLevel(level: number) {
        this.zoomLevel = level;
    }

    paintLink(link: Link, ctx: CanvasRenderingContext2D) {
        if (this.zoomLevel < 5) {
            return;
        }

        ctx.font = `3px ${this.cssData.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = this.cssData.mutedTextColor;

        const { source, target } = link;
        if (typeof source !== "object" || typeof target !== "object") {
            return;
        }

        if (source.x && source.y && target.x && target.y) {
            const x = (source.x + target.x) / 2;
            const y = (source.y + target.y) / 2;
            ctx.save();
            ctx.translate(x, y);

            const deltaY = source.y - target.y;
            const deltaX = source.x - target.x;

            let angle = Math.atan2(deltaY, deltaX);
            let moveY = 2;

            if (angle < -Math.PI / 2 || angle > Math.PI / 2) {
                angle += Math.PI;
                moveY = -2;
            }

            ctx.rotate(angle);
            ctx.fillText(link.name, 0, moveY);
        }

        ctx.restore();
    }

    renderData(data: Data) {
        if (this.widgetMode === "ribbon" && this.note?.type !== "search") {
            setTimeout(() => {
                this.setDimensions();

                const subGraphNoteIds = this.getSubGraphConnectedToCurrentNote(data);

                this.graph.zoomToFit(400, 50, (node) => subGraphNoteIds.has(node.id));

                if (subGraphNoteIds.size < 30) {
                    this.graph.d3VelocityDecay(0.4);
                }
            }, 1000);
        } else {
            if (data.nodes.length > 1) {
                setTimeout(() => {
                    this.setDimensions();

                    const noteIdsWithLinks = this.getNoteIdsWithLinks(data);

                    if (noteIdsWithLinks.size > 0) {
                        this.graph.zoomToFit(400, 30, (node) => noteIdsWithLinks.has(node.id ?? ""));
                    }

                    if (noteIdsWithLinks.size < 30) {
                        this.graph.d3VelocityDecay(0.4);
                    }
                }, 1000);
            }
        }
    }

    getNoteIdsWithLinks(data: Data) {
        const noteIds = new Set<string | number>();

        for (const link of data.links) {
            if (typeof link.source === "object" && link.source.id) {
                noteIds.add(link.source.id);
            }
            if (typeof link.target === "object" && link.target.id) {
                noteIds.add(link.target.id);
            }
        }

        return noteIds;
    }

    getSubGraphConnectedToCurrentNote(data: Data) {
        function getGroupedLinks(links: LinkObject<NodeObject>[], type: "source" | "target") {
            const map: Record<string | number, LinkObject<NodeObject>[]> = {};

            for (const link of links) {
                if (typeof link[type] !== "object") {
                    continue;
                }

                const key = link[type].id;
                if (key) {
                    map[key] = map[key] || [];
                    map[key].push(link);
                }
            }

            return map;
        }

        const linksBySource = getGroupedLinks(data.links, "source");
        const linksByTarget = getGroupedLinks(data.links, "target");

        const subGraphNoteIds = new Set();

        function traverseGraph(noteId?: string | number) {
            if (!noteId || subGraphNoteIds.has(noteId)) {
                return;
            }

            subGraphNoteIds.add(noteId);

            for (const link of linksBySource[noteId] || []) {
                if (typeof link.target === "object") {
                    traverseGraph(link.target?.id);
                }
            }

            for (const link of linksByTarget[noteId] || []) {
                if (typeof link.source === "object") {
                    traverseGraph(link.source?.id);
                }
            }
        }

        traverseGraph(this.noteId);
        return subGraphNoteIds;
    }

    cleanup() {
        this.$container.html("");
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.getAttributeRows(this.componentId)
                .find((attr) => attr.type === "label" && ["mapType", "mapRootNoteId"].includes(attr.name || "") && attributeService.isAffecting(attr, this.note))) {
            this.refresh();
        }
    }
}
