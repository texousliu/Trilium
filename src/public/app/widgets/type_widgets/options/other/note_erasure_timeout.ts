import OptionsWidget from "../options_widget.js";
import server from "../../../../services/server.js";
import toastService from "../../../../services/toast.js";
import { t } from "../../../../services/i18n.js";
import type { OptionMap } from "../../../../../../services/options_interface.js";

const TPL = `
<div class="options-section">
    <h4>${t("note_erasure_timeout.note_erasure_timeout_title")}</h4>

    <p>${t("note_erasure_timeout.note_erasure_description")}</p>

    <div class="form-group">
        <label for="erase-entities-after-time">${t("note_erasure_timeout.erase_notes_after_x_seconds")}</label>
        <div class="d-flex gap-2">
            <input id="erase-entities-after-time" class="form-control options-number-input" type="number" min="0" steps="1" required>
            <!-- TriliumNextTODO: i18n the strings when refactoring this to a standalone widget -->
            <select id="erase-entities-after-time-scale" class="form-select" required>
                <option value="1">Seconds</option>
                <option value="60">Minutes</option>
                <option value="3600">Hours</option>
                <option value="86400">Days</option>
            </select>
        </div>
    </div>

    <p>${t("note_erasure_timeout.manual_erasing_description")}</p>

    <button id="erase-deleted-notes-now-button" class="btn btn-secondary">${t("note_erasure_timeout.erase_deleted_notes_now")}</button>
</div>`;

export default class NoteErasureTimeoutOptions extends OptionsWidget {

    private $eraseEntitiesAfterTime!: JQuery<HTMLInputElement>;
    private $eraseEntitiesAfterTimeScale!: JQuery<HTMLSelectElement>;
    private $eraseDeletedNotesButton!: JQuery<HTMLButtonElement>;
    private eraseEntitiesAfterTimeInSeconds!: string | number;

    doRender() {
        this.$widget = $(TPL);
        this.$eraseEntitiesAfterTime = this.$widget.find("#erase-entities-after-time");
        this.$eraseEntitiesAfterTimeScale = this.$widget.find("#erase-entities-after-time-scale");

        this.$eraseEntitiesAfterTime.on("change", () => {
            const time = this.$eraseEntitiesAfterTime.val();
            const timeScale = this.$eraseEntitiesAfterTimeScale.val();

            if (!this.handleTimeValidation() || typeof timeScale !== "string" || !time) return;

            this.eraseEntitiesAfterTimeInSeconds = this.convertTime(time, timeScale).toOption();
            this.updateOption("eraseEntitiesAfterTimeInSeconds", this.eraseEntitiesAfterTimeInSeconds);

        });

        this.$eraseEntitiesAfterTimeScale.on("change", () => {

            const timeScale = this.$eraseEntitiesAfterTimeScale.val();

            if (!this.handleTimeValidation() || typeof timeScale !== "string") return;

            //calculate the new displayed value
            const displayedTime = this.convertTime(this.eraseEntitiesAfterTimeInSeconds, timeScale).toDisplay();

            this.updateOption("eraseEntitiesAfterTimeScale", timeScale);
            this.$eraseEntitiesAfterTime.val(displayedTime).trigger("change");

        });

        this.$eraseDeletedNotesButton = this.$widget.find("#erase-deleted-notes-now-button");
        this.$eraseDeletedNotesButton.on("click", () => {
            server.post("notes/erase-deleted-notes-now").then(() => {
                toastService.showMessage(t("note_erasure_timeout.deleted_notes_erased"));
            });
        });
    }

    async optionsLoaded(options: OptionMap) {
        this.eraseEntitiesAfterTimeInSeconds = options.eraseEntitiesAfterTimeInSeconds;

        const displayedTime = this.convertTime(options.eraseEntitiesAfterTimeInSeconds, options.eraseEntitiesAfterTimeScale).toDisplay();
        this.$eraseEntitiesAfterTime.val(displayedTime);
        this.$eraseEntitiesAfterTimeScale.val(options.eraseEntitiesAfterTimeScale);
    }


    convertTime(time: string | number, timeScale: string | number) {

        const value = typeof time === "number" ? time : parseInt(time);
        if (Number.isNaN(value)) {
          throw new Error(`Time needs to be a valid integer, but received: ${time}`);
        }

        const operand = typeof timeScale === "number" ? timeScale : parseInt(timeScale);
        if (Number.isNaN(operand) || operand < 1) {
            throw new Error(`TimeScale needs to be a valid integer >= 1, but received: ${timeScale}`);
        }

        return {
            toOption: () => Math.ceil(value * operand),
            toDisplay: () => Math.ceil(value / operand),
        }

    }

    handleTimeValidation() {
        if (this.$eraseEntitiesAfterTime.is(":invalid")) {
            // TriliumNextTODO: i18n
            toastService.showMessage("The entered time value is not a valid number.");
            return false
        }
        return true;
    }

}
