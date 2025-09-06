import { useContext, useEffect, useState } from "preact/hooks";
import { ParentComponent } from "./react_utils";
import { ComponentChildren, createContext } from "preact";
import { TouchBarItem } from "../../components/touch_bar";
import { dynamicRequire } from "../../services/utils";

interface TouchBarProps {
    children: ComponentChildren;
}

interface TouchBarContextApi {
    addItem(item: TouchBarItem): void;
    TouchBar: typeof Electron.TouchBar;
}

const TouchBarContext = createContext<TouchBarContextApi | null>(null);

export default function TouchBar({ children }: TouchBarProps) {
    const [ isFocused, setIsFocused ] = useState(false);
    const parentComponent = useContext(ParentComponent);
    const remote = dynamicRequire("@electron/remote") as typeof import("@electron/remote");
    const items: TouchBarItem[] = [];

    const api: TouchBarContextApi = {
        TouchBar: remote.TouchBar,
        addItem: (item) => {
            items.push(item);
        }
    };

    useEffect(() => {
        const el = parentComponent?.$widget[0];
        if (!el) return;

        function onFocusGained() {
            setIsFocused(true);
        }

        function onFocusLost() {
            setIsFocused(false);
        }

        el.addEventListener("focusin", onFocusGained);
        el.addEventListener("focusout", onFocusLost);
        return () => {
            el.removeEventListener("focusin", onFocusGained);
            el.removeEventListener("focusout", onFocusLost);
        }
    }, []);

    useEffect(() => {
        if (isFocused) {
            remote.getCurrentWindow().setTouchBar(new remote.TouchBar({ items }));
        }
    });

    return (
        <TouchBarContext.Provider value={api}>
            {children}
        </TouchBarContext.Provider>
    );
}

export function TouchBarLabel({ label }: { label: string }) {
    const api = useContext(TouchBarContext);

    if (api) {
        const item = new api.TouchBar.TouchBarLabel({
            label
        });
        api.addItem(item);
    }

    return <></>;
}

interface SliderProps {
    label: string;
    value: number;
    minValue: number;
    maxValue: number;
    onChange: (newValue: number) => void;
}

export function TouchBarSlider({ label, value, minValue, maxValue, onChange }: SliderProps) {
    const api = useContext(TouchBarContext);

    if (api) {
        const item = new api.TouchBar.TouchBarSlider({
            label,
            value, minValue, maxValue,
            change: onChange
        });
        api.addItem(item);
    }

    return <></>;
}
