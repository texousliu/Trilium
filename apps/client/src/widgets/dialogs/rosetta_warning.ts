import BasicWidget from "../basic_widget.js";
import { Modal } from "bootstrap";
import utils from "../../services/utils.js";
import { t } from "../../services/i18n.js";

const TPL = /*html*/`
<div class="rosetta-warning-dialog modal mx-auto" tabindex="-1" role="dialog" style="z-index: 2000;">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header text-white">
                <h4 class="modal-title">
                    <i class="bx bx-error-circle"></i>
                    <span class="rosetta-warning-title"></span>
                </h4>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="alert alert-warning mb-3">
                    <strong>⚠️ <span class="rosetta-warning-performance-impact"></span></strong><br>
                    <span class="rosetta-warning-message"></span>
                </div>

                <p class="mb-3">
                    <strong>Recommendation:</strong> <span class="rosetta-warning-recommendation"></span>
                </p>

                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <button class="download-correct-version-button btn btn-primary btn-lg me-2">
                            <i class="bx bx-download"></i>
                            <span class="rosetta-warning-download-link"></span>
                        </button>
                        <button class="continue-anyway-button btn btn-secondary" data-bs-dismiss="modal">
                            <span class="rosetta-warning-continue-anyway"></span>
                        </button>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="dontShowAgain">
                        <label class="form-check-label" for="dontShowAgain">
                            <span class="rosetta-warning-dont-show-again"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`;

export default class RosettaWarningDialog extends BasicWidget {
    private modal!: Modal;
    private $downloadButton!: JQuery<HTMLElement>;
    private $continueButton!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.modal = Modal.getOrCreateInstance(this.$widget[0]);
        this.$downloadButton = this.$widget.find(".download-correct-version-button");
        this.$continueButton = this.$widget.find(".continue-anyway-button");

        // Populate text using translation keys
        this.$widget.find(".rosetta-warning-title").text(t("rosetta_warning.title"));
        this.$widget.find(".rosetta-warning-performance-impact").text(t("rosetta_warning.performance_impact"));
        this.$widget.find(".rosetta-warning-message").text(t("rosetta_warning.message"));
        this.$widget.find(".rosetta-warning-recommendation").text(t("rosetta_warning.recommendation"));
        this.$widget.find(".rosetta-warning-download-link").text(t("rosetta_warning.download_link"));
        this.$widget.find(".rosetta-warning-continue-anyway").text(t("rosetta_warning.continue_anyway"));
        this.$widget.find(".rosetta-warning-dont-show-again").text(t("rosetta_warning.dont_show_again"));

        this.$downloadButton.on("click", () => {
            // Open the releases page where users can download the correct version
            if (utils.isElectron()) {
                const { shell } = utils.dynamicRequire("electron");
                shell.openExternal("https://github.com/TriliumNext/Notes/releases/latest");
            } else {
                window.open("https://github.com/TriliumNext/Notes/releases/latest", "_blank");
            }
        });

        // Auto-focus the download button when shown
        this.$widget.on("shown.bs.modal", () => {
            this.$downloadButton.trigger("focus");
        });
    }

    showRosettaWarningEvent() {
        this.modal.show();
    }
}
