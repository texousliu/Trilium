import FBranch from "../../../entities/fbranch";
import FNote from "../../../entities/fnote";
import { BoardData } from "./config";

type ColumnMap = Map<string, {
    branch: FBranch;
    note: FNote;
}[]>;

export async function getBoardData(parentNote: FNote, groupByColumn: string, persistedData: BoardData) {
    const byColumn: ColumnMap = new Map();

    // Add back existing columns.
    for (const column of persistedData.columns || []) {
        byColumn.set(column.value, []);
    }

    await recursiveGroupBy(parentNote.getChildBranches(), byColumn, groupByColumn);

    let newPersistedData: BoardData | undefined;
    // Check if we have new columns.
    const existingColumns = persistedData.columns?.map(c => c.value) || [];
    for (const column of existingColumns) {
        if (!byColumn.has(column)) {
            byColumn.set(column, []);
        }
    }

    const newColumns = [...byColumn.keys()]
        .filter(column => !existingColumns.includes(column))
        .map(column => ({ value: column }));

    if (newColumns.length > 0) {
        newPersistedData = {
            ...persistedData,
            columns: [...(persistedData.columns || []), ...newColumns]
        };
    }

    return {
        byColumn,
        newPersistedData
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
