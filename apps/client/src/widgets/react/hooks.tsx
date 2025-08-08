import { useContext, useEffect, useState } from "preact/hooks";
import { EventData, EventNames } from "../../components/app_context";
import { ParentComponent } from "./ReactBasicWidget";

export default function useTriliumEvent<T extends EventNames>(eventName: T, handler: (data: EventData<T>) => void) {
    const parentWidget = useContext(ParentComponent);
    useEffect(() => {
        if (!parentWidget) {
            console.warn("useTriliumEvent: No widget context found");
            return;
        }

        // Create a unique handler name for this specific event listener
        const handlerName = `${eventName}Event`;
        const originalHandler = parentWidget[handlerName];

        // Override the event handler to call our handler
        parentWidget[handlerName] = async function(data: EventData<T>) {
            // Call original handler if it exists
            if (originalHandler) {
                await originalHandler.call(parentWidget, data);
            }
            // Call our React component's handler
            handler(data);
        };

        // Cleanup: restore original handler on unmount
        return () => {
            parentWidget[handlerName] = originalHandler;
        };
    }, [parentWidget]);
}