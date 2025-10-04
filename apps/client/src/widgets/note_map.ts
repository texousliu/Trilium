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
        this.widgetMode = widgetMode; // 'type' or 'ribbon'
    }

    doRender() {
        this.$widget = $(TPL);

        this.$container = this.$widget.find(".note-map-container");
        this.$styleResolver = this.$widget.find(".style-resolver");
        this.$fixNodesButton = this.$widget.find(".fixnodes-type-switcher > button");

        new ResizeObserver(() => this.setDimensions()).observe(this.$container[0]);
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
