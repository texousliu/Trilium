import type FNote from "../../entities/fnote.js";
import TypeWidget from "./type_widget.js";

const TPL = `
<div class="note-detail-task-list note-detail-printable">
    Task list goes here.
</div>
`;

export default class TaskListWidget extends TypeWidget {

    static getType() { return "taskList" }

    doRender() {
        this.$widget = $(TPL);
    }

    async doRefresh(note: FNote) {
        this.$widget.show();

        if (!this.note) {
            return;
        }
    }

}
