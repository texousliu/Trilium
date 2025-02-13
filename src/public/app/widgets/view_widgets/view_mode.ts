import type FNote from "../../entities/fnote.js";

export default abstract class ViewMode {

    constructor($parent: JQuery<HTMLElement>, parentNote: FNote, noteIds: string[], showNotePath: boolean = false) {
        // note list must be added to the DOM immediately, otherwise some functionality scripting (canvas) won't work
        $parent.empty();
    }

    abstract renderList(): Promise<JQuery<HTMLElement> | undefined>;

}
