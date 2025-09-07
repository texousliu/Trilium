import { RowComponent, Tabulator } from "tabulator-tables";
import Component from "../../../components/component.js";
import { setAttribute, setLabel } from "../../../services/attributes.js";
import server from "../../../services/server.js";
import froca from "../../../services/froca.js";
import note_create, { CreateNoteOpts } from "../../../services/note_create.js";
import { CommandListenerData } from "../../../components/app_context.js";

export default class TableRowEditing extends Component {

    private parentNotePath: string;
    private api: Tabulator;

    constructor(api: Tabulator, parentNotePath: string) {
        super();
        this.api = api;
        this.parentNotePath = parentNotePath;
        api.on("cellEdited", async (cell) => {
            const noteId = cell.getRow().getData().noteId;
            const field = cell.getField();
            let newValue = cell.getValue();

            if (field === "title") {
                server.put(`notes/${noteId}/title`, { title: newValue });
                return;
            }

            if (field.includes(".")) {
                const [ type, name ] = field.split(".", 2);
                if (type === "labels") {
                    if (typeof newValue === "boolean") {
                        newValue = newValue ? "true" : "false";
                    }
                    setLabel(noteId, name, newValue);
                } else if (type === "relations") {
                    const note = await froca.getNote(noteId);
                    if (note) {
                        setAttribute(note, "relation", name, newValue);
                    }
                }
            }
        });
    }

}


