import { t } from "../../../services/i18n";
import server from "../../../services/server";
import toast from "../../../services/toast";
import Button from "../../react/Button";
import OptionsSection from "./components/OptionsSection"

export default function AdvancedSettings() {
    return <>
        <AdvancedSyncOptions />
    </>;
}

function AdvancedSyncOptions() {
    return (
        <OptionsSection title={t("sync.title")}>
            <Button
                text={t("sync.force_full_sync_button")}
                onClick={async () => {
                    await server.post("sync/force-full-sync");
                    toast.showMessage(t("sync.full_sync_triggered"));
                }}
            />

            <Button
                text={t("sync.fill_entity_changes_button")}
                onClick={async () => {
                    toast.showMessage(t("sync.filling_entity_changes"));
                    await server.post("sync/fill-entity-changes");
                    toast.showMessage(t("sync.sync_rows_filled_successfully"));
                }}
            />
        </OptionsSection>
    );
}