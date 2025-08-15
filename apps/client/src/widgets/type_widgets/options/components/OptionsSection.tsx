import type { ComponentChildren } from "preact";
import { CSSProperties } from "preact/compat";

interface OptionsSectionProps {
    title: string;
    children: ComponentChildren;
    noCard?: boolean;
    style?: CSSProperties;
}

export default function OptionsSection({ title, children, noCard, style }: OptionsSectionProps) {
    return (
        <div className={`options-section ${noCard && "tn-no-card"}`} style={style}>
            <h4>{title}</h4>

            {children}
        </div>
    );
}
