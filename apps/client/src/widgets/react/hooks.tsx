import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { EventData, EventNames } from "../../components/app_context";
import { ParentComponent } from "./react_utils";
import SpacedUpdate from "../../services/spaced_update";
import { OptionNames } from "@triliumnext/commons";
import options, { type OptionValue } from "../../services/options";
import utils, { reloadFrontendApp } from "../../services/utils";
import Component from "../../components/component";
import NoteContext from "../../components/note_context";
import { ReactWrappedWidget } from "../basic_widget";
import FNote from "../../entities/fnote";

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
            if (newEventHandlers.length) {
                registeredHandlers.get(parentWidget)?.set(eventName, newEventHandlers);        
            } else {
                registeredHandlers.get(parentWidget)?.delete(eventName);
            }

            if (!registeredHandlers.get(parentWidget)?.size) {
                registeredHandlers.delete(parentWidget);
            }
        };
    }, [ eventName, parentWidget, handler ]);
}

export function useTriliumEventBeta<T extends EventNames>(eventName: T, handler: TriliumEventHandler<T>) {
    const parentComponent = useContext(ParentComponent) as ReactWrappedWidget;
    parentComponent.registerHandler(eventName, handler);

    return (() => parentComponent.removeHandler(eventName, handler));
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

/**
 * Allows a React component to read and write a Trilium option, while also watching for external changes.
 * 
 * Conceptually, `useTriliumOption` works just like `useState`, but the value is also automatically updated if
 * the option is changed somewhere else in the client.
 * 
 * @param name the name of the option to listen for.
 * @param needsRefresh whether to reload the frontend whenever the value is changed.
 * @returns an array where the first value is the current option value and the second value is the setter.
 */
export function useTriliumOption(name: OptionNames, needsRefresh?: boolean): [string, (newValue: OptionValue) => Promise<void>] {
    const initialValue = options.get(name);
    const [ value, setValue ] = useState(initialValue);

    const wrappedSetValue = useMemo(() => {
        return async (newValue: OptionValue) => {
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

/**
 * Similar to {@link useTriliumOption}, but the value is converted to and from a boolean instead of a string.
 * 
 * @param name the name of the option to listen for.
 * @param needsRefresh whether to reload the frontend whenever the value is changed.
 * @returns an array where the first value is the current option value and the second value is the setter.
 */
export function useTriliumOptionBool(name: OptionNames, needsRefresh?: boolean): [boolean, (newValue: boolean) => Promise<void>] {
    const [ value, setValue ] = useTriliumOption(name, needsRefresh);
    return [
        (value === "true"),
        (newValue) => setValue(newValue ? "true" : "false")
    ]
}

/**
 * Similar to {@link useTriliumOption}, but the value is converted to and from a int instead of a string.
 * 
 * @param name the name of the option to listen for.
 * @param needsRefresh whether to reload the frontend whenever the value is changed.
 * @returns an array where the first value is the current option value and the second value is the setter.
 */
export function useTriliumOptionInt(name: OptionNames): [number, (newValue: number) => Promise<void>] {
    const [ value, setValue ] = useTriliumOption(name);
    return [
        (parseInt(value, 10)),
        (newValue) => setValue(newValue)
    ]
}

/**
 * Similar to {@link useTriliumOption}, but the object value is parsed to and from a JSON instead of a string.
 * 
 * @param name the name of the option to listen for.
 * @returns an array where the first value is the current option value and the second value is the setter.
 */
export function useTriliumOptionJson<T>(name: OptionNames): [ T, (newValue: T) => Promise<void> ] {
    const [ value, setValue ] = useTriliumOption(name);
    return [
        (JSON.parse(value) as T),
        (newValue => setValue(JSON.stringify(newValue)))
    ];
}

/**
 * Similar to {@link useTriliumOption}, but operates with multiple options at once. 
 * 
 * @param names the name of the option to listen for.
 * @returns an array where the first value is a map where the keys are the option names and the values, and the second value is the setter which takes in the same type of map and saves them all at once.
 */
export function useTriliumOptions<T extends OptionNames>(...names: T[]) {
    const values: Record<string, string> = {};
    for (const name of names) {
        values[name] = options.get(name);
    }

    return [
        values as Record<T, string>,
        options.saveMany
    ] as const;
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
export function useUniqueName(prefix?: string) {
    return useMemo(() => (prefix ? prefix + "-" : "") + utils.randomString(10), [ prefix ]);
}

export function useNoteContext() {

    const [ noteContext, setNoteContext ] = useState<NoteContext>();
    const [ notePath, setNotePath ] = useState<string | null | undefined>();

    useTriliumEventBeta("activeContextChanged", ({ noteContext }) => {
        setNoteContext(noteContext);
        setNotePath(noteContext.notePath);
    });
    useTriliumEventBeta("setNoteContext", ({ noteContext }) => {
        console.log("Set note context", noteContext, noteContext.noteId);
        setNoteContext(noteContext);
    });
    useTriliumEventBeta("noteSwitchedAndActivated", ({ noteContext }) => {
        console.log("Note switched and activated")
        setNoteContext(noteContext);
    });
    useTriliumEventBeta("noteSwitched", ({ noteContext, notePath }) => {
        console.warn("Note switched", notePath);
        setNotePath(notePath);
    });
    
    const parentComponent = useContext(ParentComponent) as ReactWrappedWidget;

    return {
        note: noteContext?.note,
        noteId: noteContext?.note?.noteId,
        notePath: noteContext?.notePath,
        hoistedNoteId: noteContext?.hoistedNoteId,
        ntxId: noteContext?.ntxId,
        viewScope: noteContext?.viewScope,
        componentId: parentComponent.componentId,
        noteContext: noteContext
    };

}

/**
 * Allows a React component to listen to obtain a property of a {@link FNote} while also automatically watching for changes, either via the user changing to a different note or the property being changed externally.
 * 
 * @param note the {@link FNote} whose property to obtain.
 * @param property a property of a {@link FNote} to obtain the value from (e.g. `title`, `isProtected`).
 * @param componentId optionally, constricts the refresh of the value if an update occurs externally via the component ID of a legacy widget. This can be used to avoid external data replacing fresher, user-inputted data.
 * @returns the value of the requested property.
 */
export function useNoteProperty<T extends keyof FNote>(note: FNote | null | undefined, property: T, componentId?: string) {
    if (!note) {
        return null;
    }

    const [ value, setValue ] = useState<FNote[T]>(note[property]);

    // Watch for note changes.
    useEffect(() => setValue(note[property]), [ note[property] ]);

    // Watch for external changes.
    useTriliumEventBeta("entitiesReloaded", ({ loadResults }) => {
        if (loadResults.isNoteReloaded(note.noteId, componentId)) {
            setValue(note[property]);
        }
    });

    return value;
}