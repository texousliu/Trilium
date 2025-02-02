import type FNote from "../../entities/fnote.js";
import TypeWidget from "./type_widget.js";

const TPL = `<div class="note-detail-doc note-detail-printable">
    <style>
        .note-detail-doc-content {
            padding: 15px;
        }

        .note-detail-doc-content pre {
            background-color: var(--accented-background-color);
            border: 1px solid var(--main-border-color);
            padding: 15px;
            border-radius: 5px;
        }
    </style>

    <div class="note-detail-doc-content"></div>
</div>`;

export default class DocTypeWidget extends TypeWidget {

    private $content!: JQuery<HTMLElement>;

    static getType() {
        return "doc";
    }

    doRender() {
        this.$widget = $(TPL);
        this.$content = this.$widget.find(".note-detail-doc-content");

        super.doRender();
    }

    async doRefresh(note: FNote) {
        const docName = note.getLabelValue("docName");

        if (docName) {
            // find doc based on language
            const lng = i18next.language;
            const url = `${window.glob.appPath}/doc_notes/${lng}/${docName}.html`.replaceAll(" ", "%20");
            this.$content.load(url, (response, status) => {
                // fallback to english doc if no translation available
                if (status === "error") {
                    const fallbackUrl = `${window.glob.appPath}/doc_notes/en/${docName}.html`;
                    this.$content.load(fallbackUrl, () => this.#processContent(fallbackUrl));
                    return;
                }

                this.#processContent(url);
            });
        } else {
            this.$content.empty();
        }
    }

    #processContent(url: string) {
        const dir = url.substring(0, url.lastIndexOf("/"));

        // Remove top-level heading since it's already handled by the note title
        this.$content.find("h1").remove();

        // Images are relative to the docnote but that will not work when rendered in the application since the path breaks.
        this.$content.find("img").each((i, el) => {
            const $img = $(el);
            $img.attr("src", dir + "/" + $img.attr("src"));
        });
    }

}
