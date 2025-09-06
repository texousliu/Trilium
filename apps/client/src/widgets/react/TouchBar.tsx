import { useContext, useEffect } from "preact/hooks";
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
            remote.getCurrentWindow().setTouchBar(new remote.TouchBar({ items }));
        }

        el.addEventListener("focusin", onFocusGained);
        return () => el.removeEventListener("focusin", onFocusGained);
    }, []);

    return (
        <TouchBarContext.Provider value={api}>
            {children}
        </TouchBarContext.Provider>
    );
}

export function TouchBarLabel({ label }: { label: string }) {
    const api = useContext(TouchBarContext);
    console.log("Build label with API ", api);

    if (api) {
        const item = new api.TouchBar.TouchBarLabel({
            label
        });
        api.addItem(item);
    }

    return <></>;
}
