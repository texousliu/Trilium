import type { Request } from "express";
import * as tasksService from "../../services/tasks.js";

export function getTasks() {
    return tasksService.getTasks();
}

export function createNewTask(req: Request) {
    return tasksService.createNewTask(req.body);
}
