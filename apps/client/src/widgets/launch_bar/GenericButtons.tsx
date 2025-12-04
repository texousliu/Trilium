import appContext, { CommandNames } from "../../components/app_context";
import FNote from "../../entities/fnote";
import link_context_menu from "../../menus/link_context_menu";
import { escapeHtml, isCtrlKey } from "../../services/utils";
import { useNoteLabel, useNoteProperty, useNoteRelation } from "../react/hooks";
import { LaunchBarActionButton, useLauncherIconAndTitle } from "./launch_bar_widgets";
import dialog from "../../services/dialog";
import { t } from "../../services/i18n";

export function CommandButton({ launcherNote }: { launcherNote: FNote }) {
    const { icon, title } = useLauncherIconAndTitle(launcherNote);
    const [ command ] = useNoteLabel(launcherNote, "command");

    return command && (
        <LaunchBarActionButton
            icon={icon}
            text={title}
            triggerCommand={command as CommandNames}
        />
    )
}

export function CustomNoteLauncher({ launcherNote, targetNoteId, hoistedNoteId }: { launcherNote: FNote, targetNoteId: string | null, hoistedNoteId?: string }) {
    const { icon, title } = useLauncherIconAndTitle(launcherNote);

    async function launch(evt: MouseEvent) {
        if (evt.which === 3) {
            return;
        }

        if (!targetNoteId) {
            dialog.info(t("note_launcher.this_launcher_doesnt_define_target_note"));
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

    return (
        <LaunchBarActionButton
            icon={icon}
            text={escapeHtml(title)}
            onClick={launch}
            onAuxClick={launch}
            onContextMenu={evt => {
                evt.preventDefault();
                if (targetNoteId) {
                    link_context_menu.openContextMenu(targetNoteId, evt);
                }
            }}
        />
    )
}

// we're intentionally displaying the launcher title and icon instead of the target,
// e.g. you want to make launchers to 2 mermaid diagrams which both have mermaid icon (ok),
// but on the launchpad you want them distinguishable.
// for titles, the note titles may follow a different scheme than maybe desirable on the launchpad
// another reason is the discrepancy between what user sees on the launchpad and in the config (esp. icons).
// The only downside is more work in setting up the typical case
// where you actually want to have both title and icon in sync, but for those cases there are bookmarks
export function NoteLauncher({ launcherNote, ...restProps }: { launcherNote: FNote, hoistedNoteId?: string }) {
    const [ targetNote ] = useNoteRelation(launcherNote, "target");
    return <CustomNoteLauncher launcherNote={launcherNote} targetNoteId={targetNote ?? null} {...restProps} />
}
