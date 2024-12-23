import Component from "./component.js";
import appContext, { CommandListener, CommandListenerData } from "./app_context.js";

export type Screen = "detail" | "tree";

export default class MobileScreenSwitcherExecutor extends Component
    implements CommandListener<"setActiveScreen">
{
    private activeScreen?: Screen;

    setActiveScreenCommand({screen}: CommandListenerData<"setActiveScreen">) {
        if (screen !== this.activeScreen) {
            this.activeScreen = screen;

            if (screen === 'tree') {
                const activeNoteContext = appContext.tabManager.getActiveContext();

                activeNoteContext.setEmpty();
            }

            this.triggerEvent('activeScreenChanged', {activeScreen: screen});
        }
    }
}
