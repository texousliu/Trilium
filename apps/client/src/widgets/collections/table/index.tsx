import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ViewModeProps } from "../interface";
import { buildColumnDefinitions } from "./columns";
import getAttributeDefinitionInformation, { buildRowDefinitions, TableData } from "./rows";
import { useNoteLabelInt, useSpacedUpdate } from "../../react/hooks";
import { canReorderRows } from "../../view_widgets/table_view/dragging";
import Tabulator from "./tabulator";
import { Tabulator as VanillaTabulator, SortModule, FormatModule, InteractionModule, EditModule, ResizeColumnsModule, FrozenColumnsModule, PersistenceModule, MoveColumnsModule, MoveRowsModule, ColumnDefinition, DataTreeModule, Options} from 'tabulator-tables';
import { useContextMenu } from "./context_menu";
import { ParentComponent } from "../../react/react_utils";
import FNote from "../../../entities/fnote";
import { t } from "../../../services/i18n";
import Button from "../../react/Button";
import "./index.css";
import useTableEditing from "./editing";

interface TableConfig {
    tableData?: {
        columns?: ColumnDefinition[];
    };
}

export default function TableView({ note, noteIds, notePath, viewConfig, saveConfig }: ViewModeProps<TableConfig>) {
    const [ maxDepth ] = useNoteLabelInt(note, "maxNestingDepth") ?? -1;
    const [ columnDefs, setColumnDefs ] = useState<ColumnDefinition[]>();
    const [ rowData, setRowData ] = useState<TableData[]>();
    const [ movableRows, setMovableRows ] = useState<boolean>();
    const [ hasChildren, setHasChildren ] = useState<boolean>();
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
            setMovableRows(movableRows);
            setHasChildren(hasChildren);
        });
    }, [ note, noteIds ]);

    const contextMenuEvents = useContextMenu(note, parentComponent, tabulatorRef);
    const persistenceProps = usePersistence(viewConfig, saveConfig);
    const editingEvents = useTableEditing(tabulatorRef, notePath);
    const dataTreeProps = useMemo<Options>(() => {
        if (!hasChildren) return {};
        return {
            dataTree: true,
            dataTreeStartExpanded: true,
            dataTreeBranchElement: false,
            dataTreeElementColumn: "title",
            dataTreeChildIndent: 20,
            dataTreeExpandElement: `<button class="tree-expand"><span class="bx bx-chevron-right"></span></button>`,
            dataTreeCollapseElement: `<button class="tree-collapse"><span class="bx bx-chevron-down"></span></button>`
        }
    }, [ hasChildren ]);

    return (
        <div className="table-view">
            {viewConfig && columnDefs && (
                <>
                    <Tabulator
                        tabulatorRef={tabulatorRef}
                        className="table-view-container"
                        columns={columnDefs}
                        data={rowData}
                        modules={[ SortModule, FormatModule, InteractionModule, EditModule, ResizeColumnsModule, FrozenColumnsModule, PersistenceModule, MoveColumnsModule, MoveRowsModule, DataTreeModule ]}
                        footerElement={<TableFooter note={note} />}
                        events={{
                            ...contextMenuEvents,
                            ...editingEvents
                        }}
                        persistence {...persistenceProps}
                        layout="fitDataFill"
                        index="branchId"
                        movableColumns
                        movableRows={movableRows}

                        {...dataTreeProps}
                    />
                    <TableFooter note={note} />
                </>
            )}
        </div>
    )
}

function TableFooter({ note }: { note: FNote }) {
    return (note.type !== "search" &&
        <div className="tabulator-footer">
            <div className="tabulator-footer-contents">
                <Button triggerCommand="addNewRow" icon="bx bx-plus" text={t("table_view.new-row")} />
                {" "}
                <Button triggerCommand="addNewTableColumn" icon="bx bx-carousel" text={t("table_view.new-column")} />
            </div>
        </div>
    )
}

function usePersistence(initialConfig: TableConfig | null | undefined, saveConfig: (newConfig: TableConfig) => void) {
    const config = useRef<TableConfig | null | undefined>(initialConfig);
    const spacedUpdate = useSpacedUpdate(() => {
        if (config.current) {
            saveConfig(config.current);
        }
    }, 5_000);
    const persistenceWriterFunc = useCallback((_id, type: string, data: object) => {
        if (!config.current) config.current = {};
        if (!config.current.tableData) config.current.tableData = {};
        (config.current.tableData as Record<string, {}>)[type] = data;
        spacedUpdate.scheduleUpdate();
    }, []);
    const persistenceReaderFunc = useCallback((_id, type: string) => {
        return config.current?.tableData?.[type];
    }, []);
    return { persistenceReaderFunc, persistenceWriterFunc };
}
