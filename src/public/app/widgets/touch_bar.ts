import utils from "../services/utils.js";
import Component from "../components/component.js";
import appContext from "../components/app_context.js";
import NoteContextAwareWidget from "./note_context_aware_widget.js";
import type FNote from "../entities/fnote.js";

async function triggerTextEditorCommand(command: string, args?: object) {
    const editor = await appContext.tabManager.getActiveContext().getTextEditor();
    if (!editor) {
        return;
    }

    // TODO: Fix type of editor.
    (editor as any).execute(command, args);
}

export default class TouchBarWidget extends NoteContextAwareWidget {

    nativeImage: typeof import("electron").nativeImage;
    remote: typeof import("@electron/remote");

    constructor() {
        super();
        this.nativeImage = utils.dynamicRequire("electron").nativeImage;
        this.remote = utils.dynamicRequire("@electron/remote") as typeof import("@electron/remote");
        this.$widget = $("<div>");

        $(window).on("focusin", async (e) => {
            const target = e.target;
            const parentComponentEl = $(target).closest(".component");
            // TODO: Remove typecast once it's no longer necessary.
            const parentComponent = appContext.getComponentByEl(parentComponentEl[0]) as Component;
            const { TouchBar } = this.remote;
            if (!parentComponent) {
                return;
            }

            const result = parentComponent.triggerCommand("buildTouchBar", {
                TouchBar,
                buildIcon: this.buildIcon.bind(this)
            });

            if (result) {
                this.remote.getCurrentWindow().setTouchBar(result);
            }
        });
    }

    buildIcon(name: string) {
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

    #buildTextTouchBar() {
        const { TouchBar } = this.remote;
        const { TouchBarButton, TouchBarSpacer, TouchBarGroup, TouchBarSegmentedControl, TouchBarOtherItemsProxy } = this.remote.TouchBar;

        const items = [
            new TouchBarButton({
                icon: this.buildIcon("NSTouchBarComposeTemplate"),
                click: () => this.triggerCommand("createNoteIntoInbox")
            }),
            new TouchBarSpacer({ size: "large" }),
            // data should go here
            new TouchBarOtherItemsProxy(),
            new TouchBarSpacer({ size: "flexible" }),
            new TouchBarButton({
                icon: this.buildIcon("NSTouchBarAddDetailTemplate"),
                click: () => this.triggerCommand("jumpToNote")
            })
        ];

        console.log("Update ", items);
        return new TouchBar({
            items
        });
    }

}
