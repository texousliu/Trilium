import { DatabaseCheckIntegrityResponse } from "@triliumnext/commons";
import { t } from "../../../services/i18n";
import server from "../../../services/server";
import toast from "../../../services/toast";
import Button from "../../react/Button";
import FormText from "../../react/FormText";
import OptionsSection from "./components/OptionsSection"

export default function AdvancedSettings() {
    return <>
        <AdvancedSyncOptions />
        <DatabaseIntegrityOptions />
        <VacuumDatabaseOptions />
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

function DatabaseIntegrityOptions() {
    return (
        <OptionsSection title={t("database_integrity_check.title")}>
            <FormText>{t("database_integrity_check.description")}</FormText>
            
            <Button
                text={t("database_integrity_check.check_button")}
                onClick={async () => {
                    toast.showMessage(t("database_integrity_check.checking_integrity"));
                    
                    const { results } = await server.get<DatabaseCheckIntegrityResponse>("database/check-integrity");
        
                    if (results.length === 1 && results[0].integrity_check === "ok") {
                        toast.showMessage(t("database_integrity_check.integrity_check_succeeded"));
                    } else {
                        toast.showMessage(t("database_integrity_check.integrity_check_failed", { results: JSON.stringify(results, null, 2) }), 15000);
                    }
                }}
            />

            <Button
                text={t("consistency_checks.find_and_fix_button")}
                onClick={async () => {
                    toast.showMessage(t("consistency_checks.finding_and_fixing_message"));
                    await server.post("database/find-and-fix-consistency-issues");
                    toast.showMessage(t("consistency_checks.issues_fixed_message"));
                }}
            />
        </OptionsSection>
    )
}

function VacuumDatabaseOptions() {
    return (
        <OptionsSection title={t("vacuum_database.title")}>
            <FormText>{t("vacuum_database.description")}</FormText>

            <Button
                text={t("vacuum_database.button_text")}
                onClick={async () => {
                    toast.showMessage(t("vacuum_database.vacuuming_database"));
                    await server.post("database/vacuum-database");
                    toast.showMessage(t("vacuum_database.database_vacuumed"));
                }}
            />
        </OptionsSection>
    )
}