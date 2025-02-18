import type FNote from "../../entities/fnote.js";
import type FTask from "../../entities/ftask.js";
import froca from "../../services/froca.js";
import TypeWidget from "./type_widget.js";

const TPL = `
<div class="note-detail-task-list note-detail-printable">
    <div class="task-container">
    </div>
</div>
`;

function buildTask(task: FTask) {
    return `<div class="task">${task.title}</div>`;
}

export default class TaskListWidget extends TypeWidget {

    private $taskContainer!: JQuery<HTMLElement>;

    static getType() { return "taskList" }

    doRender() {
        this.$widget = $(TPL);
        this.$taskContainer = this.$widget.find(".task-container");
    }

    async doRefresh(note: FNote) {
        this.$widget.show();

        if (!this.note) {
            return;
        }

        this.$taskContainer.clearQueue();

        const tasks = await froca.getTasks();
        for (const task of tasks) {
            this.$taskContainer.append($(buildTask(task)));
        }
    }

}
