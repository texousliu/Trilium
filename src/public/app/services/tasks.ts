import server from "./server.js";

export async function createNewTask(title: string) {
    await server.post(`tasks`, {
        title
    });
}

export async function toggleTaskDone(taskId: string) {
    await server.post(`tasks/${taskId}/toggle`);
}
