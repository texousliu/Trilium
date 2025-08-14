interface FormSelectProps<T> {
    currentValue?: string;
    onChange(newValue: string): void;
    values: T[];
    keyProperty: keyof T;
    titleProperty: keyof T; 
}

export default function FormSelect<T>({ currentValue, values, onChange, keyProperty, titleProperty }: FormSelectProps<T>) {
    return (
        <select
            class="form-select"
            onChange={e => onChange((e.target as HTMLInputElement).value)}
        >
            {values.map(item => {
                return (
                    <option
                        value={item[keyProperty] as any}
                        selected={item[keyProperty] === currentValue}
                    >
                        {item[titleProperty] as any}
                    </option>
                );
            })}
        </select>
    )
}