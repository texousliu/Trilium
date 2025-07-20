import attributes from "../../../services/attributes";

export default class BoardApi {

    constructor(public columns: string[]) {
    }

    async changeColumn(noteId: string, newColumn: string) {
        await attributes.setLabel(noteId, "status", newColumn);
    }

}
