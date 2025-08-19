interface FormTextAreaProps {
    currentValue: string;
    onBlur?(newValue: string): void;
    rows: number;
}
export default function FormTextArea({ onBlur, rows, currentValue }: FormTextAreaProps) {
    return (
        <textarea
            rows={rows}
            onBlur={(e) => {
                onBlur?.(e.currentTarget.value);
            }}
        >{currentValue}</textarea>
    )
}
