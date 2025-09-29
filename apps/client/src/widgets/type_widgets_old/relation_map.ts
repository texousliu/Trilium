import server from "../../services/server.js";
import linkService from "../../services/link.js";
import contextMenu from "../../menus/context_menu.js";
import toastService from "../../services/toast.js";
import attributeAutocompleteService from "../../services/attribute_autocomplete.js";
import TypeWidget from "./type_widget.js";
import appContext, { type EventData } from "../../components/app_context.js";
import utils from "../../services/utils.js";
import froca from "../../services/froca.js";
import dialogService from "../../services/dialog.js";
import { t } from "../../services/i18n.js";
import type FNote from "../../entities/fnote.js";
import type { ConnectionMadeEventInfo, jsPlumbInstance, OverlaySpec } from "jsplumb";

declare module "jsplumb" {

    interface Connection {
        canvas: HTMLCanvasElement;
        getType(): string;
        bind(event: string, callback: (obj: unknown, event: MouseEvent) => void): void;
    }

    interface Overlay {
        setLabel(label: string): void;
    }

    interface ConnectParams {
        type: RelationType;
    }
}

let containerCounter = 1;

export type RelationType = "uniDirectional" | "biDirectional" | "inverse";

interface Relation {
    name: string;
    attributeId: string;
    sourceNoteId: string;
    targetNoteId: string;
    type: RelationType;
    render: boolean;
}

// TODO: Deduplicate.
interface RelationMapPostResponse {
    relations: Relation[];
    inverseRelations: Record<string, string>;
    noteTitles: Record<string, string>;
}

type MenuCommands = "openInNewTab" | "remove" | "editTitle";

export default class RelationMapTypeWidget extends TypeWidget {

    private clipboard?: Clipboard | null;
    private jsPlumbInstance?: import("jsplumb").jsPlumbInstance | null;
    private pzInstance?: PanZoom | null;
    private mapData?: MapData | null;
    private relations?: Relation[] | null;

    private $relationMapContainer!: JQuery<HTMLElement>;
    private $relationMapWrapper!: JQuery<HTMLElement>;

    static getType() {
        return "relationMap";
    }

    doRender() {
        this.$widget = $(TPL);
        this.$relationMapContainer = this.$widget.find(".relation-map-container");

        this.mapData = null;
        this.jsPlumbInstance = null;
        // outside of mapData because they are not persisted in the note content
        this.relations = null;
        this.pzInstance = null;

        this.$relationMapWrapper = this.$widget.find(".relation-map-wrapper");
        this.$relationMapWrapper.on("click", (event) => {


            return true;
        });

        this.$relationMapContainer.attr("id", "relation-map-container-" + containerCounter++);

        this.clipboard = null;

        this.$widget.on("drop", (ev) => this.dropNoteOntoRelationMapHandler(ev));
        this.$widget.on("dragover", (ev) => ev.preventDefault());

        this.initialized = new Promise(async (res) => {
            // Weird typecast is needed probably due to bad typings in the module itself.
            const jsPlumb = (await import("jsplumb")).default.jsPlumb as unknown as jsPlumbInstance;
            jsPlumb.ready(res);
        });

        super.doRender();
    }

    async doRefresh(note: FNote) {
        await this.initJsPlumbInstance();
        this.loadNotesAndRelations();
    }

    clearMap() {
        // delete all endpoints and connections
        // this is done at this point (after async operations) to reduce flicker to the minimum
        this.jsPlumbInstance?.deleteEveryEndpoint();

        // without this, we still end up with note boxes remaining in the canvas
        this.$relationMapContainer.empty();
    }

