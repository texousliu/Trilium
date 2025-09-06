import { useEffect, useRef } from "preact/hooks";
import { ColumnDefinition, Tabulator as VanillaTabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.css";
import "../../../../src/stylesheets/table.css";

interface TableProps<T> {
    className?: string;
    columns: ColumnDefinition[];
    data?: T[];
}

export default function Tabulator<T>({ className, columns, data }: TableProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const tabulatorRef = useRef<VanillaTabulator>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const tabulator = new VanillaTabulator(containerRef.current, {
            columns,
            data
        });

        tabulatorRef.current = tabulator;

        return () => tabulator.destroy();
    }, []);

    return (
        <div ref={containerRef} className={className} />
    );
}
