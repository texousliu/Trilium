import type { InputHTMLAttributes, RefObject } from "preact/compat";
import FormText from "./FormText";

interface FormTextBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    id?: string;
    currentValue?: string;
    onChange?(newValue: string): void;
    inputRef?: RefObject<HTMLInputElement>;
}

export default function FormTextBox({ inputRef, className, type, currentValue, onChange, ...rest}: FormTextBoxProps) {
    return (
        <input
            ref={inputRef}
            className={`form-control ${className ?? ""}`}
            type={type ?? "text"}
            value={currentValue}
            onInput={e => onChange?.(e.currentTarget.value)}
            {...rest}
        />
    );
}

export function FormTextBoxWithUnit(props: FormTextBoxProps & { unit: string }) {
    return (
        <label class="input-group tn-number-unit-pair">
            <FormTextBox {...props} />
            <span class="input-group-text">{props.unit}</span>
        </label>        
    )
}