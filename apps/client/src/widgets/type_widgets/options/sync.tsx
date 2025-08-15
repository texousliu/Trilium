import { useRef } from "preact/hooks";
import { t } from "../../../services/i18n";
import { openInAppHelpFromUrl } from "../../../services/utils";
import Button from "../../react/Button";
import FormGroup from "../../react/FormGroup";
import FormTextBox, { FormTextBoxWithUnit } from "../../react/FormTextBox";
import RawHtml from "../../react/RawHtml";
import OptionsSection from "./components/OptionsSection";
import { useTriliumOptions } from "../../react/hooks";

export default function SyncOptions() {
    const [ options, setOptions ] = useTriliumOptions("syncServerHost", "syncServerTimeout", "syncProxy");
    const syncServerHost = useRef(options.syncServerHost);
    const syncServerTimeout = useRef(options.syncServerTimeout);
    const syncProxy = useRef(options.syncProxy);

    return (
        <OptionsSection title={t("sync_2.config_title")}>
            <form onSubmit={(e) => {
                setOptions({
                    syncServerHost: syncServerHost.current,
                    syncServerTimeout: syncServerTimeout.current,
                    syncProxy: syncProxy.current
                });
                e.preventDefault();
            }}>
                <FormGroup label={t("sync_2.server_address")}>
                    <FormTextBox
                        name="sync-server-host"
                        placeholder="https://<host>:<port>"
                        currentValue={syncServerHost.current} onChange={(newValue) => syncServerHost.current = newValue}
                    />
                </FormGroup>

                <FormGroup label={t("sync_2.proxy_label")} description={<>
                    <strong>{t("sync_2.note")}:</strong> {t("sync_2.note_description")}<br/>
                    <RawHtml html={t("sync_2.special_value_description")} /></>}
                >
                    <FormTextBox
                        name="sync-proxy"
                        placeholder="https://<host>:<port>"
                        currentValue={syncProxy.current} onChange={(newValue) => syncProxy.current = newValue}
                    />
                </FormGroup>

                <FormGroup label={t("sync_2.timeout")}>
                    <FormTextBoxWithUnit
                        name="sync-server-timeout"
                        min={1} max={10000000} type="number"
                        unit={t("sync_2.timeout_unit")}
                        currentValue={syncServerTimeout.current} onChange={(newValue) => syncServerTimeout.current = newValue}
                    />
                </FormGroup>

                <div style={{ display: "flex", justifyContent: "spaceBetween"}}>
                    <Button text={t("sync_2.save")} primary />
                    <Button text={t("sync_2.help")} onClick={() => openInAppHelpFromUrl("cbkrhQjrkKrh")} />
                </div>
            </form>
        </OptionsSection>
    )
}
