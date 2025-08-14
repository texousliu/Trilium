import type { ComponentChildren } from "preact";

interface OptionsSectionProps {
    title: string;
    children: ComponentChildren;
}

export default function OptionsSection({ title, children }: OptionsSectionProps) {
    return (
        <div className="options-section">
            <h4>{title}</h4>

            {children}
        </div>
    );
}
