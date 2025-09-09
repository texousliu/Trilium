import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ViewModeProps } from "../interface";
import { buildColumnDefinitions } from "./columns";
import getAttributeDefinitionInformation, { buildRowDefinitions, TableData } from "./rows";
import { useLegacyWidget, useNoteLabel, useNoteLabelBoolean, useNoteLabelInt, useSpacedUpdate, useTriliumEvent } from "../../react/hooks";
import Tabulator from "./tabulator";
import { Tabulator as VanillaTabulator, SortModule, FormatModule, InteractionModule, EditModule, ResizeColumnsModule, FrozenColumnsModule, PersistenceModule, MoveColumnsModule, MoveRowsModule, ColumnDefinition, DataTreeModule, Options} from 'tabulator-tables';
import { useContextMenu } from "./context_menu";
import { ParentComponent } from "../../react/react_utils";
import FNote from "../../../entities/fnote";
import { t } from "../../../services/i18n";
import Button from "../../react/Button";
import "./index.css";
import useRowTableEditing from "./row_editing";
import useColTableEditing from "./col_editing";
import AttributeDetailWidget from "../../attribute_widgets/attribute_detail";
import attributes from "../../../services/attributes";
import { RefObject } from "preact";

interface TableConfig {
    tableData?: {
        columns?: ColumnDefinition[];
    };
}

export default function TableView({ note, noteIds, notePath, viewConfig, saveConfig }: ViewModeProps<TableConfig>) {
    const tabulatorRef = useRef<VanillaTabulator>(null);
    const parentComponent = useContext(ParentComponent);

    const [ attributeDetailWidgetEl, attributeDetailWidget ] = useLegacyWidget(() => new AttributeDetailWidget().contentSized());
    const contextMenuEvents = useContextMenu(note, parentComponent, tabulatorRef);
    const persistenceProps = usePersistence(viewConfig, saveConfig);
    const rowEditingEvents = useRowTableEditing(tabulatorRef, attributeDetailWidget, notePath);
    const { newAttributePosition } = useColTableEditing(tabulatorRef, attributeDetailWidget, note);
    const { columnDefs, rowData, movableRows, hasChildren } = useData(note, noteIds, viewConfig, newAttributePosition);
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
            {columnDefs && (
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
                            ...rowEditingEvents
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
            {attributeDetailWidgetEl}
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

function useData(note: FNote, noteIds: string[], viewConfig: TableConfig | undefined, newAttributePosition: RefObject<number | undefined>) {
    const [ maxDepth ] = useNoteLabelInt(note, "maxNestingDepth") ?? -1;

    const [ columnDefs, setColumnDefs ] = useState<ColumnDefinition[]>();
    const [ rowData, setRowData ] = useState<TableData[]>();
    const [ hasChildren, setHasChildren ] = useState<boolean>();
    const [ isSorted ] = useNoteLabelBoolean(note, "sorted");
    const [ movableRows, setMovableRows ] = useState(false);

    function refresh() {
        const info = getAttributeDefinitionInformation(note);
        buildRowDefinitions(note, info, maxDepth).then(({ definitions: rowData, hasSubtree: hasChildren, rowNumber }) => {
            const columnDefs = buildColumnDefinitions({
                info,
                movableRows,
                existingColumnData: viewConfig?.tableData?.columns,
                rowNumberHint: rowNumber,
                position: newAttributePosition.current ?? undefined
            });
            setColumnDefs(columnDefs);
            setRowData(rowData);
            setHasChildren(hasChildren);
        });
    }

    useEffect(refresh, [ note, noteIds, maxDepth, movableRows ]);

    // React to column changes.
    useTriliumEvent("entitiesReloaded", ({ loadResults}) => {
        if (loadResults.getAttributeRows().find(attr =>
            attr.type === "label" &&
            (attr.name?.startsWith("label:") || attr.name?.startsWith("relation:")) &&
            attributes.isAffecting(attr, note))) {
            refresh();
        }
    });

    // Identify if movable rows.
    useEffect(() => {
        setMovableRows(!isSorted && note.type !== "search" && !hasChildren);
    }, [ isSorted, note, hasChildren ]);

    return { columnDefs, rowData, movableRows, hasChildren };
}
