import { t } from "i18next";
import "./FloatingButtons.css";
import Button from "./react/Button";

/*
 * Note:
 *
 * For floating button widgets that require content to overflow, the has-overflow CSS class should
 * be applied to the root element of the widget. Additionally, this root element may need to
 * properly handle rounded corners, as defined by the --border-radius CSS variable.
 */
export default function FloatingButtons() {
    return (
        <div className="floating-buttons no-print">
            <div className="floating-buttons-children">

            </div>

            <ShowFloatingButton />
        </div>
    )
}

/**
 * Show button that displays floating button after click on close button
 */
function ShowFloatingButton() {
    return (
        <div class="show-floating-buttons">
            <Button
                className="show-floating-buttons-button"
                icon="bx bx-chevrons-left"
                text={t("show_floating_buttons_button.button_title")}
            />
        </div>
    );
}