import { ComponentChildren } from "preact";

interface AlertProps {
    type: "info" | "danger" | "warning";
    title?: string;
    children: ComponentChildren;
    className?: string;
}

export default function Alert({ title, type, children, className }: AlertProps) {
    return (
        <div className={`alert alert-${type} ${className ?? ""}`}>
            {title && <h4>{title}</h4>}

            {children}
        </div>
    );
}