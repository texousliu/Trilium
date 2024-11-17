import OptionsWidget from "../options_widget.js";
import { t } from "../../../../services/i18n.js";

const TPL = `
<div class="options-section">
    <h4>${t("options.html_import_tags.title")}</h4>
    
    <p class="form-text">${t("options.html_import_tags.description")}</p>
    
    <div class="mb-3">
        <textarea class="allowed-html-tags form-control" style="height: 150px; font-family: monospace;" 
                  placeholder="${t("options.html_import_tags.placeholder")}"></textarea>
        
        <div class="form-text">
            ${t("options.html_import_tags.help")}
        </div>
    </div>
    
    <div>
        <button class="btn btn-sm btn-secondary reset-to-default">
            ${t("options.html_import_tags.reset_button")}
        </button>
    </div>
</div>`;

export default class HtmlImportTagsOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.contentSized();

        this.$allowedTags = this.$widget.find('.allowed-html-tags');
        this.$resetButton = this.$widget.find('.reset-to-default');
        
        this.loadTags();
        
        this.$allowedTags.on('change', () => this.saveTags());
        this.$resetButton.on('click', () => this.resetToDefault());
    }
    
    loadTags() {
        try {
            const tags = JSON.parse(this.getOption('allowedHtmlTags'));
            this.$allowedTags.val(tags.join('\\n'));
        }
        catch (e) {
            console.error('Could not load HTML tags:', e);
        }
    }
    
    async saveTags() {
        const tagsText = this.$allowedTags.val();
        const tags = tagsText.split('\\n')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
            
        await this.updateOption('allowedHtmlTags', JSON.stringify(tags));
    }
    
    resetToDefault() {
        const defaultTags = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
            'li', 'b', 'i', 'strong', 'em', 'strike', 's', 'del', 'abbr', 'code', 'hr', 'br', 'div',
            'table', 'thead', 'caption', 'tbody', 'tfoot', 'tr', 'th', 'td', 'pre', 'section', 'img',
            'figure', 'figcaption', 'span', 'label', 'input', 'details', 'summary', 'address', 'aside', 'footer',
            'header', 'hgroup', 'main', 'nav', 'dl', 'dt', 'menu', 'bdi', 'bdo', 'dfn', 'kbd', 'mark', 'q', 'time',
            'var', 'wbr', 'area', 'map', 'track', 'video', 'audio', 'picture', 'del', 'ins',
            'en-media',
            'acronym', 'article', 'big', 'button', 'cite', 'col', 'colgroup', 'data', 'dd',
            'fieldset', 'form', 'legend', 'meter', 'noscript', 'option', 'progress', 'rp',
            'samp', 'small', 'sub', 'sup', 'template', 'textarea', 'tt'
        ];
        
        this.$allowedTags.val(defaultTags.join('\\n'));
        this.saveTags();
    }
}
