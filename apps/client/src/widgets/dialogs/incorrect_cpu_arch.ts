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
                    <span>${t("cpu_arch_warning.title")}</span>
                </h4>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="alert alert-warning mb-3">
                    <strong>⚠️ ${t("cpu_arch_warning.performance_impact")}</strong><br>
                    ${t("cpu_arch_warning.message")}
                </div>

                <p class="mb-3">
                    <strong>Recommendation:</strong> ${t("cpu_arch_warning.recommendation")}
                </p>
            </div>
            <div class="modal-footer d-flex justify-content-between align-items-center">
                <div>
                    <button class="download-correct-version-button btn btn-primary btn-lg me-2">
                        <i class="bx bx-download"></i>
                        <span>${t("cpu_arch_warning.download_link")}</span>
                    </button>

                    &nbsp;

                    <button class="continue-anyway-button btn btn-secondary" data-bs-dismiss="modal">${t("cpu_arch_warning.continue_anyway")}</button>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="dontShowAgain">
                    <label class="form-check-label" for="dontShowAgain">${t("cpu_arch_warning.dont_show_again")}</label>
                </div>
            </div>
        </div>
    </div>
</div>`;

export default class RosettaWarningDialog extends BasicWidget {
    private modal!: Modal;
    private $downloadButton!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.modal = Modal.getOrCreateInstance(this.$widget[0]);
        this.$downloadButton = this.$widget.find(".download-correct-version-button");

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

    showCpuArchWarningEvent() {
        this.modal.show();
    }
}
