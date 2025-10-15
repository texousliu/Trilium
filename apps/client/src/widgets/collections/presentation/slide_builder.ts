import FNote from "../../../entities/fnote";

export async function buildPresentation(parentNote: FNote) {
    const slides = await parentNote.getChildNotes();
    const rootElement = new DocumentFragment();

    for (const slide of slides) {
        const slideEl = document.createElement("div");

    }

    return rootElement;
}
