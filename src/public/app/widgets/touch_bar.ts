import utils from "../services/utils.js";
import Component from "../components/component.js";
import appContext from "../components/app_context.js";

async function triggerTextEditorCommand(command: string, args?: object) {
    const editor = await appContext.tabManager.getActiveContext().getTextEditor();
    if (!editor) {
        return;
    }

    // TODO: Fix type of editor.
    (editor as any).execute(command, args);
}

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
        const { width, height } = sourceImage.getSize();
        const newImage = this.nativeImage.createEmpty();
        newImage.addRepresentation({
            scaleFactor: 1,
            width: width / 2,
            height: height / 2,
            buffer: sourceImage.resize({ height: height / 2 }).toBitmap()
        });
        newImage.addRepresentation({
            scaleFactor: 2,
            width: width,
            height: height,
            buffer: sourceImage.toBitmap()
        });
        return newImage;
    }

    #buildTouchBar() {
        const { TouchBar } = this.remote;
        const { TouchBarButton, TouchBarSpacer, TouchBarGroup, TouchBarSegmentedControl, TouchBarOtherItemsProxy } = this.remote.TouchBar;

        const items = [
            new TouchBarButton({
                icon: this.#buildIcon("NSTouchBarComposeTemplate"),
                click: () => this.triggerCommand("createNoteIntoInbox")
            }),
            new TouchBarSpacer({ size: "large" }),
            new TouchBarSegmentedControl({
                segments: [
                    { label: "P" },
                    { label: "H2" },
                    { label: "H3" }
                ],
                change(selectedIndex, isSelected) {
                    switch (selectedIndex) {
                        case 0:
                            triggerTextEditorCommand("paragraph")
                            break;
                        case 1:
                            triggerTextEditorCommand("heading", { value: "heading2" });
                            break;
                        case 2:
                            triggerTextEditorCommand("heading", { value: "heading3" });
                            break;
                    }
                },
            }),
            new TouchBarGroup({
                items: new TouchBar({
                    items: [
                        new TouchBarButton({
                            icon: this.#buildIcon("NSTouchBarTextBoldTemplate"),
                            click: () => triggerTextEditorCommand("bold")
                        }),
                        new TouchBarButton({
                            icon: this.#buildIcon("NSTouchBarTextItalicTemplate"),
                            click: () => triggerTextEditorCommand("italic")
                        }),
                        new TouchBarButton({
                            icon: this.#buildIcon("NSTouchBarTextUnderlineTemplate"),
                            click: () => triggerTextEditorCommand("underline")
                        })
                    ]
                })
            }),
            new TouchBarOtherItemsProxy(),
            new TouchBarSpacer({ size: "flexible" }),
            new TouchBarButton({
                icon: this.#buildIcon("NSTouchBarAddDetailTemplate"),
                click: () => this.triggerCommand("jumpToNote")
            })
        ];

        console.log("Update ", items);
        return new TouchBar({
            items
        });
    }

}
