import { useEffect, useLayoutEffect, useRef } from "preact/hooks";
import { ColumnDefinition, EventCallBackMethods, Module, Tabulator as VanillaTabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.css";
import "../../../../src/stylesheets/table.css";
import { RefObject } from "preact";

interface TableProps<T> extends Partial<EventCallBackMethods> {
    tabulatorRef: RefObject<VanillaTabulator>;
    className?: string;
    columns: ColumnDefinition[];
    data?: T[];
    modules?: (new (table: VanillaTabulator) => Module)[];
}

export default function Tabulator<T>({ className, columns, data, modules, tabulatorRef: externalTabulatorRef, ...events }: TableProps<T>) {
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
            data
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

    return (
        <div ref={containerRef} className={className} />
    );
}
