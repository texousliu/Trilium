interface FormCheckboxProps {
    name: string;
    label: string;
    currentValue?: boolean;
    onChange(newValue: boolean): void;
}

export default function FormCheckbox({ name, label, currentValue, onChange }: FormCheckboxProps) {
    return (
        <div className="form-check">
            <label className="form-check-label tn-checkbox">
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