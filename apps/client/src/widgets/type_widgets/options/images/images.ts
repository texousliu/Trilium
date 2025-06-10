import OptionsWidget from "../options_widget.js";
import { t } from "../../../../services/i18n.js";
import type { OptionMap } from "@triliumnext/commons";
import server from "../../../../services/server.js";
import toastService from "../../../../services/toast.js";

const TPL = /*html*/`
<div class="options-section">
    <style>
        .options-section .disabled-field {
            opacity: 0.5;
            pointer-events: none;
        }
        .batch-ocr-progress {
            margin-top: 10px;
        }
        .batch-ocr-button {
            margin-top: 10px;
        }
    </style>

    <h4>${t("images.images_section_title")}</h4>

    <label class="tn-checkbox">
        <input class="download-images-automatically" type="checkbox" name="download-images-automatically">
        ${t("images.download_images_automatically")}
    </label>

    <p class="form-text">${t("images.download_images_description")}</p>

    <hr />

    <label class="tn-checkbox">
        <input class="image-compresion-enabled" type="checkbox" name="image-compression-enabled">
        ${t("images.enable_image_compression")}
    </label>

    <div class="image-compression-enabled-wraper">
        <div class="form-group">
            <label>${t("images.max_image_dimensions")}</label>
            <label class="input-group tn-number-unit-pair">
                <input class="image-max-width-height form-control options-number-input" type="number" min="1">
                <span class="input-group-text">${t("images.max_image_dimensions_unit")}</span>
            </label>
        </div>

        <div class="form-group">
            <label>${t("images.jpeg_quality_description")}</label>
            <label class="input-group tn-number-unit-pair">
                <input class="image-jpeg-quality form-control options-number-input" min="10" max="100" type="number">
                <span class="input-group-text">%</span>
            </label>
        </div>
    </div>

    <hr />

    <h5>${t("images.ocr_section_title")}</h5>

    <label class="tn-checkbox">
        <input class="ocr-enabled" type="checkbox" name="ocr-enabled">
        ${t("images.enable_ocr")}
    </label>

    <p class="form-text">${t("images.ocr_description")}</p>

    <div class="ocr-settings-wrapper">
        <label class="tn-checkbox">
            <input class="ocr-auto-process" type="checkbox" name="ocr-auto-process">
            ${t("images.ocr_auto_process")}
        </label>

        <div class="form-group">
            <label>${t("images.ocr_language")}</label>
            <select class="ocr-language form-control">
                <option value="eng">English</option>
                <option value="spa">Spanish</option>
                <option value="fra">French</option>
                <option value="deu">German</option>
                <option value="ita">Italian</option>
                <option value="por">Portuguese</option>
                <option value="rus">Russian</option>
                <option value="chi_sim">Chinese (Simplified)</option>
                <option value="chi_tra">Chinese (Traditional)</option>
                <option value="jpn">Japanese</option>
                <option value="kor">Korean</option>
                <option value="ara">Arabic</option>
                <option value="hin">Hindi</option>
                <option value="tha">Thai</option>
                <option value="vie">Vietnamese</option>
            </select>
        </div>

        <div class="form-group">
            <label>${t("images.ocr_min_confidence")}</label>
            <label class="input-group tn-number-unit-pair">
                <input class="ocr-min-confidence form-control options-number-input" type="number" min="0" max="1" step="0.1">
                <span class="input-group-text">${t("images.ocr_confidence_unit")}</span>
            </label>
            <div class="form-text">${t("images.ocr_confidence_description")}</div>
        </div>

        <div class="batch-ocr-section">
            <h6>${t("images.batch_ocr_title")}</h6>
            <p class="form-text">${t("images.batch_ocr_description")}</p>

            <button class="btn btn-primary batch-ocr-button">
                ${t("images.batch_ocr_start")}
            </button>

            <div class="batch-ocr-progress" style="display: none;">
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                </div>
                <div class="batch-ocr-status"></div>
            </div>
        </div>
    </div>
</div>
`;

export default class ImageOptions extends OptionsWidget {

    private $imageMaxWidthHeight!: JQuery<HTMLElement>;
    private $imageJpegQuality!: JQuery<HTMLElement>;
    private $downloadImagesAutomatically!: JQuery<HTMLElement>;
    private $enableImageCompression!: JQuery<HTMLElement>;
    private $imageCompressionWrapper!: JQuery<HTMLElement>;

