import OptionsWidget from "../options_widget.js";
import options from "../../../../services/options.js";
import { t } from "../../../../services/i18n.js";
import type { OptionMap, OptionNames } from "../../../../../../services/options_interface.js";
import searchService from "../../../../services/search.js";

const TPL = `
<div class="options-section">
    <label class="tn-checkbox">
        <input type="checkbox" name="redirectBareDomain">
        <span>${t("share.redirect_bare_domain")}</span>
    </label>
    <p class="form-text">${t("share.redirect_bare_domain_description")}</p>

    <div class="share-root-check mt-2 mb-2" style="display: none;">
        <button class="btn btn-sm btn-secondary check-share-root">${t("share.check_share_root")}</button>
        <div class="share-root-status form-text mt-2"></div>
    </div>

    <label class="tn-checkbox">
        <input type="checkbox" name="shareSubtree">
        <span>${t("share.share_subtree")}</span>
    </label>
</div>`;

export default class ShareSettingsOptions extends OptionsWidget {
    private $shareRootCheck!: JQuery<HTMLElement>;
    private $shareRootStatus!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();

        this.$shareRootCheck = this.$widget.find('.share-root-check');
        this.$shareRootStatus = this.$widget.find('.share-root-status');

        // Add change handlers for both checkboxes
        this.$widget.find('input[type="checkbox"]').on("change", (e: JQuery.ChangeEvent) => {
            this.save();
            
            // Show/hide share root status section based on redirectBareDomain checkbox
            const target = e.target as HTMLInputElement;
            if (target.name === 'redirectBareDomain') {
                this.$shareRootCheck.toggle(target.checked);
                if (target.checked) {
                    this.checkShareRoot();
                }
            }
        });

        // Add click handler for check share root button
        this.$widget.find('.check-share-root').on("click", () => this.checkShareRoot());
    }

    async optionsLoaded(options: OptionMap) {
        const redirectBareDomain = options.redirectBareDomain === "true";
        this.$widget.find('input[name="redirectBareDomain"]').prop("checked", redirectBareDomain);
        this.$shareRootCheck.toggle(redirectBareDomain);
        if (redirectBareDomain) {
            await this.checkShareRoot();
        }

        this.$widget.find('input[name="shareSubtree"]').prop("checked", options.shareSubtree === "true");
    }

    async checkShareRoot() {
        const shareRootNotes = await searchService.searchNotes("#shareRoot", {
            includeArchivedNotes: true,
            ignoreHoistedNote: true
        });

        if (shareRootNotes.length > 0) {
            this.$shareRootStatus
                .removeClass('text-danger')
                .addClass('text-success')
                .text(t("share.share_root_found", {noteTitle: shareRootNotes[0].title}));
        } else {
            this.$shareRootStatus
                .removeClass('text-success')
                .addClass('text-danger')
                .text(t("share.share_root_not_found"));
        }
    }

    async save() {
        const redirectBareDomain = this.$widget.find('input[name="redirectBareDomain"]').prop("checked");
        await this.updateOption<"redirectBareDomain">("redirectBareDomain", redirectBareDomain.toString());

        const showLoginInShareTheme = this.$widget.find('input[name="shareSubtree"]').prop("checked");
        await this.updateOption<"shareSubtree">("shareSubtree", showLoginInShareTheme.toString());
    }
}
