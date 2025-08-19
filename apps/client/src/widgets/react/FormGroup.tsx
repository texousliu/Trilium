import { cloneElement, ComponentChildren, RefObject, VNode } from "preact";
import { CSSProperties } from "preact/compat";
import { useUniqueName } from "./hooks";

interface FormGroupProps {
    name: string;
    labelRef?: RefObject<HTMLLabelElement>;
    label?: string;
    title?: string;
    className?: string;
    children: VNode<any>;
    description?: string | ComponentChildren;
    disabled?: boolean;
    style?: CSSProperties;
}

export default function FormGroup({ name, label, title, className, children, description, labelRef, disabled, style }: FormGroupProps) {
    const id = useUniqueName(name);
    const childWithId = cloneElement(children, { id });

    return (
        <div className={`form-group ${className} ${disabled ? "disabled" : ""}`} title={title} style={style}>
            { label &&
            <label style={{ width: "100%" }} ref={labelRef} htmlFor={id}>{label}</label>}

            {childWithId}

            {description && <small className="form-text">{description}</small>}
        </div>
    );
}