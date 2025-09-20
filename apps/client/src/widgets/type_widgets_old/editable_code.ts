import type { CommandListenerData, EventData } from "../../components/app_context.js";
import type FNote from "../../entities/fnote.js";
import { t } from "../../services/i18n.js";
import keyboardActionService from "../../services/keyboard_actions.js";
import options from "../../services/options.js";
import AbstractCodeTypeWidget from "./abstract_code_type_widget.js";
import appContext from "../../components/app_context.js";
import type { TouchBarItem } from "../../components/touch_bar.js";
import { hasTouchBar } from "../../services/utils.js";
import type { EditorConfig } from "@triliumnext/codemirror";

const TPL = /*html*/`
`;

export default class EditableCodeTypeWidget extends AbstractCodeTypeWidget {


    static getType() {
        return "editableCode";
    }

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();
        this.$editor = this.$widget.find(".note-detail-code-editor");

        keyboardActionService.setupActionsForElement("code-detail", this.$widget, this);

        super.doRender();
    }

}
