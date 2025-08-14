import TypeWidget from "./type_widget.js";
import AttachmentDetailWidget from "../attachment_detail.js";
import linkService from "../../services/link.js";
import utils from "../../services/utils.js";
import { t } from "../../services/i18n.js";
import type { EventData } from "../../components/app_context.js";
import galleryManager from "../../services/gallery_manager.js";
import type { GalleryItem } from "../../services/gallery_manager.js";

const TPL = /*html*/`
<div class="attachment-list note-detail-printable">
    <style>
        .attachment-list {
            padding-left: 15px;
            padding-right: 15px;
        }

        .attachment-list .links-wrapper {
            font-size: larger;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: baseline;
        }
        
        .attachment-list .gallery-toolbar {
            display: flex;
            gap: 5px;
            margin-bottom: 10px;
        }
        
        .attachment-list .gallery-toolbar button {
            padding: 5px 10px;
            font-size: 12px;
        }
        
        .attachment-list .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .attachment-list .image-grid .image-thumbnail {
            position: relative;
            width: 100%;
            padding-bottom: 100%; /* 1:1 aspect ratio */
            overflow: hidden;
            border-radius: 4px;
            cursor: pointer;
            background: var(--accented-background-color);
        }
        
        .attachment-list .image-grid .image-thumbnail img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.2s;
        }
        
        .attachment-list .image-grid .image-thumbnail:hover img {
            transform: scale(1.05);
        }
        
        .attachment-list .image-grid .image-thumbnail .overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
            color: white;
            padding: 5px;
            font-size: 11px;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .attachment-list .image-grid .image-thumbnail:hover .overlay {
            opacity: 1;
        }
    </style>

    <div class="links-wrapper"></div>
    <div class="gallery-toolbar" style="display: none;"></div>
    <div class="image-grid" style="display: none;"></div>
    <div class="attachment-list-wrapper"></div>
</div>`;

export default class AttachmentListTypeWidget extends TypeWidget {
    $list!: JQuery<HTMLElement>;
    $linksWrapper!: JQuery<HTMLElement>;
    $galleryToolbar!: JQuery<HTMLElement>;
    $imageGrid!: JQuery<HTMLElement>;
    renderedAttachmentIds!: Set<string>;
    imageAttachments: GalleryItem[] = [];
    otherAttachments: any[] = [];

    static getType() {
        return "attachmentList";
    }

    doRender() {
        this.$widget = $(TPL);
        this.$list = this.$widget.find(".attachment-list-wrapper");
        this.$linksWrapper = this.$widget.find(".links-wrapper");
        this.$galleryToolbar = this.$widget.find(".gallery-toolbar");
        this.$imageGrid = this.$widget.find(".image-grid");

        super.doRender();
    }

    async doRefresh(note: Parameters<TypeWidget["doRefresh"]>[0]) {
        const $helpButton = $(`
            <button class="attachment-help-button icon-action bx bx-help-circle"
                     type="button" data-help-page="attachments.html"
                     title="${t("attachment_list.open_help_page")}">
            </button>
        `);
        utils.initHelpButtons($helpButton);

        const noteLink = await linkService.createLink(this.noteId); // do separately to avoid race condition between empty() and .append()
        noteLink.addClass("use-tn-links");

        const $uploadButton = $(`
            <button class="btn btn-sm">
                <span class="bx bx-folder-open"></span>
                ${t("attachment_list.upload_attachments")}
            </button>
        `);

        $uploadButton.on("click", () => {
            if (this.noteId) {
                this.triggerCommand("showUploadAttachmentsDialog", { noteId: this.noteId });
            }
        })

        this.$linksWrapper.empty().append(
            $("<div>").append(t("attachment_list.owning_note"), noteLink),
            $(`<div class="attachment-actions-toolbar">`).append($uploadButton, $helpButton)
        );

        this.$list.empty();
        this.$imageGrid.empty().hide();
        this.$galleryToolbar.empty().hide();
        this.children = [];
        this.renderedAttachmentIds = new Set();
        this.imageAttachments = [];
        this.otherAttachments = [];

        const attachments = await note.getAttachments();

        if (attachments.length === 0) {
            this.$list.html('<div class="alert alert-info">' + t("attachment_list.no_attachments") + "</div>");
            return;
        }

        // Separate image and non-image attachments
        for (const attachment of attachments) {
            if (attachment.role === 'image') {
                const galleryItem: GalleryItem = {
                    src: `/api/attachments/${attachment.attachmentId}/image`,
                    alt: attachment.title,
                    title: attachment.title,
                    attachmentId: attachment.attachmentId,
                    noteId: attachment.ownerId,
                    index: this.imageAttachments.length
                };
                this.imageAttachments.push(galleryItem);
            } else {
                this.otherAttachments.push(attachment);
            }
        }

        // If we have image attachments, show gallery view
        if (this.imageAttachments.length > 0) {
            this.setupGalleryView();
        }

        // Render non-image attachments in the traditional list
        for (const attachment of this.otherAttachments) {
            const attachmentDetailWidget = new AttachmentDetailWidget(attachment, false);
            this.child(attachmentDetailWidget);
            this.renderedAttachmentIds.add(attachment.attachmentId);
            this.$list.append(attachmentDetailWidget.render());
        }
    }

