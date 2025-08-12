import { useEffect, useMemo, useState } from "preact/hooks";
import Button from "../react/Button";
import Modal from "../react/Modal";
import ReactBasicWidget from "../react/ReactBasicWidget";
import options from "../../services/options";
import { OptionNames } from "@triliumnext/commons";
import utils from "../../services/utils";

interface CallToAction {
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
        title: "TriliumNext theme is now stable",
        message: "For a while now, we've been working on a new theme to give the application a more modern look.",
        enabled: () => !isNextTheme(),
        buttons: [
            {
                text: "Switch to the TriliumNext theme",
                async onClick() {
                    await options.save("theme", "next");
                    await options.save("backgroundEffects", "true");
                    utils.reloadFrontendApp("call-to-action");
                }
            }
        ]
    },
    {
        title: "Background effects are now stable",
        message: "On Windows devices, background effects are now fully stable. The background effects adds a touch of color to the user interface by blurring the background behind it. This technique is also used in other applications such as Windows Explorer.",
        enabled: () => isNextTheme() && !options.is("backgroundEffects"),
        buttons: [
            {
                text: "Enable background effects",
                async onClick() {
                    await options.save("backgroundEffects", "true");
                    utils.restartDesktopApp();
                }
            }
        ]
    }
];

function CallToActionDialogComponent({ activeCallToActions }: { activeCallToActions: CallToAction[] }) {
    const [ activeIndex, setActiveIndex ] = useState(0);
    const [ shown, setShown ] = useState(true);
    const activeItem = activeCallToActions[activeIndex];

    if (!activeCallToActions.length) {
        return <></>;
    }

    function goToNext() {
        if (activeIndex + 1 < activeCallToActions.length) {
            setActiveIndex(activeIndex + 1);
        } else {
            setShown(false);
        }
    }

    return (
        <Modal
            className="call-to-action"
            size="md"
            title="New features"
            show={shown}
            onHidden={() => setShown(false)}
            footerAlignment="between"
            footer={<>
                <Button text="Dismiss" onClick={goToNext} />
                {activeItem.buttons.map((button) =>
                    <Button text={button.text} onClick={async () => {
                        await button.onClick();
                        goToNext();
                    }}/>   
                )}
            </>}
        >
            <h4>{activeItem.title}</h4>
            <p>{activeItem.message}</p>
        </Modal>
    )
}

export class CallToActionDialog extends ReactBasicWidget {

    get component() {
        const filteredCallToActions = CALL_TO_ACTIONS.filter((callToAction) => callToAction.enabled());
        return <CallToActionDialogComponent activeCallToActions={filteredCallToActions} /> 
    }

}