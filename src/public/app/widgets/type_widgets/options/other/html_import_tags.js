import OptionsWidget from "../options_widget.js";
import { t } from "../../../../services/i18n.js";
import { DEFAULT_ALLOWED_TAGS } from "../../../../services/html_sanitizer.js";

const TPL = `
<div class="options-section">
    <h4>${t("import.html_import_tags.title")}</h4>
    
    <p>${t("import.html_import_tags.description")}</p>
    
        <textarea class="allowed-html-tags form-control" style="height: 150px; font-family: monospace;" 
                  placeholder="${t("import.html_import_tags.placeholder")}"></textarea>
        
        <div class="form-text">
            ${t("import.html_import_tags.help")}
        </div>
    
    <div>
        <button class="btn btn-sm btn-secondary reset-to-default">
            ${t("import.html_import_tags.reset_button")}
        </button>
    </div>
</div>`;

export default class HtmlImportTagsOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.contentSized();

        this.$allowedTags = this.$widget.find('.allowed-html-tags');
        this.$resetButton = this.$widget.find('.reset-to-default');
        
        this.$allowedTags.on('change', () => this.saveTags());
        this.$resetButton.on('click', () => this.resetToDefault());
        
        // Load initial tags
        this.refresh();
    }

    async optionsLoaded(options) {
        try {
            if (options.allowedHtmlTags) {
                const tags = JSON.parse(options.allowedHtmlTags);
                this.$allowedTags.val(tags.join(' '));
            } else {
                // If no tags are set, show the defaults
                this.$allowedTags.val(DEFAULT_ALLOWED_TAGS.join(' '));
            }
        }
        catch (e) {
            console.error('Could not load HTML tags:', e);
            // On error, show the defaults
            this.$allowedTags.val(DEFAULT_ALLOWED_TAGS.join(' '));
        }
    }

    async saveTags() {
        const tagsText = this.$allowedTags.val();
        const tags = tagsText.split(/[\n,\s]+/) // Split on newlines, commas, or spaces
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
            
        await this.updateOption('allowedHtmlTags', JSON.stringify(tags));
    }

    async resetToDefault() {
        this.$allowedTags.val(DEFAULT_ALLOWED_TAGS.join('\n')); // Use actual newline
        await this.saveTags();
    }
}
