import ViewMode, { ViewModeArgs } from "../view_mode";
import { getBoardData } from "./data";

const TPL = /*html*/`
<div class="board-view">
    <style>
        .board-view {
            overflow: hidden;
            position: relative;
            height: 100%;
            padding: 1em;
            user-select: none;
        }

        .board-view-container {
            height: 100%;
            display: flex;
            gap: 1em;
        }

        .board-view-container .board-column {
            min-width: 200px;
        }

        .board-view-container .board-column h3 {
            font-size: 1.2em;
        }
    </style>

    <div class="board-view-container"></div>
</div>
`;

export interface StateInfo {

};

export default class BoardView extends ViewMode<StateInfo> {

    private $root: JQuery<HTMLElement>;
    private $container: JQuery<HTMLElement>;

    constructor(args: ViewModeArgs) {
        super(args, "board");

        this.$root = $(TPL);
        this.$container = this.$root.find(".board-view-container");
        args.$parent.append(this.$root);
    }

    async renderList(): Promise<JQuery<HTMLElement> | undefined> {
        this.$container.empty();
        this.renderBoard(this.$container[0]);

        return this.$root;
    }

    private async renderBoard(el: HTMLElement) {
        const data = await getBoardData(this.noteIds, "status");

        for (const column of data.byColumn.keys()) {
            const columnNotes = data.byColumn.get(column);
            if (!columnNotes) {
                continue;
            }

            const $columnEl = $("<div>")
                .addClass("board-column")
                .append($("<h3>").text(column));

            for (const note of columnNotes) {
                const $noteEl = $("<div>").addClass("board-note").text(note.title); // Assuming FNote has a title property
                $columnEl.append($noteEl);
            }

            $(el).append($columnEl);
        }
    }

}
