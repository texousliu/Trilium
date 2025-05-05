import "ckeditor5/ckeditor5.css";
import { COMMON_PLUGINS, POPUP_EDITOR_PLUGINS } from "./plugins";
import { BalloonEditor, DecoupledEditor } from "ckeditor5";
export { EditorWatchdog } from "ckeditor5";

export class AttributeEditor extends BalloonEditor {
    static override get builtinPlugins() {
        return [];
    }
}

export class ClassicEditor extends DecoupledEditor {
    static override get builtinPlugins() {
        return COMMON_PLUGINS;
    }
}

export class PopupEditor extends BalloonEditor {
    static override get builtinPlugins() {
        return POPUP_EDITOR_PLUGINS;
    }
}
