import server from "./server.js";

export async function createNewTask(title: string) {
    await server.post(`tasks`, {
        title
    });
}
