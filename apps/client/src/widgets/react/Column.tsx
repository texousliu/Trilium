import type { ComponentChildren } from "preact";

interface ColumnProps {
    md: number;
    children: ComponentChildren;
}

export default function Column({ md, children }: ColumnProps) {
    return (
        <div className={`col-md-${md}`}>
            {children}
        </div>
    )
}