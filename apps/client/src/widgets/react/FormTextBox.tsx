interface FormTextBoxProps {
    name: string;
    currentValue?: string;
    className?: string;
    onChange?(newValue: string): void;
}

export default function FormTextBox({ name, className, currentValue, onChange }: FormTextBoxProps) {
    return (
        <input
            type="text"
            className={`form-control ${className}`}
            name={name}
            value={currentValue}
            onInput={e => onChange?.(e.currentTarget.value)} />
    );
}