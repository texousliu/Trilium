import utils from "./utils.js";

type ElementType = HTMLElement | Document;
type Handler = () => void;

interface ShortcutBinding {
    element: HTMLElement | Document;
    shortcut: string;
    handler: Handler;
    namespace: string | null;
    listener: (evt: Event) => void;
}

// Store all active shortcut bindings for management
const activeBindings: Map<string, ShortcutBinding[]> = new Map();

function removeGlobalShortcut(namespace: string) {
    bindGlobalShortcut("", null, namespace);
}

function bindGlobalShortcut(keyboardShortcut: string, handler: Handler | null, namespace: string | null = null) {
    bindElShortcut($(document), keyboardShortcut, handler, namespace);
}

function bindElShortcut($el: JQuery<ElementType | Element>, keyboardShortcut: string, handler: Handler | null, namespace: string | null = null) {
    if (utils.isDesktop()) {
        keyboardShortcut = normalizeShortcut(keyboardShortcut);

        // If namespace is provided, remove all previous bindings for this namespace
        if (namespace) {
            removeNamespaceBindings(namespace);
        }

        // Method can be called to remove the shortcut (e.g. when keyboardShortcut label is deleted)
        if (keyboardShortcut && handler) {
            const element = $el.length > 0 ? $el[0] as (HTMLElement | Document) : document;

            const listener = (evt: Event) => {
                const e = evt as KeyboardEvent;
                if (matchesShortcut(e, keyboardShortcut)) {
                    e.preventDefault();
                    e.stopPropagation();
                    handler();
                }
            };

            // Add the event listener
            element.addEventListener('keydown', listener);

            // Store the binding for later cleanup
            const binding: ShortcutBinding = {
                element,
                shortcut: keyboardShortcut,
                handler,
                namespace,
                listener
            };

            const key = namespace || 'global';
            if (!activeBindings.has(key)) {
                activeBindings.set(key, []);
            }
            activeBindings.get(key)!.push(binding);
        }
    }
}

function removeNamespaceBindings(namespace: string) {
    const bindings = activeBindings.get(namespace);
    if (bindings) {
        // Remove all event listeners for this namespace
        bindings.forEach(binding => {
            binding.element.removeEventListener('keydown', binding.listener);
        });
        activeBindings.delete(namespace);
    }
}

function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
    if (!shortcut) return false;

    const parts = shortcut.toLowerCase().split('+');
    const key = parts[parts.length - 1]; // Last part is the actual key
    const modifiers = parts.slice(0, -1); // Everything before is modifiers

    // Check if the main key matches
    if (!keyMatches(e, key)) {
        return false;
    }

    // Check modifiers
    const expectedCtrl = modifiers.includes('ctrl') || modifiers.includes('control');
    const expectedAlt = modifiers.includes('alt');
    const expectedShift = modifiers.includes('shift');
    const expectedMeta = modifiers.includes('meta') || modifiers.includes('cmd') || modifiers.includes('command');

    return e.ctrlKey === expectedCtrl &&
           e.altKey === expectedAlt &&
           e.shiftKey === expectedShift &&
           e.metaKey === expectedMeta;
}

function keyMatches(e: KeyboardEvent, key: string): boolean {
    // Handle special key mappings
    const keyMap: { [key: string]: string[] } = {
        'return': ['Enter'],
        'del': ['Delete'],
        'esc': ['Escape'],
        'space': [' ', 'Space'],
        'tab': ['Tab'],
        'backspace': ['Backspace'],
        'home': ['Home'],
        'end': ['End'],
        'pageup': ['PageUp'],
        'pagedown': ['PageDown'],
        'up': ['ArrowUp'],
        'down': ['ArrowDown'],
        'left': ['ArrowLeft'],
        'right': ['ArrowRight']
    };

    // Function keys
    for (let i = 1; i <= 19; i++) {
        keyMap[`f${i}`] = [`F${i}`];
    }

    const mappedKeys = keyMap[key.toLowerCase()];
    if (mappedKeys) {
        return mappedKeys.includes(e.key) || mappedKeys.includes(e.code);
    }

    // For regular keys, check both key and code
    return e.key.toLowerCase() === key.toLowerCase() ||
           e.code.toLowerCase() === key.toLowerCase();
}

/**
 * Normalize to a consistent format for our custom shortcut parser
 */
function normalizeShortcut(shortcut: string): string {
    if (!shortcut) {
        return shortcut;
    }

    return shortcut
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '') // Remove any spaces
        .replace("enter", "return")
        .replace("delete", "del")
        .replace("escape", "esc")
        // Normalize modifier order: ctrl, alt, shift, meta, then key
        .split('+')
        .sort((a, b) => {
            const order = ['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command'];
            const aIndex = order.indexOf(a);
            const bIndex = order.indexOf(b);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        })
        .join('+');
}

export default {
    bindGlobalShortcut,
    bindElShortcut,
    removeGlobalShortcut,
    normalizeShortcut
};
