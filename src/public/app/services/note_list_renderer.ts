import type FNote from "../entities/fnote.js";
import ListOrGridView from "../widgets/view_widgets/list_or_grid_view.js";
import type ViewMode from "../widgets/view_widgets/view_mode.js";

export default class NoteListRenderer {

    private viewMode: ViewMode;

    constructor($parent: JQuery<HTMLElement>, parentNote: FNote, noteIds: string[], showNotePath: boolean = false) {
        this.viewMode = new ListOrGridView($parent, parentNote, noteIds, showNotePath);
    }

    async renderList() {
        return await this.viewMode.renderList();
    }

}
