import { HTMLInputTypeAttribute, RefObject } from "preact/compat";

interface FormTextBoxProps {
    id?: string;
    name: string;
    type?: HTMLInputTypeAttribute;
    currentValue?: string;
    className?: string;
    autoComplete?: string;
    onChange?(newValue: string): void;
    inputRef?: RefObject<HTMLInputElement>;
}

export default function FormTextBox({ id, type, name, className, currentValue, onChange, autoComplete, inputRef }: FormTextBoxProps) {
    return (
        <input
            ref={inputRef}
            type={type ?? "text"}
            className={`form-control ${className ?? ""}`}
            id={id}
            name={name}
            value={currentValue}
            autoComplete={autoComplete}
            onInput={e => onChange?.(e.currentTarget.value)} />
    );
}