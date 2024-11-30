import { t } from "../../../../services/i18n.js";
import OptionsWidget from "../options_widget.js";
import mimeTypesService from "../../../../services/mime_types.js";

const TPL = `
<div class="options-section">
    <h4>${t('code_mime_types.title')}</h4>
    
    <ul class="options-mime-types" style="list-style-type: none;"></ul>
</div>

<style>
.options-mime-types section {
    margin-bottom: 1em;
}
</style>
`;

let idCtr = 1; // global, since this can be shown in multiple dialogs

function groupMimeTypesAlphabetically(ungroupedMimeTypes) {
    const result = {};
    ungroupedMimeTypes = ungroupedMimeTypes.toSorted((a, b) => a.title > b.title);

    for (const mimeType of ungroupedMimeTypes) {
        const initial = mimeType.title.charAt(0).toUpperCase();
        if (!result[initial]) {
            result[initial] = [];
        }
        result[initial].push(mimeType);
    }
    return result;
}

export default class CodeMimeTypesOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.$mimeTypes = this.$widget.find(".options-mime-types");
    }

    async optionsLoaded(options) {
        this.$mimeTypes.empty();

        const groupedMimeTypes = groupMimeTypesAlphabetically(mimeTypesService.getMimeTypes());
        
        for (const [ initial, mimeTypes ] of Object.entries(groupedMimeTypes)) {
            const $section = $("<section>");
            $section.append($("<h5>").text(initial));            

            for (const mimeType of mimeTypes) {
                const id = "code-mime-type-" + (idCtr++);
                $section.append($("<li>")
                    .append($('<input type="checkbox" class="form-check-input">')
                        .attr("id", id)
                        .attr("data-mime-type", mimeType.mime)
                        .prop("checked", mimeType.enabled))
                    .on('change', () => this.save())
                    .append(" &nbsp; ")
                    .append($('<label>')
                        .attr("for", id)
                        .text(mimeType.title))
                );
            }

            this.$mimeTypes.append($section);
        }
    }

    async save() {
        const enabledMimeTypes = [];

        this.$mimeTypes.find("input:checked").each(
            (i, el) => enabledMimeTypes.push(this.$widget.find(el).attr("data-mime-type")));

        await this.updateOption('codeNotesMimeTypes', JSON.stringify(enabledMimeTypes));

        mimeTypesService.loadMimeTypes();
    }
}
