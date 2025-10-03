import { jsPlumb, Defaults, jsPlumbInstance } from "jsplumb";
import { ComponentChildren, RefObject } from "preact";
import { HTMLProps } from "preact/compat";
import { useEffect, useRef } from "preact/hooks";

export function JsPlumb({ className, props, children, containerRef: externalContainerRef, apiRef, onInstanceCreated }: {
    className?: string;
    props: Omit<Defaults, "container">;
    children: ComponentChildren;
    containerRef?: RefObject<HTMLElement>;
    apiRef?: RefObject<jsPlumbInstance>;
    onInstanceCreated?: (jsPlumbInstance: jsPlumbInstance) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        if (externalContainerRef) {
            externalContainerRef.current = containerRef.current;
        }

        const jsPlumbInstance = jsPlumb.getInstance({
            Container: containerRef.current,
            ...props
        });
        if (apiRef) {
            apiRef.current = jsPlumbInstance;
        }

        onInstanceCreated?.(jsPlumbInstance);
        return () => {
            jsPlumbInstance.deleteEveryEndpoint();
            jsPlumbInstance.cleanupListeners()
        };
    }, [ apiRef ]);

    return (
        <div ref={containerRef} className={className}>
            {children}
        </div>
    )
}

export function JsPlumbItem({ x, y, children, ...restProps }: {
    x: number;
    y: number;
    children: ComponentChildren;
} & Pick<HTMLProps<HTMLDivElement>, "className" | "onContextMenu">) {
    return (
        <div
            {...restProps}
            style={{ left: x, top: y }}
        >
            {children}
        </div>
    )
}
