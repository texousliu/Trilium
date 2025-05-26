import { ButtonView, Plugin } from "ckeditor5";
import copyIcon from "../icons/copy.svg?raw";

export default class CopyToClipboardButton extends Plugin {

    public init() {
        const editor = this.editor;
        const componentFactory = editor.ui.componentFactory;

        componentFactory.add("copyToClipboard", locale => {
            const button = new ButtonView(locale);
            button.set({
                tooltip: "Copy to clipboard",
                icon: copyIcon
            });

            return button;
        });
    }

}
