import FNote from "../../entities/fnote";
import { escapeHtml } from "../../services/utils";
import { useNoteLabel, useNoteProperty, useTriliumOptionBool } from "../react/hooks";
import { LaunchBarActionButton } from "./launch_bar_widgets";

export default function AiChatButton({ launcherNote }: { launcherNote: FNote }) {
    const [ aiEnabled ] = useTriliumOptionBool("aiEnabled");
    const [ iconClass ] = useNoteLabel(launcherNote, "iconClass");
    const title = useNoteProperty(launcherNote, "title");

    return aiEnabled && iconClass && title && (
        <LaunchBarActionButton
            icon={iconClass}
            text={escapeHtml(title)}
            triggerCommand="createAiChat"
        />
    )
}
