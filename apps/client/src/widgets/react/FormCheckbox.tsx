interface FormCheckboxProps {
    name: string;
    label: string;
    /**
     * If set, the checkbox label will be underlined and dotted, indicating a hint. When hovered, it will show the hint text.
     */
    hint?: string;
    currentValue: boolean;
    onChange(newValue: boolean): void;
}

export default function FormCheckbox({ name, label, currentValue, onChange, hint }: FormCheckboxProps) {
    return (
        <div className="form-check">
            <label
                className="form-check-label tn-checkbox"
                style={hint && { textDecoration: "underline dotted var(--main-text-color)" }} title={hint}>
                <input
                    className="form-check-input"
                    type="checkbox"
                    name={name}
                    checked={currentValue || false}
                    value="1"
                    onChange={e => onChange((e.target as HTMLInputElement).checked)} />
                {label}
            </label>
        </div>
    );
}