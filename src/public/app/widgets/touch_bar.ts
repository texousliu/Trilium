import utils from "../services/utils.js";
import Component from "../components/component.js";

export default class TouchBarWidget extends Component {

    nativeImage: typeof import("electron").nativeImage;
    remote: typeof import("@electron/remote");

    constructor() {
        super();
        this.nativeImage = utils.dynamicRequire("electron").nativeImage;
        this.remote = utils.dynamicRequire("@electron/remote") as typeof import("@electron/remote");
        this.#setTouchBar();
    }

    #setTouchBar() {
        const touchBarData = this.#buildTouchBar();
        this.remote.getCurrentWindow().setTouchBar(touchBarData);
    }

    #buildTouchBar() {
        const { nativeImage } = this;
        const { TouchBar } = this.remote;
        const { TouchBarButton } = this.remote.TouchBar;

        const items = [
            new TouchBarButton({
                icon: nativeImage.createFromNamedImage("NSTouchBarAddDetailTemplate", [-1, 0, 1]),
                click: () => {
                    console.log("New note pressed.");
                }
            })
        ];

        console.log("Update ", items);
        return new TouchBar({
            items
        });
    }

}
