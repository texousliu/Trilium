import "./RadioWithIllustration.css";

import { ComponentChild } from "preact";

interface RadioWithIllustrationProps {
    values: {
        key: string;
        text: string;
        illustration: ComponentChild;
    }[];
    currentValue: string;
    onChange(newValue: string);
}

export default function RadioWithIllustration({ values }: RadioWithIllustrationProps) {
    return (
        <ul className="radio-with-illustration">
            {values.map(value => (
                <li key={value.key}>
                    <figure>
                        {value.illustration}
                        <figcaption>{value.text}</figcaption>
                    </figure>
                </li>
            ))}
        </ul>
    );
}
