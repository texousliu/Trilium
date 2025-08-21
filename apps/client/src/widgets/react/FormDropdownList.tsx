import Dropdown from "./Dropdown";
import { FormListItem } from "./FormList";

interface FormDropdownList<T> {
    values: T[];
    keyProperty: keyof T;
    titleProperty: keyof T;
    descriptionProperty?: keyof T;
    currentValue: string;
    onChange(newValue: string): void;
}

export default function FormDropdownList<T>({ values, keyProperty, titleProperty, descriptionProperty, currentValue, onChange }: FormDropdownList<T>) {
    const currentValueData = values.find(value => value[keyProperty] === currentValue);

    return (
        <Dropdown text={currentValueData?.[titleProperty] ?? ""}>
            {values.map(item => (
                <FormListItem
                    onClick={() => onChange(item[keyProperty] as string)}
                    checked={currentValue === item[keyProperty]}
                    description={descriptionProperty && item[descriptionProperty] as string}
                    selected={currentValue === item[keyProperty]}
                >
                    {item[titleProperty] as string}
                </FormListItem>
            ))}
        </Dropdown>
    )
}