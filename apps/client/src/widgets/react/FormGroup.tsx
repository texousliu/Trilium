import { ComponentChildren, RefObject } from "preact";

interface FormGroupProps {
    labelRef?: RefObject<HTMLLabelElement>;
    label: string;
    title?: string;
    className?: string;
    children: ComponentChildren;
    description?: string;
}

export default function FormGroup({ label, title, className, children, description, labelRef }: FormGroupProps) {
    return (
        <div className={`form-group ${className}`} title={title}>
            <label style={{ width: "100%" }} ref={labelRef}>
                {label}
                {children}
            </label>

            {description && <small className="form-text text-muted">{description}</small>}
        </div>
    );
}