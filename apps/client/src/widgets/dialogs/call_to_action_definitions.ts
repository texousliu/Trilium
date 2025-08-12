import utils from "../../services/utils";
import options from "../../services/options";
import { t } from "../../services/i18n";

export interface CallToAction {
    id: string;
    title: string;
    message: string;
    enabled: () => boolean;
    buttons: {
        text: string;
        onClick: () => (void | Promise<void>);
    }[];
}

function isNextTheme() {
    return [ "next", "next-light", "next-dark" ].includes(options.get("theme"));
}

const CALL_TO_ACTIONS: CallToAction[] = [
    {
        id: "next_theme",
        title: t("call_to_action.next_theme_title"),
        message: t("call_to_action.next_theme_message"),
        enabled: () => !isNextTheme(),
        buttons: [
            {
                text: t("call_to_action.next_theme_button"),
                async onClick() {
                    await options.save("theme", "next");
                    await options.save("backgroundEffects", "true");
                    utils.reloadFrontendApp("call-to-action");
                }
            }
        ]
    },
    {
        id: "background_effects",
        title: t("call_to_action.background_effects_title"),
        message: t("call_to_action.background_effects_message"),
        enabled: () => isNextTheme() && !options.is("backgroundEffects"),
        buttons: [
            {
                text: t("call_to_action.background_effects_button"),
                async onClick() {
                    await options.save("backgroundEffects", "true");
                    utils.restartDesktopApp();
                }
            }
        ]
    }
];

export function getCallToActions() {
    return CALL_TO_ACTIONS.filter((callToAction) => callToAction.enabled());
}
