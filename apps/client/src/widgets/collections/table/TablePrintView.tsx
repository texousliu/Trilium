import { useRef, useState } from "preact/hooks";
import { ViewModeProps } from "../interface";
import useData, { TableConfig } from "./data";
import { ExportModule, PrintModule, Tabulator as VanillaTabulator} from 'tabulator-tables';
import Tabulator from "./tabulator";
import { RawHtmlBlock } from "../../react/RawHtml";

export default function TablePrintView({ note, noteIds, viewConfig }: ViewModeProps<TableConfig>) {
    const tabulatorRef = useRef<VanillaTabulator>(null);
    const { columnDefs, rowData, movableRows, hasChildren } = useData(note, noteIds, viewConfig, undefined, () => {});
    const [ html, setHtml ] = useState<string>();

    return rowData && (
        <div className="table-print-view">
            {!html ? (
                <Tabulator
                    tabulatorRef={tabulatorRef}
                    className="table-print-view-container"
                    modules={[ PrintModule, ExportModule ]}
                    columns={columnDefs ?? []}
                    data={rowData}
                    index="branchId"
                    dataTree={hasChildren}
                    printAsHtml={true}
                    printStyled={true}
                    onReady={() => {
                        const tabulator = tabulatorRef.current;
                        if (!tabulator) return;
                        setHtml(tabulator.getHtml());
                    }}
                />
            ) : (
                <RawHtmlBlock html={html} />
            )}
        </div>

    )
}
