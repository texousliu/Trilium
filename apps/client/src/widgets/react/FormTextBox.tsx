interface FormTextBoxProps {
    name: string;
    label: string;
    currentValue?: string;
    className?: string;
    description?: string;
    onChange?(newValue: string): void;
}

export default function FormTextBox({ name, label, description, className, currentValue, onChange }: FormTextBoxProps) {
    return (
        <div className={className}>
            <label>
                {label}
                <input
                    type="text"
                    className="form-control"
                    name={name}
                    value={currentValue}
                    onInput={e => onChange?.(e.currentTarget.value)} />
                {description && <small className="form-text text-muted">{description}</small>}
            </label>
        </div>
    );
}