    setupGalleryView() {
        // Show gallery toolbar
        this.$galleryToolbar.show();
        
        // Add gallery action buttons
        const $viewAllButton = $(`
            <button class="btn btn-sm view-gallery-btn">
                <span class="bx bx-images"></span>
                View as Gallery (${this.imageAttachments.length} images)
            </button>
        `);
        
        const $slideshowButton = $(`
            <button class="btn btn-sm slideshow-btn">
                <span class="bx bx-play-circle"></span>
                Start Slideshow
            </button>
        `);
        
        this.$galleryToolbar.append($viewAllButton, $slideshowButton);
        
        // Handle gallery view button
        $viewAllButton.on('click', () => {
            galleryManager.openGallery(this.imageAttachments, 0, {
                showThumbnails: true,
                showCounter: true,
                enableKeyboardNav: true,
                loop: true
            });
        });
        
        // Handle slideshow button
        $slideshowButton.on('click', () => {
            galleryManager.openGallery(this.imageAttachments, 0, {
                showThumbnails: false,
                autoPlay: true,
                slideInterval: 4000,
                showCounter: true,
                loop: true
            });
        });
        
        // Create image grid
        this.$imageGrid.show();
        
        this.imageAttachments.forEach((item, index) => {
            const $thumbnail = $(`
                <div class="image-thumbnail" 
                     data-index="${index}"
                     role="button"
                     tabindex="0"
                     aria-label="View ${item.alt || item.title || 'image'} in gallery">
                    <img src="${item.src}" 
                         alt="${item.alt || item.title || `Image ${index + 1}`}" 
                         loading="lazy"
                         aria-describedby="thumb-desc-${index}">
                    <div class="overlay" id="thumb-desc-${index}">${item.title || ''}</div>
                </div>
            `);
            
            // Add click handler
            $thumbnail.on('click', () => {
                galleryManager.openGallery(this.imageAttachments, index, {
                    showThumbnails: true,
                    showCounter: true,
                    enableKeyboardNav: true
                });
            });
            
            // Add keyboard support for accessibility
            $thumbnail.on('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    galleryManager.openGallery(this.imageAttachments, index, {
                        showThumbnails: true,
                        showCounter: true,
                        enableKeyboardNav: true
                    });
                }
            });
            
            this.$imageGrid.append($thumbnail);
        });
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        // updates and deletions are handled by the detail, for new attachments the whole list has to be refreshed
        const attachmentsAdded = loadResults.getAttachmentRows().some((att) => att.attachmentId && !this.renderedAttachmentIds.has(att.attachmentId));

        if (attachmentsAdded) {
            this.refresh();
        }
    }
    
    cleanup() {
        // Clean up event handlers
        if (this.$galleryToolbar) {
            this.$galleryToolbar.find('button').off();
        }
        if (this.$imageGrid) {
            this.$imageGrid.find('.image-thumbnail').off();
        }
        
        super.cleanup();
    }
}
