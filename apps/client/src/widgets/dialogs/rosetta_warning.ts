import BasicWidget from "../basic_widget.js";
import { Modal } from "bootstrap";
import utils from "../../services/utils.js";

const TPL = /*html*/`
<div class="rosetta-warning-dialog modal mx-auto" tabindex="-1" role="dialog" style="z-index: 2000;">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h4 class="modal-title">
                    <i class="bx bx-error-circle"></i>
                    Performance Warning: Running Under Rosetta 2
                </h4>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="alert alert-danger" role="alert">
                    <h5><strong>You are running the x64 version on Apple Silicon!</strong></h5>
                    <p>TriliumNext is currently running through Apple's Rosetta 2 translation layer, which causes significant performance degradation.</p>
                </div>

                <h6><strong>What does this mean?</strong></h6>
                <ul>
                    <li>The application will be <strong>much slower</strong> than native performance</li>
                    <li>Operations may take 10-15 seconds that should take 1-2 seconds</li>
                    <li>Battery life will be reduced</li>
                    <li>The application may feel unresponsive</li>
                </ul>

                <h6><strong>How to fix this:</strong></h6>
                <ol>
                    <li>Download the <strong>ARM64</strong> version of TriliumNext from the releases page</li>
                    <li>Look for a filename ending in <code>-macos-arm64.dmg</code></li>
                    <li>Uninstall the current version and install the ARM64 version</li>
                </ol>

                <div class="alert alert-info" role="alert">
                    <strong>Note:</strong> Your data will be preserved during this process.
                </div>
            </div>
            <div class="modal-footer">
                <button class="download-correct-version-button btn btn-primary btn-lg">
                    <i class="bx bx-download"></i>
                    Download ARM64 Version
                </button>
                <button class="continue-anyway-button btn btn-secondary" data-bs-dismiss="modal">
                    Continue Anyway
                </button>
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
