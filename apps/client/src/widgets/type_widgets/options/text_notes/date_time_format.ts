import OptionsWidget from "../options_widget.js"; // Path might need adjustment
import { t } from "../../../../services/i18n.js"; // For internationalization, if you want to use it
import type { OptionMap } from "@triliumnext/commons"; // For typing the options object

// Using t() for translatable strings is good practice if the project uses it.
// If not, you can use plain strings.
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
    // Declare class properties with types if needed (jQuery objects are often typed as JQuery<HTMLElement>)
    private $formatInput!: JQuery<HTMLInputElement>; // The "!" is a non-null assertion operator

    doRender() {
        this.$widget = $(TPL); // $ is jQuery, ensure it's available (likely is if OptionsWidget uses it)
        this.$formatInput = this.$widget.find(
            "input.custom-datetime-format-input"
        ) as JQuery<HTMLInputElement>; // Type assertion for jQuery result

        this.$formatInput.on("input", () => {
            const formatString = this.$formatInput.val() as string; // Get value, assert as string
            this.updateOption("customDateTimeFormatString", formatString);
        });

        return this.$widget;
    }

    async optionsLoaded(options: OptionMap) { // Use the imported OptionMap type
        const currentFormat = options.customDateTimeFormatString || "";

        if (this.$formatInput) {
            this.$formatInput.val(currentFormat);
        } else {
            // Fallback logic as before, ensure $widget is available if $formatInput isn't yet
            console.warn(
                "TriliumNext DateTimeFormatOptions: $formatInput not initialized when optionsLoaded was called. Attempting to find again."
            );
            const inputField = this.$widget?.find( // Optional chaining for $widget
                "input.custom-datetime-format-input"
            ) as JQuery<HTMLInputElement> | undefined; // Result could be undefined

            if (inputField?.length) { // Optional chaining and check length
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
