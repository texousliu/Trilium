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
    <!-- UI for dragging Notes and link force -->

      <button type="button" data-toggle="button" class="btn  tn-tool-button" title="${}" data-type="moveable"></button>
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
    private $fixNodesButton!: JQuery<HTMLElement>;
    graph!: ForceGraph;
    private noteIdToSizeMap!: Record<string, number>;

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
    }

    async refreshWithNote(note: FNote) {
        this.$widget.show();

        const ForceGraph = (await import("force-graph")).default;
        this.graph = new ForceGraph(this.$container[0])
            // Rendering code was here

        let distancevalue = 40; // default value for the link force of the nodes

        this.$widget.find(".fixnodes-type-switcher input").on("change", async (e) => {
            distancevalue = parseInt(e.target.closest("input")?.value ?? "0");
            this.graph.d3Force("link")?.distance(distancevalue);

            this.renderData(data);
        });

        this.renderData(data);
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
