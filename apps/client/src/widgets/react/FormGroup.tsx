import { ComponentChildren } from "preact";

interface FormGroupProps {
    label: string;
    title?: string;
    className?: string;
    children: ComponentChildren;
    description?: string;
}

export default function FormGroup({ label, title, className, children, description }: FormGroupProps) {
    return (
        <div className={`form-group ${className}`} title={title}>
            <label style={{ width: "100%" }}>
                {label}
                {children}
            </label>

            {description && <small className="form-text text-muted">{description}</small>}
        </div>
    );
}