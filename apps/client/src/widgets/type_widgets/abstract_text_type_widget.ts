import TypeWidget from "./type_widget.js";
import appContext, { type EventData } from "../../components/app_context.js";
import froca from "../../services/froca.js";
import linkService from "../../services/link.js";
import contentRenderer from "../../services/content_renderer.js";
import utils from "../../services/utils.js";
import options from "../../services/options.js";
import attributes from "../../services/attributes.js";
import ckeditorPhotoswipeIntegration from "../../services/ckeditor_photoswipe_integration.js";

export default class AbstractTextTypeWidget extends TypeWidget {
    doRender() {
        super.doRender();
        this.refreshCodeBlockOptions();
    }

    setupImageOpening(singleClickOpens: boolean) {
        this.$widget.on("dblclick", "img", (e) => this.openImageInCurrentTab($(e.target)));

        this.$widget.on("click", "img", (e) => {
            e.stopPropagation();
            const isLeftClick = e.which === 1;
            const isMiddleClick = e.which === 2;
            const ctrlKey = utils.isCtrlKey(e);
            const activate = (isLeftClick && ctrlKey && e.shiftKey) || (isMiddleClick && e.shiftKey);

            if ((isLeftClick && ctrlKey) || isMiddleClick) {
                this.openImageInNewTab($(e.target), activate);
            } else if (isLeftClick && singleClickOpens) {
                this.openImageInCurrentTab($(e.target));
            }
        });
    }

    async openImageInCurrentTab($img: JQuery<HTMLElement>) {
        const parsedImage  = await this.parseFromImage($img);

        if (parsedImage) {
            // Check if this is an attachment image and PhotoSwipe is available
            if (parsedImage.viewScope?.attachmentId) {
                // Instead of navigating to attachment detail, trigger PhotoSwipe
                // Check if the image is already processed by PhotoSwipe
                const imgElement = $img[0] as HTMLImageElement;
                
                // Check if PhotoSwipe is integrated with this image using multiple reliable indicators
                const hasPhotoSwipe = imgElement.classList.contains('photoswipe-enabled') || 
                                      imgElement.hasAttribute('data-photoswipe') ||
                                      imgElement.style.cursor === 'zoom-in';
                
                if (hasPhotoSwipe) {
                    // Image has PhotoSwipe integration, trigger click to open lightbox
                    $img.trigger('click');
                    return;
                }
                
                // Otherwise, fall back to opening attachment detail (but with improved navigation)
                appContext.tabManager.getActiveContext()?.setNote(parsedImage.noteId, { viewScope: parsedImage.viewScope });
            } else {
                // Regular note image, navigate normally
                appContext.tabManager.getActiveContext()?.setNote(parsedImage.noteId, { viewScope: parsedImage.viewScope });
            }
        } else {
            window.open($img.prop("src"), "_blank");
        }
    }

    async openImageInNewTab($img: JQuery<HTMLElement>, activate: boolean = false) {
        const parsedImage = await this.parseFromImage($img);

        if (parsedImage) {
            appContext.tabManager.openTabWithNoteWithHoisting(parsedImage.noteId, { activate, viewScope: parsedImage.viewScope });
        } else {
            window.open($img.prop("src"), "_blank");
        }
    }

    async parseFromImage($img: JQuery<HTMLElement>) {
        const imgSrc = $img.prop("src");

        const imageNoteMatch = imgSrc.match(/\/api\/images\/([A-Za-z0-9_]+)\//);
        if (imageNoteMatch) {
            return {
                noteId: imageNoteMatch[1],
                viewScope: {}
            };
        }

        const attachmentMatch = imgSrc.match(/\/api\/attachments\/([A-Za-z0-9_]+)\/image\//);
        if (attachmentMatch) {
            const attachmentId = attachmentMatch[1];
            const attachment = await froca.getAttachment(attachmentId);

            return {
                noteId: attachment?.ownerId,
                viewScope: {
                    viewMode: "attachments",
                    attachmentId: attachmentId
                }
            };
        }

        return null;
    }

    async loadIncludedNote(noteId: string, $el: JQuery<HTMLElement>) {
        const note = await froca.getNote(noteId);

        if (note) {
            const $wrapper = $('<div class="include-note-wrapper">');

            const $link = await linkService.createLink(note.noteId, {
                showTooltip: false
            });

            $wrapper.empty().append($('<h4 class="include-note-title">').append($link));

            const { $renderedContent, type } = await contentRenderer.getRenderedContent(note);

            $wrapper.append($(`<div class="include-note-content type-${type}">`).append($renderedContent));

            $el.empty().append($wrapper);
        }
    }

    async loadReferenceLinkTitle($el: JQuery<HTMLElement>, href: string | null = null) {
        await linkService.loadReferenceLinkTitle($el, href);
    }

    refreshIncludedNote($container: JQuery<HTMLElement>, noteId: string) {
        if ($container) {
            $container.find(`section[data-note-id="${noteId}"]`).each((_, el) => {
                this.loadIncludedNote(noteId, $(el));
            });
        }
    }

    refreshCodeBlockOptions() {
        const wordWrap = options.is("codeBlockWordWrap");
        this.$widget.toggleClass("word-wrap", wordWrap);
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isOptionReloaded("codeBlockWordWrap")) {
            this.refreshCodeBlockOptions();
        }

        if (loadResults.getAttributeRows().find((attr) =>
            attr.type === "label" &&
            attr.name === "language" &&
            attributes.isAffecting(attr, this.note)))
        {
            await this.onLanguageChanged();
        }
    }

    async onLanguageChanged() { }

}
