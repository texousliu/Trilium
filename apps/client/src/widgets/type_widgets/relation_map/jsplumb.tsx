import { jsPlumb, Defaults, jsPlumbInstance, DragOptions } from "jsplumb";
import { ComponentChildren, createContext, RefObject } from "preact";
import { HTMLProps } from "preact/compat";
import { useContext, useEffect, useRef } from "preact/hooks";

const JsPlumbInstance = createContext<RefObject<jsPlumbInstance> | undefined>(undefined);

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
            <JsPlumbInstance.Provider value={apiRef}>
                {children}
            </JsPlumbInstance.Provider>
        </div>
    )
}

export function JsPlumbItem({ x, y, children, draggable, sourceConfig, targetConfig, ...restProps }: {
    x: number;
    y: number;
    children: ComponentChildren;
    draggable?: DragOptions;
    sourceConfig?: object;
    targetConfig?: object;
} & Pick<HTMLProps<HTMLDivElement>, "id" | "className" | "onContextMenu">) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useContext(JsPlumbInstance);

    useEffect(() => {
        if (!draggable || !apiRef?.current || !containerRef.current) return;
        apiRef.current.draggable(containerRef.current, draggable);
    }, [ draggable ]);

    useEffect(() => {
        if (!sourceConfig || !apiRef?.current || !containerRef.current) return;
        apiRef.current.makeSource(containerRef.current, sourceConfig);
    }, [ sourceConfig ]);

    useEffect(() => {
        if (!targetConfig || !apiRef?.current || !containerRef.current) return;
        apiRef.current.makeTarget(containerRef.current, targetConfig);
    }, [ targetConfig ]);

    return (
        <div
            ref={containerRef}
            {...restProps}
            style={{ left: x, top: y }}
        >
            {children}
        </div>
    )
}
