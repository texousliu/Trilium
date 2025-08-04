import { HTMLInputTypeAttribute } from "preact/compat";

interface FormTextBoxProps {
    id?: string;
    name: string;
    type?: HTMLInputTypeAttribute;
    currentValue?: string;
    className?: string;
    autoComplete?: string;
    onChange?(newValue: string): void;
}

export default function FormTextBox({ id, type, name, className, currentValue, onChange, autoComplete }: FormTextBoxProps) {
    return (
        <input
            type={type ?? "text"}
            className={`form-control ${className}`}
            id={id}
            name={name}
            value={currentValue}
            autoComplete={autoComplete}
            onInput={e => onChange?.(e.currentTarget.value)} />
    );
}