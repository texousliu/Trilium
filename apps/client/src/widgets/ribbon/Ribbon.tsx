import { t } from "../../services/i18n";
import "./style.css";

export default function Ribbon() {
    return (
        <div class="ribbon-container" style={{ contain: "none" }}>
            <div className="ribbon-top-row">
                <div className="ribbon-tab-container">
                    <RibbonTab
                        title={t("basic_properties.basic_properties")}
                        icon="bx bx-slider"
                    />
                </div>
                <div className="ribbon-button-container"></div>
            </div>
        
            <div className="ribbon-body-container"></div>
        </div>
    )
}

function RibbonTab({ icon, title }: { icon: string; title: string }) {
    return (
        <>
            <div className="ribbon-tab-title">
                <span
                    className={`ribbon-tab-title-icon ${icon}`}
                    title={title}
                />
                &nbsp;
                <span class="ribbon-tab-title-label">{title}</span>
            </div>

            <div class="ribbon-tab-spacer" />
        </>
    )
}