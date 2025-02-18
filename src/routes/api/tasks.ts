import * as tasksService from "../../services/tasks.js";

export function getTasks() {
    return tasksService.getTasks();
}
