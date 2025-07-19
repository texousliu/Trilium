import ViewMode, { ViewModeArgs } from "../view_mode";

const TPL = /*html*/`
<div class="board-view">
    <style>
        .board-view {
            overflow: hidden;
            position: relative;
            height: 100%;
            user-select: none;
        }

        .board-view-container {
            height: 100%;
        }
    </style>

    <div class="board-view-container">
        Board view goes here.
    </div>
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
        // this.$container.empty();
        this.renderBoard(this.$container[0]);
        return this.$root;
    }

    private async renderBoard(el: HTMLElement) {

    }

}
