import utils from "../services/utils.js";
import Component from "../components/component.js";

export default class TouchBarWidget extends Component {

    remote: typeof import("@electron/remote");

    constructor() {
        super();
        this.remote = utils.dynamicRequire("@electron/remote") as typeof import("@electron/remote");
        this.#setTouchBar();
    }

    #setTouchBar() {
        const touchBarData = this.#buildTouchBar();
        this.remote.getCurrentWindow().setTouchBar(touchBarData);
        console.log("Setting touch bar", touchBarData);
    }

    #buildTouchBar() {
        const { TouchBarButton } = this.remote.TouchBar;

        const items = [
            new TouchBarButton({
                label: "New note",
                click: () => {
                    console.log("New note pressed.");
                }
            })
        ];

        return new this.remote.TouchBar({
            items
        });
    }

}
