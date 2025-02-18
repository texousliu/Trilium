import becca from "../becca/becca.js";
import BTask from "../becca/entities/btask.js";

export function getTasks() {
    return becca.getTasks();
}

interface CreateTaskParams {
    parentNoteId: string;
    title: string;
    dueDate?: string;
}

export function createNewTask(params: CreateTaskParams) {
    const task = new BTask(params);
    task.save();

    return {
        task
    }
}
