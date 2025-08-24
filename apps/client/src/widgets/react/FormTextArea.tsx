interface FormTextAreaProps {
    id?: string;
    currentValue: string;
    onBlur?(newValue: string): void;
    rows: number;
    className?: string;
    placeholder?: string;
}
export default function FormTextArea({ id, onBlur, rows, currentValue, className, placeholder }: FormTextAreaProps) {
    return (
        <textarea
            id={id}
            rows={rows}
            className={`form-control ${className ?? ""}`}
            onBlur={(e) => {
                onBlur?.(e.currentTarget.value);
            }}
            style={{ width: "100%" }}
            placeholder={placeholder}
        >{currentValue}</textarea>
    )
}
