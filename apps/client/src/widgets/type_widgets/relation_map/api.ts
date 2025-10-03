import FNote from "../../../entities/fnote";
import { t } from "../../../services/i18n";
import server from "../../../services/server";
import utils from "../../../services/utils";

export interface MapDataNoteEntry {
    noteId: string;
    x: number;
    y: number;
}

export interface MapData {
    notes: MapDataNoteEntry[];
    transform: PanZoomTransform;
}

const DELTA = 0.0001;

export default class RelationMapApi {

    private data: MapData;
    private relations: any[];
    private onDataChange: (refreshUi: boolean) => void;

    constructor(note: FNote, initialMapData: MapData, onDataChange: (newData: MapData, refreshUi: boolean) => void) {
        this.data = initialMapData;
        this.onDataChange = (refreshUi) => onDataChange({ ...this.data }, refreshUi);
    }

    createItem(newNote: MapDataNoteEntry) {
        this.data.notes.push(newNote);
        this.onDataChange(true);
    }

    async removeItem(noteId: string, deleteNoteToo: boolean) {
        console.log("Remove ", noteId, deleteNoteToo);
        if (deleteNoteToo) {
            const taskId = utils.randomString(10);
            await server.remove(`notes/${noteId}?taskId=${taskId}&last=true`);
        }

        if (this.data) {
            this.data.notes = this.data.notes.filter((note) => note.noteId !== noteId);
        }

        if (this.relations) {
            this.relations = this.relations.filter((relation) => relation.sourceNoteId !== noteId && relation.targetNoteId !== noteId);
        }

        this.onDataChange(true);
    }

    cleanupOtherNotes(noteIds: string[]) {
        const filteredNotes = this.data.notes.filter((note) => noteIds.includes(note.noteId));
        if (filteredNotes.length === this.data.notes.length) return;
        this.data.notes = filteredNotes;
        this.onDataChange(true);
    }

    setTransform(transform: PanZoomTransform) {
        if (this.data.transform.scale - transform.scale > DELTA
            || this.data.transform.x - transform.x > DELTA
            || this.data.transform.y - transform.y > DELTA) {
            this.data.transform = { ...transform };
            this.onDataChange(false);
        }
    }

    moveNote(noteId: string, x: number, y: number) {
        const note = this.data?.notes.find((note) => note.noteId === noteId);

        if (!note) {
            logError(t("relation_map.note_not_found", { noteId }));
            return;
        }

        note.x = x;
        note.y = y;
        this.onDataChange(false);
    }

}
