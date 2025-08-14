import { ComponentChildren } from "preact";

interface OptionsRowProps {
    label: string;
    children: ComponentChildren;
}

export default function OptionsRow({ label, children }: OptionsRowProps) {
    return (
        <div className="option-row">
            <label>{label}</label>
            {children}
        </div>
    );
}