import type FNote from "../../entities/fnote.js";
import type FTask from "../../entities/ftask.js";
import froca from "../../services/froca.js";
import TypeWidget from "./type_widget.js";

const TPL = `
<div class="note-detail-task-list note-detail-printable">

    <header>
        <input type="text" placeholder="Add a new task" class="add-new-task" />
    </header>

    <div class="task-container">
    </div>

    <style>
        .note-detail-task-list {
            padding: 10px;
        }

        .note-detail-task-list header {
            margin-bottom: 1em;
        }

        .note-detail-task-list .add-new-task {
            width: 100%;
            padding: 0.25em 0.5em;
        }
    </style>
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
