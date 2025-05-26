import { ButtonView, Command, Plugin } from "ckeditor5";
import copyIcon from "../icons/copy.svg?raw";

export default class CopyToClipboardButton extends Plugin {

    static get requires() {
        return [ CopyToClipboardEditing, CopyToClipboardUI ];
    }

}

export class CopyToClipboardUI extends Plugin {

    public init() {
        const editor = this.editor;
        const componentFactory = editor.ui.componentFactory;

        componentFactory.add("copyToClipboard", locale => {
            const button = new ButtonView(locale);
            button.set({
                tooltip: "Copy to clipboard",
                icon: copyIcon
            });

            this.listenTo(button, "execute", () => {
                editor.execute("copyToClipboard");
            });

            return button;
        });
    }

}

export class CopyToClipboardEditing extends Plugin {

    public init() {
        this.editor.commands.add("copyToClipboard", new CopyToClipboardCommand(this.editor));
    }

}

export class CopyToClipboardCommand extends Command {

    execute(...args: Array<unknown>) {
        console.log("Copy to clipboard!");
    }

}
