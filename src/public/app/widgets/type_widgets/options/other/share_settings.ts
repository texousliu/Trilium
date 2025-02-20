import OptionsWidget from "../options_widget.js";
import options from "../../../../services/options.js";
import { t } from "../../../../services/i18n.js";
import type { OptionMap, OptionNames } from "../../../../../../services/options_interface.js";
import searchService from "../../../../services/search.js";

const TPL = `
<div class="options-section">
    <p>${t("share.redirect_bare_domain_description")}</p>
    <label class="tn-checkbox">
        <input type="checkbox" name="redirectBareDomain">
        <span>${t("share.redirect_bare_domain")}</span>
    </label>

    <div class="share-root-check mt-2 mb-2" style="display: none;">
        <button class="btn btn-sm btn-secondary check-share-root">${t("share.check_share_root")}</button>
        <div class="share-root-status form-text mt-2"></div>
    </div>

    <label class="tn-checkbox">
        <input type="checkbox" name="showLoginInShareTheme">
        <span>${t("share.show_login_link")}</span>
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

        this.$widget.find('input[name="showLoginInShareTheme"]').prop("checked", options.showLoginInShareTheme === "true");
    }

    async checkShareRoot() {
        const $button = this.$widget.find('.check-share-root');
        $button.prop('disabled', true);
        
        try {
            const shareRootNotes = await searchService.searchForNotes("#shareRoot");
            const sharedShareRootNote = shareRootNotes.find(note => note.isShared());

            if (sharedShareRootNote) {
                this.$shareRootStatus
                    .removeClass('text-danger')
                    .addClass('text-success')
                    .text(t("share.share_root_found", {noteTitle: sharedShareRootNote.title}));
            } else {
                this.$shareRootStatus
                    .removeClass('text-success')
                    .addClass('text-danger')
                    .text(shareRootNotes.length > 0 
                        ? t("share.share_root_not_shared", {noteTitle: shareRootNotes[0].title})
                        : t("share.share_root_not_found"));
            }
        } finally {
            $button.prop('disabled', false);
        }
    }

    async save() {
        const redirectBareDomain = this.$widget.find('input[name="redirectBareDomain"]').prop("checked");
        await this.updateOption<"redirectBareDomain">("redirectBareDomain", redirectBareDomain.toString());

        const showLoginInShareTheme = this.$widget.find('input[name="showLoginInShareTheme"]').prop("checked");
        await this.updateOption<"showLoginInShareTheme">("showLoginInShareTheme", showLoginInShareTheme.toString());
    }
}