    async loadNotesAndRelations() {
        if (!this.mapData || !this.jsPlumbInstance) {
            return;
        }

        const noteIds = this.mapData.notes.map((note) => note.noteId);
        const data = await server.post<RelationMapPostResponse>("relation-map", { noteIds, relationMapNoteId: this.noteId });

        this.relations = [];

        for (const relation of data.relations) {
            const match = this.relations.find(
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

            this.relations.push(relation);
        }

        this.mapData.notes = this.mapData.notes.filter((note) => note.noteId in data.noteTitles);

        this.jsPlumbInstance.batch(async () => {
            if (!this.jsPlumbInstance || !this.mapData || !this.relations) {
                return;
            }

            this.clearMap();

            for (const note of this.mapData.notes) {
                const title = data.noteTitles[note.noteId];

                await this.createNoteBox(note.noteId, title, note.x, note.y);
            }

            for (const relation of this.relations) {
                if (!relation.render) {
                    continue;
                }

                const connection = this.jsPlumbInstance.connect({
                    source: this.noteIdToId(relation.sourceNoteId),
                    target: this.noteIdToId(relation.targetNoteId),
                    type: relation.type
                });

                // TODO: Does this actually do anything.
                //@ts-expect-error
                connection.id = relation.attributeId;

                if (relation.type === "inverse") {
                    connection.getOverlay("label-source").setLabel(relation.name);
                    connection.getOverlay("label-target").setLabel(data.inverseRelations[relation.name]);
                } else {
                    connection.getOverlay("label").setLabel(relation.name);
                }

                connection.canvas.setAttribute("data-connection-id", connection.id);
            }
        });
    }

    cleanup() {
        if (this.jsPlumbInstance) {
            this.clearMap();
        }

        if (this.pzInstance) {
            this.pzInstance.dispose();
            this.pzInstance = null;
        }
    }

    async initJsPlumbInstance() {
        if (this.jsPlumbInstance) {
            this.cleanup();

            return;
        }

        if (!this.jsPlumbInstance) {
            return;
        }

        this.jsPlumbInstance.bind("connection", (info, originalEvent) => this.connectionCreatedHandler(info, originalEvent));
    }

    async connectionCreatedHandler(info: ConnectionMadeEventInfo, originalEvent: Event) {
        const connection = info.connection;

        connection.bind("contextmenu", (obj: unknown, event: MouseEvent) => {
            if (connection.getType().includes("link")) {
                // don't create context menu if it's a link since there's nothing to do with link from relation map
                // (don't open browser menu either)
                event.preventDefault();
            } else {
                event.preventDefault();
                event.stopPropagation();

                contextMenu.show({
                    x: event.pageX,
                    y: event.pageY,
                    items: [{ title: t("relation_map.remove_relation"), command: "remove", uiIcon: "bx bx-trash" }],
                    selectMenuItemHandler: async ({ command }) => {
                        if (command === "remove") {
                            if (!(await dialogService.confirm(t("relation_map.confirm_remove_relation"))) || !this.relations) {
                                return;
                            }

                            const relation = this.relations.find((rel) => rel.attributeId === connection.id);

                            if (relation) {
                                await server.remove(`notes/${relation.sourceNoteId}/relations/${relation.name}/to/${relation.targetNoteId}`);
                            }

                            this.jsPlumbInstance?.deleteConnection(connection);

                            this.relations = this.relations.filter((relation) => relation.attributeId !== connection.id);
                        }
                    }
                });
            }
        });

        // if there's no event, then this has been triggered programmatically
        if (!originalEvent || !this.jsPlumbInstance) {
            return;
        }

        let name = await dialogService.prompt({
            message: t("relation_map.specify_new_relation_name"),
            shown: ({ $answer }) => {
                if (!$answer) {
                    return;
                }

                $answer.on("keyup", () => {
                    // invalid characters are simply ignored (from user perspective they are not even entered)
                    const attrName = utils.filterAttributeName($answer.val() as string);

                    $answer.val(attrName);
                });

                attributeAutocompleteService.initAttributeNameAutocomplete({
                    $el: $answer,
                    attributeType: "relation",
                    open: true
                });
            }
        });

        if (!name || !name.trim()) {
            this.jsPlumbInstance.deleteConnection(connection);

            return;
        }

        name = utils.filterAttributeName(name);

        const targetNoteId = this.idToNoteId(connection.target.id);
        const sourceNoteId = this.idToNoteId(connection.source.id);

        const relationExists = this.relations?.some((rel) => rel.targetNoteId === targetNoteId && rel.sourceNoteId === sourceNoteId && rel.name === name);

        if (relationExists) {
            await dialogService.info(t("relation_map.connection_exists", { name }));

            this.jsPlumbInstance.deleteConnection(connection);

            return;
        }

        await server.put(`notes/${sourceNoteId}/relations/${name}/to/${targetNoteId}`);

        this.loadNotesAndRelations();
    }

    saveData() {
        this.spacedUpdate.scheduleUpdate();
    }

    async createNoteBox(noteId: string, title: string, x: number, y: number) {
        if (!this.jsPlumbInstance) {
            return;
        }

        this.jsPlumbInstance.getContainer().appendChild($noteBox[0]);

        this.jsPlumbInstance.draggable($noteBox[0], {
            start: (params) => {},
            drag: (params) => {},
            stop: (params) => {
                const noteId = this.idToNoteId(params.el.id);

                const note = this.mapData?.notes.find((note) => note.noteId === noteId);

                if (!note) {
                    logError(t("relation_map.note_not_found", { noteId }));
                    return;
                }

                //@ts-expect-error TODO: Check if this is still valid.
                [note.x, note.y] = params.finalPos;

                this.saveData();
            }
        });

        this.jsPlumbInstance.makeSource($noteBox[0], {
            filter: ".endpoint",
            anchor: "Continuous",
            connectorStyle: { stroke: "#000", strokeWidth: 1 },
            connectionType: "basic",
            extract: {
                action: "the-action"
            }
        });

        this.jsPlumbInstance.makeTarget($noteBox[0], {
            dropOptions: { hoverClass: "dragHover" },
            anchor: "Continuous",
            allowLoopback: true
        });
    }

    async dropNoteOntoRelationMapHandler(ev: JQuery.DropEvent) {
        ev.preventDefault();

        const dragData = ev.originalEvent?.dataTransfer?.getData("text");
        if (!dragData) {
            return;
        }
        const notes = JSON.parse(dragData);

        let { x, y } = this.getMousePosition(ev);

        for (const note of notes) {
            const exists = this.mapData?.notes.some((n) => n.noteId === note.noteId);

            if (exists) {
                toastService.showError(t("relation_map.note_already_in_diagram", { title: note.title }));
                continue;
            }

            this.mapData?.notes.push({ noteId: note.noteId, x, y });

            if (x > 1000) {
                y += 100;
                x = 0;
            } else {
                x += 200;
            }
        }

        this.saveData();

        this.loadNotesAndRelations();
    }

}
