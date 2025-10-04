export function noteIdToId(noteId: string) {
    return `rel-map-note-${noteId}`;
}

export function idToNoteId(id: string) {
    return id.substr(13);
}
