import { useEffect, useRef } from "preact/hooks";
import FNote from "../../entities/fnote";
import { dynamicRequire, escapeHtml, isElectron } from "../../services/utils";
import { useNoteLabel, useNoteProperty } from "../react/hooks";
import { LaunchBarActionButton } from "./launch_bar_widgets";
import type { WebContents } from "electron";
import contextMenu, { MenuCommandItem } from "../../menus/context_menu";
import tree from "../../services/tree";
import link from "../../services/link";

interface HistoryNavigationProps {
    launcherNote: FNote;
    command: "backInNoteHistory" | "forwardInNoteHistory";
}

export default function HistoryNavigationButton({ launcherNote, command }: HistoryNavigationProps) {
    const [ iconClass ] = useNoteLabel(launcherNote, "iconClass");
    const title = useNoteProperty(launcherNote, "title");
    const webContentsRef = useRef<WebContents>(null);

    useEffect(() => {
        if (isElectron()) {
            const webContents = dynamicRequire("@electron/remote").getCurrentWebContents();
            // without this, the history is preserved across frontend reloads
            webContents?.clearHistory();
            webContentsRef.current = webContents;
        }
    }, []);

    return iconClass && title && (
        <LaunchBarActionButton
            icon={iconClass}
            text={escapeHtml(title)}
            triggerCommand={command}
            onContextMenu={async (e) => {
                e.preventDefault();

                const webContents = webContentsRef.current;
                if (!webContents || webContents.navigationHistory.length() < 2) {
                    return;
                }

                let items: MenuCommandItem<string>[] = [];

                const history = webContents.navigationHistory.getAllEntries();
                const activeIndex = webContents.navigationHistory.getActiveIndex();

                for (const idx in history) {
                    const { notePath } = link.parseNavigationStateFromUrl(history[idx].url);
                    if (!notePath) continue;

                    const title = await tree.getNotePathTitle(notePath);

                    items.push({
                        title,
                        command: idx,
                        uiIcon:
                            parseInt(idx) === activeIndex
                                ? "bx bx-radio-circle-marked" // compare with type coercion!
                                : parseInt(idx) < activeIndex
                                ? "bx bx-left-arrow-alt"
                                : "bx bx-right-arrow-alt"
                    });
                }

                items.reverse();

                if (items.length > 20) {
                    items = items.slice(0, 50);
                }

                contextMenu.show({
                    x: e.pageX,
                    y: e.pageY,
                    items,
                    selectMenuItemHandler: (item: MenuCommandItem<string>) => {
                        if (item && item.command && webContents) {
                            const idx = parseInt(item.command, 10);
                            webContents.navigationHistory.goToIndex(idx);
                        }
                    }
                });
            }}
        />
    )
}
