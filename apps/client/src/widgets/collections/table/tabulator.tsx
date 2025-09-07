import { useContext, useEffect, useLayoutEffect, useRef } from "preact/hooks";
import { ColumnDefinition, EventCallBackMethods, Module, Options, Tabulator as VanillaTabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.css";
import "../../../../src/stylesheets/table.css";
import { ComponentChildren, RefObject } from "preact";
import { ParentComponent, renderReactWidget } from "../../react/react_utils";

interface TableProps<T> extends Partial<EventCallBackMethods>, Pick<Options, "persistence" | "persistenceReaderFunc" | "persistenceWriterFunc"> {
    tabulatorRef: RefObject<VanillaTabulator>;
    className?: string;
    columns: ColumnDefinition[];
    data?: T[];
    modules?: (new (table: VanillaTabulator) => Module)[];
    footerElement?: ComponentChildren;
}

export default function Tabulator<T>({ className, columns, data, modules, tabulatorRef: externalTabulatorRef, footerElement, persistence, persistenceReaderFunc, persistenceWriterFunc, ...events }: TableProps<T>) {
    const parentComponent = useContext(ParentComponent);
    const containerRef = useRef<HTMLDivElement>(null);
    const tabulatorRef = useRef<VanillaTabulator>(null);

    useLayoutEffect(() => {
        if (!modules) return;
        for (const module of modules) {
            VanillaTabulator.registerModule(module);
        }
    }, [modules]);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const tabulator = new VanillaTabulator(containerRef.current, {
            columns,
            data,
            footerElement: (parentComponent && footerElement ? renderReactWidget(parentComponent, footerElement)[0] : undefined),
            persistence, persistenceReaderFunc, persistenceWriterFunc
        });

        tabulatorRef.current = tabulator;
        externalTabulatorRef.current = tabulator;

        return () => tabulator.destroy();
    }, []);

    useEffect(() => {
        const tabulator = tabulatorRef.current;
        if (!tabulator) return;

        for (const [ eventName, handler ] of Object.entries(events)) {
            tabulator.on(eventName as keyof EventCallBackMethods, handler);
        }

        return () => {
            for (const [ eventName, handler ] of Object.entries(events)) {
                tabulator.off(eventName as keyof EventCallBackMethods, handler);
            }
        }
    }, Object.values(events));

    // Change in data.
    useEffect(() => { tabulatorRef.current?.setData(data) }, [ data ]);

    return (
        <div ref={containerRef} className={className} />
    );
}
