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

    #buildIcon(name: string) {
        const sourceImage = this.nativeImage.createFromNamedImage(name, [-1, 0, 1]);
        const newImage = this.nativeImage.createEmpty()
        newImage.addRepresentation({
            scaleFactor: 1,
            width: 22,
            height: 22,
            buffer: sourceImage.resize({ height: 22 }).toBitmap()
        });
        newImage.addRepresentation({
            scaleFactor: 2,
            width: 44,
            height: 44,
            buffer: sourceImage.resize({ height: 44 }).toBitmap()
        });
        return newImage;
    }

    #buildTouchBar() {
        const { TouchBar } = this.remote;
        const { TouchBarButton } = this.remote.TouchBar;

        const items = [
            new TouchBarButton({
                icon: this.#buildIcon("NSTouchBarComposeTemplate"),
                click: () => this.triggerCommand("createNoteIntoInbox")
            })
        ];

        console.log("Update ", items);
        return new TouchBar({
            items
        });
    }

}
