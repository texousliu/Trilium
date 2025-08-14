import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { EventData, EventNames } from "../../components/app_context";
import { ParentComponent } from "./ReactBasicWidget";
import SpacedUpdate from "../../services/spaced_update";
import { OptionNames } from "@triliumnext/commons";
import options from "../../services/options";
import utils, { reloadFrontendApp } from "../../services/utils";
import Component from "../../components/component";

type TriliumEventHandler<T extends EventNames> = (data: EventData<T>) => void;
const registeredHandlers: Map<Component, Map<EventNames, TriliumEventHandler<any>[]>> = new Map();

/**
 * Allows a React component to react to Trilium events (e.g. `entitiesReloaded`). When the desired event is triggered, the handler is invoked with the event parameters.
 * 
 * Under the hood, it works by altering the parent (Trilium) component of the React element to introduce the corresponding event.
 * 
 * @param eventName the name of the Trilium event to listen for.
 * @param handler the handler to be invoked when the event is triggered.
 * @param enabled determines whether the event should be listened to or not. Useful to conditionally limit the listener based on a state (e.g. a modal being displayed).
 */
export default function useTriliumEvent<T extends EventNames>(eventName: T, handler: TriliumEventHandler<T>, enabled = true) {
    const parentWidget = useContext(ParentComponent);
    if (!parentWidget) {
        return;
    }
    
    const handlerName = `${eventName}Event`;
    const customHandler  = useMemo(() => {
        return async (data: EventData<T>) => {
            // Inform the attached event listeners.
            const eventHandlers = registeredHandlers.get(parentWidget)?.get(eventName) ?? [];
            for (const eventHandler of eventHandlers) {
                eventHandler(data);
            }
        }
    }, [ eventName, parentWidget ]);    

    useEffect(() => {
        // Attach to the list of handlers.
        let handlersByWidget = registeredHandlers.get(parentWidget);
        if (!handlersByWidget) {
            handlersByWidget = new Map();
            registeredHandlers.set(parentWidget, handlersByWidget);
        }

        let handlersByWidgetAndEventName = handlersByWidget.get(eventName);
        if (!handlersByWidgetAndEventName) {
            handlersByWidgetAndEventName = [];
            handlersByWidget.set(eventName, handlersByWidgetAndEventName);
        }

        if (!handlersByWidgetAndEventName.includes(handler)) {
            handlersByWidgetAndEventName.push(handler);
        }

        // Apply the custom event handler.
        if (parentWidget[handlerName] && parentWidget[handlerName] !== customHandler) {
            console.warn(`Widget ${parentWidget.componentId} already had an event listener and it was replaced by the React one.`);
        }
        
        parentWidget[handlerName] = customHandler;
    
        return () => {
            const eventHandlers = registeredHandlers.get(parentWidget)?.get(eventName);
            if (!eventHandlers || !eventHandlers.includes(handler)) {
                return;
            }
    
            // Remove the event handler from the array.
            const newEventHandlers = eventHandlers.filter(e => e !== handler);
            registeredHandlers.get(parentWidget)?.set(eventName, newEventHandlers);        
        };
    }, [ eventName, parentWidget, handler ]);
}

export function useSpacedUpdate(callback: () => Promise<void>, interval = 1000) {
    const callbackRef = useRef(callback);
    const spacedUpdateRef = useRef<SpacedUpdate>();

    // Update callback ref when it changes
    useEffect(() => {
        callbackRef.current = callback;
    });

    // Create SpacedUpdate instance only once
    if (!spacedUpdateRef.current) {
        spacedUpdateRef.current = new SpacedUpdate(
            () => callbackRef.current(),
            interval
        );
    }

    // Update interval if it changes
    useEffect(() => {
        spacedUpdateRef.current?.setUpdateInterval(interval);
    }, [interval]);

    return spacedUpdateRef.current;
}

export function useTriliumOption(name: OptionNames, needsRefresh?: boolean): [string, (newValue: string) => Promise<void>] {
    const initialValue = options.get(name);
    const [ value, setValue ] = useState(initialValue);

    const wrappedSetValue = useMemo(() => {
        return async (newValue: string) => {
            await options.save(name, newValue);

            if (needsRefresh) {
                reloadFrontendApp(`option change: ${name}`);
            }
        }
    }, [ name, needsRefresh ]);

    useTriliumEvent("entitiesReloaded", useCallback(({ loadResults }) => {
        if (loadResults.getOptionNames().includes(name)) {
            const newValue = options.get(name);
            setValue(newValue);
        }
     }, [ name ]));

    return [
        value,
        wrappedSetValue
    ]
}

export function useTriliumOptionBool(name: OptionNames): [boolean, (newValue: boolean) => Promise<void>] {
    const [ value, setValue ] = useTriliumOption(name);
    return [
        (value === "true"),
        (newValue) => setValue(newValue ? "true" : "false")
    ]
}

/**
 * Generates a unique name via a random alphanumeric string of a fixed length.
 * 
 * <p>
 * Generally used to assign names to inputs that are unique, especially useful for widgets inside tabs.
 * 
 * @param prefix a prefix to add to the unique name.
 * @returns a name with the given prefix and a random alpanumeric string appended to it.
 */
export function useUniqueName(prefix: string) {
    return useMemo(() => prefix + utils.randomString(10), [ prefix]);
}