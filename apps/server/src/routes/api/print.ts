import { Request } from "express";

export function getPrintablePage(req: Request) {
    const { noteId } = req.params;

    return "Hello world: " + noteId;
}
