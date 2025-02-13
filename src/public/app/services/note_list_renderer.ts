import type FNote from "../entities/fnote.js";
import CalendarView from "../widgets/view_widgets/calendar_view.js";
import ListOrGridView from "../widgets/view_widgets/list_or_grid_view.js";
import type ViewMode from "../widgets/view_widgets/view_mode.js";

export default class NoteListRenderer {

    private viewType: string;
    private viewMode: ViewMode | null;

    constructor($parent: JQuery<HTMLElement>, parentNote: FNote, noteIds: string[], showNotePath: boolean = false) {
        console.log("Parent note is ", parentNote);
        this.viewType = this.#getViewType(parentNote);
        console.log("View type is ", this.viewType);

        if (this.viewType === "list" || this.viewType === "grid") {
            this.viewMode = new ListOrGridView(this.viewType, $parent, parentNote, noteIds, showNotePath);
        } else if (this.viewType === "calendar") {
            this.viewMode = new CalendarView(this.viewType, $parent, parentNote, noteIds, showNotePath);
        } else {
            this.viewMode = null;
        }
    }

    #getViewType(parentNote: FNote): string {
        const viewType = parentNote.getLabelValue("viewType");

        if (!["list", "grid", "calendar"].includes(viewType || "")) {
            // when not explicitly set, decide based on the note type
            return parentNote.type === "search" ? "list" : "grid";
        } else {
            return viewType as string;
        }
    }

    async renderList() {
        if (!this.viewMode) {
            return null;
        }

        return await this.viewMode.renderList();
    }

}