    // OCR elements
    private $ocrEnabled!: JQuery<HTMLElement>;
    private $ocrAutoProcess!: JQuery<HTMLElement>;
    private $ocrLanguage!: JQuery<HTMLElement>;
    private $ocrMinConfidence!: JQuery<HTMLElement>;
    private $ocrSettingsWrapper!: JQuery<HTMLElement>;
    private $batchOcrButton!: JQuery<HTMLElement>;
    private $batchOcrProgress!: JQuery<HTMLElement>;
    private $batchOcrProgressBar!: JQuery<HTMLElement>;
    private $batchOcrStatus!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);

        // Image settings
        this.$imageMaxWidthHeight = this.$widget.find(".image-max-width-height");
        this.$imageJpegQuality = this.$widget.find(".image-jpeg-quality");

        this.$imageMaxWidthHeight.on("change", () => this.updateOption("imageMaxWidthHeight", this.$imageMaxWidthHeight.val()));

        this.$imageJpegQuality.on("change", () => this.updateOption("imageJpegQuality", String(this.$imageJpegQuality.val()).trim() || "75"));

        this.$downloadImagesAutomatically = this.$widget.find(".download-images-automatically");

        this.$downloadImagesAutomatically.on("change", () => this.updateCheckboxOption("downloadImagesAutomatically", this.$downloadImagesAutomatically));

        this.$enableImageCompression = this.$widget.find(".image-compresion-enabled");
        this.$imageCompressionWrapper = this.$widget.find(".image-compression-enabled-wraper");

        this.$enableImageCompression.on("change", () => {
            this.updateCheckboxOption("compressImages", this.$enableImageCompression);
            this.setImageCompression();
        });

        // OCR settings
        this.$ocrEnabled = this.$widget.find(".ocr-enabled");
        this.$ocrAutoProcess = this.$widget.find(".ocr-auto-process");
        this.$ocrLanguage = this.$widget.find(".ocr-language");
        this.$ocrMinConfidence = this.$widget.find(".ocr-min-confidence");
        this.$ocrSettingsWrapper = this.$widget.find(".ocr-settings-wrapper");
        this.$batchOcrButton = this.$widget.find(".batch-ocr-button");
        this.$batchOcrProgress = this.$widget.find(".batch-ocr-progress");
        this.$batchOcrProgressBar = this.$widget.find(".progress-bar");
        this.$batchOcrStatus = this.$widget.find(".batch-ocr-status");

        this.$ocrEnabled.on("change", () => {
            this.updateCheckboxOption("ocrEnabled", this.$ocrEnabled);
            this.setOcrVisibility();
        });

        this.$ocrAutoProcess.on("change", () => this.updateCheckboxOption("ocrAutoProcessImages", this.$ocrAutoProcess));

        this.$ocrLanguage.on("change", () => this.updateOption("ocrLanguage", this.$ocrLanguage.val()));

        this.$ocrMinConfidence.on("change", () => this.updateOption("ocrMinConfidence", String(this.$ocrMinConfidence.val()).trim() || "0.6"));

        this.$batchOcrButton.on("click", () => this.startBatchOcr());
    }

    optionsLoaded(options: OptionMap) {
        // Image settings
        this.$imageMaxWidthHeight.val(options.imageMaxWidthHeight);
        this.$imageJpegQuality.val(options.imageJpegQuality);

        this.setCheckboxState(this.$downloadImagesAutomatically, options.downloadImagesAutomatically);
        this.setCheckboxState(this.$enableImageCompression, options.compressImages);

        // OCR settings
        this.setCheckboxState(this.$ocrEnabled, options.ocrEnabled);
        this.setCheckboxState(this.$ocrAutoProcess, options.ocrAutoProcessImages);
        this.$ocrLanguage.val(options.ocrLanguage || "eng");
        this.$ocrMinConfidence.val(options.ocrMinConfidence || "0.6");

        this.setImageCompression();
        this.setOcrVisibility();
    }

    setImageCompression() {
        if (this.$enableImageCompression.prop("checked")) {
            this.$imageCompressionWrapper.removeClass("disabled-field");
        } else {
            this.$imageCompressionWrapper.addClass("disabled-field");
        }
    }

    setOcrVisibility() {
        if (this.$ocrEnabled.prop("checked")) {
            this.$ocrSettingsWrapper.removeClass("disabled-field");
        } else {
            this.$ocrSettingsWrapper.addClass("disabled-field");
        }
    }

    async startBatchOcr() {
        this.$batchOcrButton.prop("disabled", true);
        this.$batchOcrProgress.show();
        this.$batchOcrProgressBar.css("width", "0%");
        this.$batchOcrStatus.text(t("images.batch_ocr_starting"));

        try {
            const result = await server.post("ocr/batch-process") as {
                success: boolean;
                message?: string;
            };

            if (result.success) {
                this.pollBatchOcrProgress();
            } else {
                throw new Error(result.message || "Failed to start batch OCR");
            }
        } catch (error: any) {
            console.error("Error starting batch OCR:", error);
            this.$batchOcrStatus.text(t("images.batch_ocr_error", { error: error.message }));
            toastService.showError(`Failed to start batch OCR: ${error.message}`);
            this.$batchOcrButton.prop("disabled", false);
        }
    }

    async pollBatchOcrProgress() {
        try {
            const result = await server.get("ocr/batch-progress") as {
                inProgress: boolean;
                total: number;
                processed: number;
            };

            if (result.inProgress) {
                const progress = (result.processed / result.total) * 100;
                this.$batchOcrProgressBar.css("width", `${progress}%`);
                this.$batchOcrStatus.text(t("images.batch_ocr_progress", {
                    processed: result.processed,
                    total: result.total
                }));

                // Continue polling
                setTimeout(() => this.pollBatchOcrProgress(), 1000);
            } else {
                // Batch OCR completed
                this.$batchOcrProgressBar.css("width", "100%");
                this.$batchOcrStatus.text(t("images.batch_ocr_completed", {
                    processed: result.processed,
                    total: result.total
                }));
                this.$batchOcrButton.prop("disabled", false);
                toastService.showMessage(t("images.batch_ocr_completed", {
                    processed: result.processed,
                    total: result.total
                }));

                // Hide progress after 3 seconds
                setTimeout(() => {
                    this.$batchOcrProgress.hide();
                }, 3000);
            }
        } catch (error: any) {
            console.error("Error polling batch OCR progress:", error);
            this.$batchOcrStatus.text(t("images.batch_ocr_error", { error: error.message }));
            toastService.showError(`Failed to get batch OCR progress: ${error.message}`);
            this.$batchOcrButton.prop("disabled", false);
        }
    }
}
