import { ComponentChildren, HTMLAttributes, JSX, render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

interface ShadowDomProps extends HTMLAttributes<HTMLDivElement> {
    children: ComponentChildren;
}

export default function ShadowDom({ children, ...containerProps }: ShadowDomProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [ shadowRoot, setShadowRoot ] = useState<ShadowRoot | null>(null);

    // Create the shadow root.
    useEffect(() => {
        if (!containerRef.current || shadowRoot) return;
        const shadow = containerRef.current.attachShadow({ mode: "open" });
        setShadowRoot(shadow);
    }, [ shadowRoot ]);

    // Render the child elements.
    useEffect(() => {
        if (!shadowRoot) return;
        render(<>{children}</>, shadowRoot);
    }, [ shadowRoot, children ]);

    return <div ref={containerRef} {...containerProps} />
}
