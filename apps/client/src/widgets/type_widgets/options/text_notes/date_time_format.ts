import OptionsWidget from "../options_widget.js"; 
import { t } from "../../../../services/i18n.js";
import type { OptionMap } from "@triliumnext/commons"; 


const TPL = /*html*/`
<div class="options-section">
    <h4>${t("custom_date_time_format.title")}</h4>

    <p>
        ${t("custom_date_time_format.desc1")}
        ${t("custom_date_time_format.desc2")}
    </p>
    <p>
        <strong>${t("custom_date_time_format.important_label")}</strong>
        ${t("custom_date_time_format.desc3")}
    </p>

    <div class="form-group">
        <label for="customDateTimeFormatInput" style="margin-right: 10px;">
            ${t("custom_date_time_format.format_string_label")}
        </label>
        <input type="text" id="customDateTimeFormatInput" class="form-control custom-datetime-format-input" 
               placeholder="${t("custom_date_time_format.placeholder")}" 
               style="width: 300px; display: inline-block;">
    </div>
    <p style="margin-top: 5px;">
        <em>${t("custom_date_time_format.examples_label")}</em>
        <code>YYYY-MM-DD HH:mm</code> (${t("custom_date_time_format.example_default")}),
        <code>DD.MM.YYYY</code>,
        <code>MMMM D, YYYY h:mm A</code>,
        <code>[Today is] dddd</code>
    </p>
</div>
`;

export default class DateTimeFormatOptions extends OptionsWidget {
    
    private $formatInput!: JQuery<HTMLInputElement>;

    doRender() {
        this.$widget = $(TPL); 
        this.$formatInput = this.$widget.find(
            "input.custom-datetime-format-input"
        ) as JQuery<HTMLInputElement>; 

        this.$formatInput.on("input", () => {
            const formatString = this.$formatInput.val() as string; 
            this.updateOption("customDateTimeFormatString", formatString);
        });

        return this.$widget;
    }

    async optionsLoaded(options: OptionMap) {
        const currentFormat = options.customDateTimeFormatString || "";

        if (this.$formatInput) {
            this.$formatInput.val(currentFormat);
        } else {

            console.warn(
                "TriliumNext DateTimeFormatOptions: $formatInput not initialized when optionsLoaded was called. Attempting to find again."
            );
            const inputField = this.$widget?.find( 
                "input.custom-datetime-format-input"
            ) as JQuery<HTMLInputElement> | undefined; 

            if (inputField?.length) { 
                this.$formatInput = inputField;
                this.$formatInput.val(currentFormat);
            } else {
                console.error(
                    "TriliumNext DateTimeFormatOptions: Could not find format input field in optionsLoaded."
                );
            }
        }
    }
}
