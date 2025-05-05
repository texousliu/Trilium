import "ckeditor5/ckeditor5.css";
import { COMMON_PLUGINS, CORE_PLUGINS, POPUP_EDITOR_PLUGINS } from "./plugins";
import { BalloonEditor, DecoupledEditor } from "ckeditor5";
export { EditorWatchdog } from "ckeditor5";

/**
 * Short-hand for the CKEditor classes supported by Trilium for text editing.
 * Specialized editors such as the {@link AttributeEditor} are not included.
 */
export type CKTextEditor = ClassicEditor | PopupEditor;

/**
 * The text editor that can be used for editing attributes and relations.
 */
export class AttributeEditor extends BalloonEditor {
    static override get builtinPlugins() {
        return CORE_PLUGINS;
    }
}

/**
 * A text editor configured as a {@link DecoupledEditor} (fixed toolbar mode), as well as its preconfigured plugins.
 */
export class ClassicEditor extends DecoupledEditor {
    static override get builtinPlugins() {
        return COMMON_PLUGINS;
    }
}

/**
 * A text editor configured as a {@link BalloonEditor} (floating toolbar mode), as well as its preconfigured plugins.
 */
export class PopupEditor extends BalloonEditor {
    static override get builtinPlugins() {
        return POPUP_EDITOR_PLUGINS;
    }
}
