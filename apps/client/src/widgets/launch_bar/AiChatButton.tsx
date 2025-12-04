import FNote from "../../entities/fnote";
import { useTriliumOptionBool } from "../react/hooks";
import { LaunchBarActionButton, useLauncherIconAndTitle } from "./launch_bar_widgets";

export default function AiChatButton({ launcherNote }: { launcherNote: FNote }) {
    const [ aiEnabled ] = useTriliumOptionBool("aiEnabled");
    const { icon, title } = useLauncherIconAndTitle(launcherNote);

    return aiEnabled && (
        <LaunchBarActionButton
            icon={icon}
            text={title}
            triggerCommand="createAiChat"
        />
    )
}
