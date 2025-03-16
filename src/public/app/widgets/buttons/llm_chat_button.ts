import type FNote from "../../entities/fnote.js";
import CommandButtonWidget from "./command_button.js";

export default class LlmChatButton extends CommandButtonWidget {

    constructor(note: FNote) {
        super();

        this.command("showLlmChat")
            .title(() => note.title)
            .icon(() => note.getIcon())
            .class("launcher-button");
    }

}
