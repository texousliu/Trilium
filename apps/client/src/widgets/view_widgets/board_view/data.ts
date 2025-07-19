import FBranch from "../../../entities/fbranch";
import FNote from "../../../entities/fnote";

type ColumnMap = Map<string, {
    branch: FBranch;
    note: FNote;
}[]>;

export async function getBoardData(parentNote: FNote, groupByColumn: string) {
    const byColumn: ColumnMap = new Map();

    await recursiveGroupBy(parentNote.getChildBranches(), byColumn, groupByColumn);

    return {
        byColumn
    };
}

async function recursiveGroupBy(branches: FBranch[], byColumn: ColumnMap, groupByColumn: string) {
    for (const branch of branches) {
        const note = await branch.getNote();
        if (!note) {
            continue;
        }

        const group = note.getLabelValue(groupByColumn);
        if (!group) {
            continue;
        }

        if (!byColumn.has(group)) {
            byColumn.set(group, []);
        }
        byColumn.get(group)!.push({
            branch,
            note
        });
    }
}
