import OptionsWidget from "../options_widget.js";
import options from "../../../../services/options.js";
import { t } from "../../../../services/i18n.js";
import type { OptionMap, OptionNames } from "../../../../../../services/options_interface.js";
import searchService from "../../../../services/search.js";

const TPL = /*html*/`
<div class="options-section">
    <h4>${t("share.title")}</h4>

    <div class="form-group">
        <label class="tn-checkbox">
            <input class="form-check-input redirect-bare-domain" type="checkbox" name="redirectBareDomain" value="true">
            ${t("share.redirect_bare_domain")}
        </label>
        <p class="form-text">${t("share.redirect_bare_domain_description")}</p>

        <div class="share-root-check mt-2 mb-2">
            <button class="btn btn-sm btn-secondary check-share-root">${t("share.check_share_root")}</button>
            <div class="share-root-status form-text mt-2"></div>
        </div>
    </div>

    <div class="form-group">
        <label class="tn-checkbox">
        <input class="form-check-input show-login-in-share-theme" type="checkbox" name="showLoginInShareTheme" value="true">
            ${t("share.show_login_link")}
        </label>
        <p class="form-text">${t("share.show_login_link_description")}</p>
    </div>

    <div class="form-group">
        <label>${t("share.share_path")}</label>
        <div>
            <input type="text" class="form-control share-path" placeholder="${t("share.share_path_placeholder")}">
        </div>
        <div class="form-text">
            ${t("share.share_path_description")}
        </div>
    </div>

    <div class="form-group">
        <label class="tn-checkbox">
            <input class="form-check-input use-clean-urls" type="checkbox" name="useCleanUrls" value="true">
            ${t("share.use_clean_urls")}
        </label>
        <p class="form-text">${t("share.use_clean_urls_description")}</p>
    </div>

</div>`;

export default class ShareSettingsOptions extends OptionsWidget {
    private $redirectBareDomain!: JQuery<HTMLInputElement>;
    private $showLoginInShareTheme!: JQuery<HTMLInputElement>;
    private $useCleanUrls!: JQuery<HTMLInputElement>;
    private $sharePath!: JQuery<HTMLInputElement>;
    private $shareRootCheck!: JQuery<HTMLElement>;
    private $shareRootStatus!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();

        this.$redirectBareDomain = this.$widget.find(".redirect-bare-domain");
        this.$showLoginInShareTheme = this.$widget.find(".show-login-in-share-theme");
        this.$useCleanUrls = this.$widget.find(".use-clean-urls");
        this.$sharePath = this.$widget.find(".share-path");
        this.$shareRootCheck = this.$widget.find(".share-root-check");
        this.$shareRootStatus = this.$widget.find(".share-root-status");
        this.$shareRootCheck.hide();

        this.$redirectBareDomain.on('change', async () => {

            const redirectBareDomain = this.$redirectBareDomain.is(":checked");
            await this.updateOption<"redirectBareDomain">("redirectBareDomain", redirectBareDomain.toString());

            // Show/hide share root status section based on redirectBareDomain checkbox
            this.$shareRootCheck.toggle(redirectBareDomain);
        });

        this.$showLoginInShareTheme.on('change', async () => {
            const showLoginInShareTheme = this.$showLoginInShareTheme.is(":checked");
            await this.updateOption<"showLoginInShareTheme">("showLoginInShareTheme", showLoginInShareTheme.toString());
        });

        this.$useCleanUrls.on('change', async () => {
            const useCleanUrls = this.$useCleanUrls.is(":checked");
            await this.updateOption<"useCleanUrls">("useCleanUrls", useCleanUrls.toString());
        });

        this.$sharePath.on('change', async () => {
            // Ensure sharePath always starts with a slash
            let sharePath = this.$sharePath.val() as string;
            if (sharePath && !sharePath.startsWith('/')) {
                sharePath = '/' + sharePath;
            }
            await this.updateOption<"sharePath">("sharePath", sharePath);
        });

        // Add click handler for check share root button
        this.$widget.find(".check-share-root").on("click", () => this.checkShareRoot());
    }

    async optionsLoaded(options: OptionMap) {
        const redirectBareDomain = options.redirectBareDomain === "true";
        this.$redirectBareDomain.prop("checked", redirectBareDomain);
        this.$shareRootCheck.toggle(redirectBareDomain);

        this.$showLoginInShareTheme.prop("checked", options.showLoginInShareTheme === "true");
        this.$useCleanUrls.prop("checked", options.useCleanUrls === "true");
        this.$sharePath.val(options.sharePath);
    }

    async checkShareRoot() {
        const $button = this.$widget.find(".check-share-root");
        $button.prop("disabled", true);

        try {
            const shareRootNotes = await searchService.searchForNotes("#shareRoot");
            const sharedShareRootNote = shareRootNotes.find((note) => note.isShared());

            if (sharedShareRootNote) {
                this.$shareRootStatus
                    .removeClass("text-danger")
                    .addClass("text-success")
                    .text(t("share.share_root_found", { noteTitle: sharedShareRootNote.title }));
            } else {
                this.$shareRootStatus
                    .removeClass("text-success")
                    .addClass("text-danger")
                    .text(shareRootNotes.length > 0 ? t("share.share_root_not_shared", { noteTitle: shareRootNotes[0].title }) : t("share.share_root_not_found"));
            }
        } finally {
            $button.prop("disabled", false);
        }
    }
}
