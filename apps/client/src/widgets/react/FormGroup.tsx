import { ComponentChildren } from "preact";

interface FormGroupProps {
    label: string;
    children: ComponentChildren;
}

export default function FormGroup({ label, children }: FormGroupProps) {
    return (
        <div className="form-group">
            <label style={{ width: "100%" }}>
                {label}
                {children}
            </label>
        </div>
    );
}