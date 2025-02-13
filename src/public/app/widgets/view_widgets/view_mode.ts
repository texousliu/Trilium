import type FNote from "../../entities/fnote.js";

export default abstract class ViewMode {

    constructor($parent: JQuery<HTMLElement>, parentNote: FNote, noteIds: string[], showNotePath: boolean = false) {

    }

    abstract renderList(): Promise<JQuery<HTMLElement> | undefined>;

}
