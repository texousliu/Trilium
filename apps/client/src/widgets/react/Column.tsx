import type { ComponentChildren } from "preact";

interface ColumnProps {
    md?: number;
    children: ComponentChildren;
    className?: string;
}

export default function Column({ md, children, className }: ColumnProps) {
    return (
        <div className={`col-md-${md ?? 6} ${className ?? ""}`}>
            {children}
        </div>
    )
}