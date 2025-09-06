import { useEffect, useState } from "preact/hooks";
import { ViewModeProps } from "../interface";
import "./index.css";
import { buildColumnDefinitions } from "./columns";
import getAttributeDefinitionInformation, { buildRowDefinitions, TableData } from "./rows";
import { useNoteLabelInt } from "../../react/hooks";
import { canReorderRows } from "../../view_widgets/table_view/dragging";
import Tabulator from "./tabulator";
import {SortModule, FormatModule, InteractionModule, EditModule, ResizeColumnsModule, FrozenColumnsModule, PersistenceModule, MoveColumnsModule, MoveRowsModule, ColumnDefinition, DataTreeModule} from 'tabulator-tables';

interface TableConfig {
    tableData?: {
        columns?: ColumnDefinition[];
    };
}

export default function TableView({ note, viewConfig }: ViewModeProps<TableConfig>) {
    const [ maxDepth ] = useNoteLabelInt(note, "maxNestingDepth") ?? -1;
    const [ columnDefs, setColumnDefs ] = useState<ColumnDefinition[]>();
    const [ rowData, setRowData ] = useState<TableData[]>();

    useEffect(() => {
        const info = getAttributeDefinitionInformation(note);
        buildRowDefinitions(note, info, maxDepth).then(({ definitions: rowData, hasSubtree: hasChildren, rowNumber }) => {
            const movableRows = canReorderRows(note) && !hasChildren;
            const columnDefs = buildColumnDefinitions({
                info,
                movableRows,
                existingColumnData: viewConfig?.tableData?.columns,
                rowNumberHint: rowNumber
            });
            setColumnDefs(columnDefs);
            setRowData(rowData);
        });
    }, [ note ]);

    return (
        <div className="table-view">
            {columnDefs && (
                <Tabulator
                    className="table-view-container"
                    columns={columnDefs}
                    data={rowData}
                    modules={[ SortModule, FormatModule, InteractionModule, EditModule, ResizeColumnsModule, FrozenColumnsModule, PersistenceModule, MoveColumnsModule, MoveRowsModule, DataTreeModule ]}
                />
            )}
        </div>
    )
}
