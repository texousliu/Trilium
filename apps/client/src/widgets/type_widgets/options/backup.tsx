import { BackupDatabaseNowResponse } from "@triliumnext/commons";
import { t } from "../../../services/i18n";
import server from "../../../services/server";
import toast from "../../../services/toast";
import Button from "../../react/Button";
import FormCheckbox from "../../react/FormCheckbox";
import FormGroup from "../../react/FormGroup";
import FormText from "../../react/FormText";
import { useTriliumOptionBool } from "../../react/hooks";
import OptionsSection from "./components/OptionsSection";

export default function BackupSettings() {
    return (
        <>
            <AutomaticBackup />
            <BackupNow />
        </>
    )
}

export function AutomaticBackup() {
    const [ dailyBackupEnabled, setDailyBackupEnabled ] = useTriliumOptionBool("dailyBackupEnabled");
    const [ weeklyBackupEnabled, setWeeklyBackupEnabled ] = useTriliumOptionBool("weeklyBackupEnabled");
    const [ monthlyBackupEnabled, setMonthlyBackupEnabled ] = useTriliumOptionBool("monthlyBackupEnabled");

    return (
        <OptionsSection title={t("backup.automatic_backup")}>
            <FormGroup label={t("backup.automatic_backup_description")}>
                <FormCheckbox
                    name="daily-backup-enabled"
                    label={t("backup.enable_daily_backup")}
                    currentValue={dailyBackupEnabled} onChange={setDailyBackupEnabled}
                />

                <FormCheckbox
                    name="weekly-backup-enabled"
                    label={t("backup.enable_weekly_backup")}
                    currentValue={weeklyBackupEnabled} onChange={setWeeklyBackupEnabled}
                />

                <FormCheckbox
                    name="monthly-backup-enabled"
                    label={t("backup.enable_monthly_backup")}
                    currentValue={monthlyBackupEnabled} onChange={setMonthlyBackupEnabled}
                />
            </FormGroup>

            <FormText>{t("backup.backup_recommendation")}</FormText>
        </OptionsSection>
    )
}

export function BackupNow() {
    return (
        <OptionsSection title={t("backup.backup_now")}>
            <Button
                text={t("backup.backup_database_now")}
                onClick={async () => {
                    const { backupFile } = await server.post<BackupDatabaseNowResponse>("database/backup-database");
                    toast.showMessage(t("backup.database_backed_up_to", { backupFilePath: backupFile }), 10000);
                }}
            />
        </OptionsSection>
    )
}