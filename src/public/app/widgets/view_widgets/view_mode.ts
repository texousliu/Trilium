import type { EventData } from "../../components/app_context.js";
import type FNote from "../../entities/fnote.js";

export interface ViewModeArgs {
    $parent: JQuery<HTMLElement>;
    parentNote: FNote;
    noteIds: string[];
    showNotePath?: boolean;
}

export default abstract class ViewMode {

    constructor(args: ViewModeArgs) {
        // note list must be added to the DOM immediately, otherwise some functionality scripting (canvas) won't work
        args.$parent.empty();
    }

    abstract renderList(): Promise<JQuery<HTMLElement> | undefined>;

    entitiesReloadedEvents(e: EventData<"entitiesReloaded">) {
        // Do nothing by default.
    }

    get isFullHeight() {
        // Override to change its value.
        return false;
    }

}
