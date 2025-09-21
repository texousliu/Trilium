import { t } from "../services/i18n.js";
import utils from "../services/utils.js";
import AttachmentActionsWidget from "./buttons/attachments_actions.js";
import BasicWidget from "./basic_widget.js";
import options from "../services/options.js";
import imageService from "../services/image.js";
import linkService from "../services/link.js";
import contentRenderer from "../services/content_renderer.js";
import toastService from "../services/toast.js";
import type FAttachment from "../entities/fattachment.js";
import type { EventData } from "../components/app_context.js";

const TPL = /*html*/`
        <div class="attachment-deletion-warning alert alert-info" style="margin-top: 15px;"></div>

    </div>
</div>`;

export default class AttachmentDetailWidget extends BasicWidget {
    attachment: FAttachment;
    attachmentActionsWidget: AttachmentActionsWidget;
    isFullDetail: boolean;
    $wrapper!: JQuery<HTMLElement>;

    constructor(attachment: FAttachment, isFullDetail: boolean) {
        super();

        this.contentSized();
        this.attachment = attachment;
        this.attachmentActionsWidget = new AttachmentActionsWidget(attachment, isFullDetail);
        this.isFullDetail = isFullDetail;
        this.child(this.attachmentActionsWidget);
    }

    doRender() {
        this.$widget = $(TPL);
        this.refresh();

        super.doRender();
    }

    async refresh() {
        this.$widget.find(".attachment-detail-wrapper").empty().append($(TPL).find(".attachment-detail-wrapper").html());
        this.$wrapper = this.$widget.find(".attachment-detail-wrapper");
        this.$wrapper.addClass(this.isFullDetail ? "full-detail" : "list-view");

        const $deletionWarning = this.$wrapper.find(".attachment-deletion-warning");
        const { utcDateScheduledForErasureSince } = this.attachment;

        if (utcDateScheduledForErasureSince) {
            this.$wrapper.addClass("scheduled-for-deletion");

            const scheduledSinceTimestamp = utils.parseDate(utcDateScheduledForErasureSince)?.getTime();
            // use default value (30 days in seconds) from options_init as fallback, in case getInt returns null
            const intervalMs = options.getInt("eraseUnusedAttachmentsAfterSeconds") || 2592000 * 1000;
            const deletionTimestamp = scheduledSinceTimestamp + intervalMs;
            const willBeDeletedInMs = deletionTimestamp - Date.now();

            $deletionWarning.show();

            if (willBeDeletedInMs >= 60000) {
                $deletionWarning.text(t("attachment_detail_2.will_be_deleted_in", { time: utils.formatTimeInterval(willBeDeletedInMs) }));
            } else {
                $deletionWarning.text(t("attachment_detail_2.will_be_deleted_soon"));
            }

            $deletionWarning.append(t("attachment_detail_2.deletion_reason"));
        } else {
            this.$wrapper.removeClass("scheduled-for-deletion");
            $deletionWarning.hide();
        }

        this.$wrapper.find(".attachment-actions-container").append(this.attachmentActionsWidget.render());

        const { $renderedContent } = await );
        this.$wrapper.find(".attachment-content-wrapper").append($renderedContent);
    }

    async copyAttachmentLinkToClipboard() {
        if (this.attachment.role === "image") {
            imageService.copyImageReferenceToClipboard(this.$wrapper.find(".attachment-content-wrapper"));
        } else if (this.attachment.role === "file") {
            const $link = await linkService.createLink(this.attachment.ownerId, {
                referenceLink: true,
                viewScope: {
                    viewMode: "attachments",
                    attachmentId: this.attachment.attachmentId
                }
            });

            utils.copyHtmlToClipboard($link[0].outerHTML);

            toastService.showMessage(t("attachment_detail_2.link_copied"));
        } else {
            throw new Error(t("attachment_detail_2.unrecognized_role", { role: this.attachment.role }));
        }
    }
}
