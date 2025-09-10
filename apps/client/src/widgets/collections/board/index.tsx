import { useEffect, useState } from "preact/hooks";
import { ViewModeProps } from "../interface";
import "./index.css";
import { ColumnMap, getBoardData } from "./data";
import { useNoteLabel } from "../../react/hooks";
import FNote from "../../../entities/fnote";
import FBranch from "../../../entities/fbranch";
import Icon from "../../react/Icon";
import { t } from "../../../services/i18n";
import { createNewItem } from "./api";

export interface BoardViewData {
    columns?: BoardColumnData[];
}

export interface BoardColumnData {
    value: string;
}

export default function BoardView({ note: parentNote, noteIds, viewConfig, saveConfig }: ViewModeProps<BoardViewData>) {
    const [ statusAttribute ] = useNoteLabel(parentNote, "board:groupBy");
    const [ byColumn, setByColumn ] = useState<ColumnMap>();
    const [ columns, setColumns ] = useState<string[]>();

    useEffect(() => {
        getBoardData(parentNote, statusAttribute ?? "status", viewConfig ?? {}).then(({ byColumn, newPersistedData }) => {
            setByColumn(byColumn);

            if (newPersistedData) {
                viewConfig = { ...newPersistedData };
                saveConfig(newPersistedData);
            }

            // Use the order from persistedData.columns, then add any new columns found
            const orderedColumns = viewConfig?.columns?.map(col => col.value) || [];
            const allColumns = Array.from(byColumn.keys());
            const newColumns = allColumns.filter(col => !orderedColumns.includes(col));
            setColumns([...orderedColumns, ...newColumns]);
        });
    }, [ parentNote ]);

    return (
        <div className="board-view">
            <div className="board-view-container">
                {byColumn && columns?.map(column => (
                    <Column
                        column={column}
                        columnItems={byColumn.get(column)}
                        parentNote={parentNote}
                    />
                ))}
            </div>
        </div>
    )
}

function Column({ parentNote, column, columnItems }: { parentNote: FNote, column: string, columnItems?: { note: FNote, branch: FBranch }[] }) {
    return (
        <div className="board-column">
            <h3>
                <span>{column}</span>
                <span
                    className="edit-icon icon bx bx-edit-alt"
                    title="Click to edit column title" />
            </h3>

            {(columnItems ?? []).map(({ note, branch }) => (
                <Card note={note} branch={branch} column={column} />
            ))}

            <div className="board-new-item" onClick={() => createNewItem(parentNote, column)}>
                <Icon icon="bx bx-plus" />{" "}
                {t("board_view.new-item")}
            </div>
        </div>
    )
}

function Card({ note }: { note: FNote, branch: FBranch, column: string }) {
    const colorClass = note.getColorClass() || '';

    return (
        <div className={`board-note ${colorClass}`}>
            <span class={`icon ${note.getIcon()}`} />
            {note.title}
        </div>
    )
}
