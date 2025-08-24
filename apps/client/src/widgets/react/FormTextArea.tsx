import { TextareaHTMLAttributes } from "preact/compat";

interface FormTextAreaProps extends Omit<TextareaHTMLAttributes, "onBlur" | "onChange"> {
    id?: string;
    currentValue: string;
    onChange?(newValue: string): void;
    onBlur?(newValue: string): void;
    rows: number;
}
export default function FormTextArea({ id, onBlur, onChange, rows, currentValue, className, ...restProps }: FormTextAreaProps) {
    return (
        <textarea
            id={id}
            rows={rows}
            className={`form-control ${className ?? ""}`}
            onChange={(e) => {
                onChange?.(e.currentTarget.value);
            }}
            onBlur={(e) => {
                onBlur?.(e.currentTarget.value);
            }}
            style={{ width: "100%" }}
            {...restProps}
        >{currentValue}</textarea>
    )
}
