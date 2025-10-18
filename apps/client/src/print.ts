import FNote from "./entities/fnote";

async function main() {
    const noteId = window.location.pathname.split("/")[2];
    const froca = (await import("./services/froca")).default;
    const note = await froca.getNote(noteId);

    if (!note) return;

    if (note.type === "book") {
        handleCollection(note);
    }
}

function handleCollection(note: FNote) {
    console.log("Rendering collection.");
}

main();
