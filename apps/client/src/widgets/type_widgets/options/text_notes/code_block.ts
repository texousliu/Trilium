import type { OptionMap } from "@triliumnext/commons";
import { t } from "../../../../services/i18n.js";
import library_loader from "../../../../services/library_loader.js";
import server from "../../../../services/server.js";
import OptionsWidget from "../options_widget.js";
import { ensureMimeTypesForHighlighting } from "../../../../services/syntax_highlight.js";
import { Themes } from "@triliumnext/highlightjs";

const SAMPLE_LANGUAGE = "javascript";
const SAMPLE_CODE = `\
const n = 10;
greet(n); // Print "Hello World" for n times

/**
 * Displays a "Hello World!" message for a given amount of times, on the standard console. The "Hello World!" text will be displayed once per line.
 *
 * @param {number} times    The number of times to print the \`Hello World!\` message.
 */
function greet(times) {
  for (let i = 0; i++; i < times) {
    console.log("Hello World!");
  }
}
`;

const TPL = /*html*/`
<div class="options-section">
    <h4>${t("highlighting.title")}</h4>

    <div class="form-group row">
        <div class="col-md-6">
            <label for="highlighting-color-scheme-select">${t("highlighting.color-scheme")}</label>
            <select id="highlighting-color-scheme-select" class="theme-select form-select"></select>
        </div>

        <div class="col-md-6 side-checkbox">
            <label class="form-check tn-checkbox">
                <input type="checkbox" class="word-wrap form-check-input" />
                ${t("code_block.word_wrapping")}
            </label>
        </div>
    </div>

    <div class="note-detail-readonly-text-content ck-content code-sample-wrapper">
        <pre class="hljs"><code class="code-sample">${SAMPLE_CODE}</code></pre>
    </div>

    <style>
        .code-sample-wrapper {
            margin-top: 1em;
        }

        .code-sample-wrapper pre {
            margin-bottom: 0;
        }
    </style>
</div>
`;

/**
 * Contains appearance settings for code blocks within text notes, such as the theme for the syntax highlighter.
 */
export default class CodeBlockOptions extends OptionsWidget {

    private $themeSelect!: JQuery<HTMLElement>;
    private $wordWrap!: JQuery<HTMLElement>;
    private $sampleEl!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.$themeSelect = this.$widget.find(".theme-select");
        // Populate the list of themes.
        for (const [ id, theme ] of Object.entries(Themes)) {
            const option = $("<option>")
                .attr("value", `default:${id}`)
                .text(theme.name);
            this.$themeSelect.append(option);
        }
        this.$themeSelect.on("change", async () => {
            const newTheme = String(this.$themeSelect.val());
            library_loader.loadHighlightingTheme(newTheme);
            await server.put(`options/codeBlockTheme/${newTheme}`);
        });

        this.$wordWrap = this.$widget.find("input.word-wrap");
        this.$wordWrap.on("change", () => this.updateCheckboxOption("codeBlockWordWrap", this.$wordWrap));

        // Set up preview
        this.$sampleEl = this.$widget.find(".code-sample");
    }

    #setupPreview(shouldEnableSyntaxHighlight: boolean) {
        const text = SAMPLE_CODE;
        if (shouldEnableSyntaxHighlight) {
            import("@triliumnext/highlightjs").then(async (hljs) => {
                await ensureMimeTypesForHighlighting();
                const highlightedText = hljs.highlight(text, {
                    language: SAMPLE_LANGUAGE
                });
                if (highlightedText) {
                    this.$sampleEl.html(highlightedText.value);
                }
            });
        } else {
            this.$sampleEl.text(text);
        }
    }

    async optionsLoaded(options: OptionMap) {
        this.$themeSelect.val(options.codeBlockTheme);
        this.setCheckboxState(this.$wordWrap, options.codeBlockWordWrap);
        this.$widget.closest(".note-detail-printable").toggleClass("word-wrap", options.codeBlockWordWrap === "true");

        this.#setupPreview(options.codeBlockTheme !== "none");
    }
}
