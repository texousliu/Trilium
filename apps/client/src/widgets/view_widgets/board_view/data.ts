import FNote from "../../../entities/fnote";
import froca from "../../../services/froca";

export async function getBoardData(noteIds: string[], groupByColumn: string) {
    const notes = await froca.getNotes(noteIds);
    const byColumn: Map<string, FNote[]> = new Map();

    for (const note of notes) {
        const group = note.getLabelValue(groupByColumn);
        if (!group) {
            continue;
        }

        if (!byColumn.has(group)) {
            byColumn.set(group, []);
        }
        byColumn.get(group)!.push(note);
    }

    return {
        byColumn
    };
}
