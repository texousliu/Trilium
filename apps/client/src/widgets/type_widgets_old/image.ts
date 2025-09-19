import utils from "../../services/utils.js";
import TypeWidget from "./type_widget.js";
import imageContextMenuService from "../../menus/image_context_menu.js";
import imageService from "../../services/image.js";
import type FNote from "../../entities/fnote.js";
import type { EventData } from "../../components/app_context.js";

class ImageTypeWidget extends TypeWidget {

    private $imageWrapper!: JQuery<HTMLElement>;
    private $imageView!: JQuery<HTMLElement>;

    static getType() {
        return "image";
    }

    copyImageReferenceToClipboardEvent({ ntxId }: EventData<"copyImageReferenceToClipboard">) {
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isNoteReloaded(this.noteId)) {
            this.refresh();
        }
    }
}

export default ImageTypeWidget;
