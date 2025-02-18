import { t } from "../../../../services/i18n.js";
import TimeSelector from "../time_selector.js";

const TPL = `
<div class="options-section">
    <h4>${t("revisions_snapshot_interval.note_revisions_snapshot_interval_title")}</h4>

    <p class="use-tn-links">${t("revisions_snapshot_interval.note_revisions_snapshot_description")}</p>
    <div id="time-selector-placeholder"></div>
</div>`;
//TriliumNextTODO: add support for setting minimum number of entered seconds -> snapshot revision should not be less than 10 seconds
export default class RevisionsSnapshotIntervalOptions extends TimeSelector {

    constructor() {
        super({
            widgetId: "revision-snapshot-time-interval",
            widgetLabelId: "revisions_snapshot_interval.snapshot_time_interval_label",
            optionValueId: "revisionSnapshotTimeInterval",
            optionTimeScaleId: "revisionSnapshotTimeIntervalTimeScale"
        });
        super.doRender();
    }

    doRender() {
        const $timeSelector = this.$widget;
        // inject TimeSelector widget template
        this.$widget = $(TPL);
        this.$widget.find("#time-selector-placeholder").replaceWith($timeSelector)
    }
}
