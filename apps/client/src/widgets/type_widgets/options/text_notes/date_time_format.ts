import OptionsWidget from "../options_widget.js"; 
import { t } from "../../../../services/i18n.js";
import type { OptionMap } from "@triliumnext/commons"; 


const TPL = /*html*/`
<div class="options-section">
    <h4>${t("options.customDateTimeFormatTitle", "Custom Date/Time Format (Alt+T)")}</h4>

    <p>
        ${t("options.customDateTimeFormatDesc1", "Define a custom format for the date and time inserted using the Alt+T shortcut.")}
        ${t("options.customDateTimeFormatDesc2", "Uses <a href=\"https://day.js.org/docs/en/display/format\" target=\"_blank\" rel=\"noopener noreferrer\">Day.js format tokens</a>. Refer to the Day.js documentation for valid tokens.")}
    </p>
    <p>
        <strong>${t("options.customDateTimeFormatImportant", "Important:")}</strong>
        ${t("options.customDateTimeFormatDesc3", "If you provide a format string that Day.js does not recognize (e.g., mostly plain text without valid Day.js tokens), the text you typed might be inserted literally. If the format string is left empty, or if Day.js encounters a critical internal error with your format, a default format (e.g., YYYY-MM-DD HH:mm) will be used.")}
    </p>

    <div class="form-group">
        <label for="customDateTimeFormatInput" style="margin-right: 10px;">
            ${t("options.customDateTimeFormatLabel", "Format String:")}
        </label>
        <input type="text" id="customDateTimeFormatInput" class="form-control custom-datetime-format-input" 
               placeholder="${t("options.customDateTimeFormatPlaceholder", "e.g., DD/MM/YYYY HH:mm:ss or dddd, MMMM D")}" 
               style="width: 300px; display: inline-block;">
    </div>
    <p style="margin-top: 5px;">
        <em>${t("options.customDateTimeFormatExamplesLabel", "Examples of valid Day.js formats:")}</em>
        <code>YYYY-MM-DD HH:mm</code> (${t("options.customDateTimeFormatExampleDefault", "Default-like")}),
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
