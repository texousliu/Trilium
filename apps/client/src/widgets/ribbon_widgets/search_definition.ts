import { t } from "../../services/i18n.js";
import server from "../../services/server.js";
import NoteContextAwareWidget from "../note_context_aware_widget.js";
import froca from "../../services/froca.js";
import ws from "../../services/ws.js";
import toastService from "../../services/toast.js";
import treeService from "../../services/tree.js";

import SearchString from "../search_options/search_string.js";
import FastSearch from "../search_options/fast_search.js";
import Ancestor from "../search_options/ancestor.js";
import IncludeArchivedNotes from "../search_options/include_archived_notes.js";
import OrderBy from "../search_options/order_by.js";
import SearchScript from "../search_options/search_script.js";
import Limit from "../search_options/limit.js";
import Debug from "../search_options/debug.js";
import appContext, { type EventData } from "../../components/app_context.js";
import bulkActionService from "../../services/bulk_action.js";
import { Dropdown } from "bootstrap";
import type FNote from "../../entities/fnote.js";
import type { AttributeType } from "../../entities/fattribute.js";
import { renderReactWidget } from "../react/react_utils.jsx";

const TPL = /*html*/`
<div class="">
    <div class="">
            <tr>
                <td>
                    <div class="dropdown" style="display: inline-block;">
                      <button class="btn btn-sm dropdown-toggle action-add-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <span class="bx bxs-zap"></span>
                        ${t("search_definition.action")}
                      </button>
                      <div class="dropdown-menu action-list"></div>
                    </div>
                </td>
            </tr>
            <tbody class="search-options"></tbody>
            <tbody class="action-options"></tbody>
            <tbody>
                <tr>
                    <td colspan="3">
                        <div style="display: flex; justify-content: space-evenly">
                            <button type="button" class="btn btn-sm save-to-note-button">
                                <span class="bx bx-save"></span>
                                ${t("search_definition.save_to_note")}
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>`;

const OPTION_CLASSES = [SearchString, SearchScript, Ancestor, FastSearch, IncludeArchivedNotes, OrderBy, Limit, Debug];

// TODO: Deduplicate with server
interface SaveSearchNoteResponse {
    notePath: string;
}

export default class SearchDefinitionWidget extends NoteContextAwareWidget {

    private $component!: JQuery<HTMLElement>;
    private $actionList!: JQuery<HTMLElement>;
    private $searchOptions!: JQuery<HTMLElement>;
    private $searchButton!: JQuery<HTMLElement>;
    private $searchAndExecuteButton!: JQuery<HTMLElement>;
    private $saveToNoteButton!: JQuery<HTMLElement>;
    private $actionOptions!: JQuery<HTMLElement>;

    get name() {
        return "searchDefinition";
    }

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();
        this.$component = this.$widget.find(".search-definition-widget");
        this.$actionList = this.$widget.find(".action-list");

        for (const actionGroup of bulkActionService.ACTION_GROUPS) {
            this.$actionList.append($('<h6 class="dropdown-header">').append(actionGroup.title));

            for (const action of actionGroup.actions) {
                this.$actionList.append($('<a class="dropdown-item" href="#">').attr("data-action-add", action.actionName).text(action.actionTitle));
            }
        }

        this.$widget.on("click", "[data-search-option-add]", async (event) => {
            const searchOptionName = $(event.target).attr("data-search-option-add");
            const clazz = OPTION_CLASSES.find((SearchOptionClass) => SearchOptionClass.optionName === searchOptionName);

            if (clazz && this.noteId) {
                await clazz.create(this.noteId);
            } else {
                logError(t("search_definition.unknown_search_option", { searchOptionName }));
            }

            this.refresh();
        });

        this.$widget.on("click", "[data-action-add]", async (event) => {
            Dropdown.getOrCreateInstance(this.$widget.find(".action-add-toggle")[0]);

            const actionName = $(event.target).attr("data-action-add");

            if (this.noteId && actionName) {
                await bulkActionService.addAction(this.noteId, actionName);
            }

            this.refresh();
        });

        this.$searchOptions = this.$widget.find(".search-options");
        this.$actionOptions = this.$widget.find(".action-options");

        this.$saveToNoteButton = this.$widget.find(".save-to-note-button");
        this.$saveToNoteButton.on("click", async () => {
            const { notePath } = await server.post<SaveSearchNoteResponse>("special-notes/save-search-note", { searchNoteId: this.noteId });

            await ws.waitForMaxKnownEntityChangeId();

            await appContext.tabManager.getActiveContext()?.setNote(notePath);
            // Note the {{- notePathTitle}} in json file is not typo, it's unescaping
            // See https://www.i18next.com/translation-function/interpolation#unescape
            toastService.showMessage(t("search_definition.search_note_saved", { notePathTitle: await treeService.getNotePathTitle(notePath) }));
        });
    }

    async refreshWithNote(note: FNote) {
        if (!this.note) {
            return;
        }

        this.$component.show();

        this.$saveToNoteButton.toggle(note.isHiddenCompletely());

        this.$searchOptions.empty();

        const actions = bulkActionService.parseActions(this.note);
        const renderedEls = actions
            .map((action) => renderReactWidget(this, action.doRender()))
            .filter((e) => e) as JQuery<HTMLElement>[];

        this.$actionOptions.empty().append(...renderedEls);
        this.$searchAndExecuteButton.css("visibility", actions.length > 0 ? "visible" : "_hidden");
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        // only refreshing deleted attrs, otherwise components update themselves
        if (loadResults.getAttributeRows().find((attrRow) => attrRow.type === "label" && attrRow.name === "action" && attrRow.isDeleted)) {
            this.refresh();
        }
    }
}
