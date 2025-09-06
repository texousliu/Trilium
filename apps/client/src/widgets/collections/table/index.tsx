import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { ViewModeProps } from "../interface";
import "./index.css";
import { buildColumnDefinitions } from "./columns";
import getAttributeDefinitionInformation, { buildRowDefinitions, TableData } from "./rows";
import { useNoteLabelInt } from "../../react/hooks";
import { canReorderRows } from "../../view_widgets/table_view/dragging";
import Tabulator from "./tabulator";
import { Tabulator as VanillaTabulator, SortModule, FormatModule, InteractionModule, EditModule, ResizeColumnsModule, FrozenColumnsModule, PersistenceModule, MoveColumnsModule, MoveRowsModule, ColumnDefinition, DataTreeModule} from 'tabulator-tables';
import { useContextMenu } from "./context_menu";
import { ParentComponent } from "../../react/react_utils";
interface TableConfig {
    tableData?: {
        columns?: ColumnDefinition[];
    };
}

export default function TableView({ note, viewConfig }: ViewModeProps<TableConfig>) {
    const [ maxDepth ] = useNoteLabelInt(note, "maxNestingDepth") ?? -1;
    const [ columnDefs, setColumnDefs ] = useState<ColumnDefinition[]>();
    const [ rowData, setRowData ] = useState<TableData[]>();
    const tabulatorRef = useRef<VanillaTabulator>(null);
    const parentComponent = useContext(ParentComponent);

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

    const contextMenuEvents = useContextMenu(note, parentComponent, tabulatorRef);

    return (
        <div className="table-view">
            {columnDefs && (
                <Tabulator
                    tabulatorRef={tabulatorRef}
                    className="table-view-container"
                    columns={columnDefs}
                    data={rowData}
                    modules={[ SortModule, FormatModule, InteractionModule, EditModule, ResizeColumnsModule, FrozenColumnsModule, PersistenceModule, MoveColumnsModule, MoveRowsModule, DataTreeModule ]}
                    {...contextMenuEvents}
                />
            )}
        </div>
    )
}
