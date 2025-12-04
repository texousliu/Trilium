import { CommandNames } from "../../components/app_context";
import FNote from "../../entities/fnote";
import { escapeHtml } from "../../services/utils";
import { useNoteLabel, useNoteProperty } from "../react/hooks";
import { LaunchBarActionButton } from "./launch_bar_widgets";

export default function CommandButton({ launcherNote }: { launcherNote: FNote }) {
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
