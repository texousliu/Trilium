import type { EventData } from "../../components/app_context.js";
import type FNote from "../../entities/fnote.js";
import server from "../../services/server.js";
import toastService from "../../services/toast.js";
import { t } from "../../services/i18n.js";
import TypeWidget from "./type_widget.js";

const TPL = /*html*/`
<div class="note-detail-ocr-text note-detail-printable">
    <style>
    .note-detail-ocr-text {
        min-height: 50px;
        position: relative;
        padding: 10px;
    }

    .ocr-text-content {
        white-space: pre-wrap;
        font-family: var(--detail-text-font-family);
        font-size: var(--detail-text-font-size);
        line-height: 1.6;
        border: 1px solid var(--main-border-color);
        border-radius: 4px;
        padding: 15px;
        background-color: var(--accented-background-color);
        min-height: 100px;
    }

    .ocr-text-header {
        margin-bottom: 10px;
        padding: 8px 12px;
        background-color: var(--main-background-color);
        border: 1px solid var(--main-border-color);
        border-radius: 4px;
        font-weight: 500;
        color: var(--main-text-color);
    }

    .ocr-text-meta {
        font-size: 0.9em;
        color: var(--muted-text-color);
        margin-top: 10px;
        font-style: italic;
    }

    .ocr-text-empty {
        color: var(--muted-text-color);
        font-style: italic;
        text-align: center;
        padding: 30px;
    }

    .ocr-text-loading {
        text-align: center;
        padding: 30px;
        color: var(--muted-text-color);
    }

    .ocr-text-error {
        color: var(--error-color);
        background-color: var(--error-background-color);
        border: 1px solid var(--error-border-color);
        padding: 10px;
        border-radius: 4px;
        margin-top: 10px;
    }
    </style>

    <div class="ocr-text-header">
        <span class="bx bx-text"></span> ${t("ocr.extracted_text_title")}
    </div>

    <div class="ocr-text-content"></div>

    <div class="ocr-text-meta"></div>
</div>`;

interface OCRResponse {
    success: boolean;
    text: string;
    hasOcr: boolean;
    extractedAt: string | null;
    error?: string;
}

export default class ReadOnlyOCRTextWidget extends TypeWidget {

    private $content!: JQuery<HTMLElement>;
    private $meta!: JQuery<HTMLElement>;

    static getType() {
        return "readOnlyOCRText";
    }

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();
        this.$content = this.$widget.find(".ocr-text-content");
        this.$meta = this.$widget.find(".ocr-text-meta");

        super.doRender();
    }

    async doRefresh(note: FNote) {
        // Show loading state
        this.$content.html(`<div class="ocr-text-loading">
            <span class="bx bx-loader-alt bx-spin"></span> ${t("ocr.loading_text")}
        </div>`);
        this.$meta.empty();

        try {
            const response = await server.get<OCRResponse>(`ocr/notes/${note.noteId}/text`);

            if (!response.success) {
                this.showError(response.error || t("ocr.failed_to_load"));
                return;
            }

            if (!response.hasOcr || !response.text) {
                this.$content.html(`<div class="ocr-text-empty">
                    <span class="bx bx-info-circle"></span> ${t("ocr.no_text_available")}
                </div>`);
                this.$meta.html(t("ocr.no_text_explanation"));
                return;
            }

            // Show the OCR text
            this.$content.text(response.text);

            // Show metadata
            const extractedAt = response.extractedAt ? new Date(response.extractedAt).toLocaleString() : t("ocr.unknown_date");
            this.$meta.html(t("ocr.extracted_on", { date: extractedAt }));

        } catch (error: any) {
            console.error("Error loading OCR text:", error);
            this.showError(error.message || t("ocr.failed_to_load"));
        }
    }

    private showError(message: string) {
        this.$content.html(`<div class="ocr-text-error">
            <span class="bx bx-error"></span> ${message}
        </div>`);
        this.$meta.empty();
    }

    async executeWithContentElementEvent({ resolve, ntxId }: EventData<"executeWithContentElement">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        await this.initialized;
        resolve(this.$content);
    }
}
