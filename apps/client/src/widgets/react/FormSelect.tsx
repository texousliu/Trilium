interface FormSelectProps {
    currentValue?: string;
    onChange(newValue: string): void;
    values: { val: string, title: string }[];
}

export default function FormSelect({ currentValue, values, onChange }: FormSelectProps) {
    return (
        <select
            class="form-select"
            onChange={e => onChange((e.target as HTMLInputElement).value)}
        >
            {values.map(item => {
                return (
                    <option
                        value={item.val}
                        selected={item.val === currentValue}
                    >
                        {item.title}
                    </option>
                );
            })}
        </select>
    )
}