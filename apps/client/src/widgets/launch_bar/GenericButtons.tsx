import appContext, { CommandNames } from "../../components/app_context";
import FNote from "../../entities/fnote";
import link_context_menu from "../../menus/link_context_menu";
import { escapeHtml, isCtrlKey } from "../../services/utils";
import { useNoteLabel, useNoteProperty } from "../react/hooks";
import { LaunchBarActionButton } from "./launch_bar_widgets";

export function CommandButton({ launcherNote }: { launcherNote: FNote }) {
    const [ iconClass ] = useNoteLabel(launcherNote, "iconClass");
    const [ command ] = useNoteLabel(launcherNote, "command");
    const title = useNoteProperty(launcherNote, "title");

    return iconClass && title && command && (
        <LaunchBarActionButton
            icon={iconClass}
            text={escapeHtml(title)}
            triggerCommand={command as CommandNames}
        />
    )
}

export function NoteLauncher({ launcherNote, targetNoteId, hoistedNoteId }: { launcherNote: FNote, targetNoteId: string, hoistedNoteId?: string }) {
    const [ iconClass ] = useNoteLabel(launcherNote, "iconClass");
    const title = useNoteProperty(launcherNote, "title");

    async function launch(evt: MouseEvent) {
        if (evt.which === 3) {
            return;
        }
        const hoistedNoteIdWithDefault = hoistedNoteId || launcherNote.getRelationValue("hoistedNote") || appContext.tabManager.getActiveContext()?.hoistedNoteId;
        const ctrlKey = isCtrlKey(evt);

        if ((evt.which === 1 && ctrlKey) || evt.which === 2) {
            const activate = evt.shiftKey ? true : false;
            await appContext.tabManager.openInNewTab(targetNoteId, hoistedNoteIdWithDefault, activate);
        } else {
            await appContext.tabManager.openInSameTab(targetNoteId);
        }
    }

    return title && iconClass && (
        <LaunchBarActionButton
            icon={iconClass}
            text={escapeHtml(title)}
            onClick={launch}
            onAuxClick={launch}
            onContextMenu={evt => {
                evt.preventDefault();
                link_context_menu.openContextMenu(targetNoteId, evt);
            }}
        />
    )
}
