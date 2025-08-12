import { useMemo, useState } from "preact/hooks";
import Button from "../react/Button";
import Modal from "../react/Modal";
import ReactBasicWidget from "../react/ReactBasicWidget";

interface CallToAction {
    title: string;
    message: string;
    buttons: {
        text: string;
    }[];
}

const CALL_TO_ACTIONS: CallToAction[] = [
    {
        title: "Background effects are now stable",
        message: "On Windows devices, background effects are now fully stable. The background effects adds a touch of color to the user interface by blurring the background behind it. This technique is also used in other applications such as Windows Explorer.",
        buttons: [
            { text: "Enable background effects" }
        ]
    },
    {
        title: "TriliumNext theme is now stable",
        message: "For a while now, we've been working on a new theme to give the application a more modern look.",
        buttons: [
            { text: "Switch to the TriliumNext theme"}
        ]
    }
];

function CallToActionDialogComponent() {
    const [ activeIndex, setActiveIndex ] = useState(0);
    const [ shown, setShown ] = useState(true);
    const activeItem = CALL_TO_ACTIONS[activeIndex];

    function goToNext() {
        if (activeIndex + 1 < CALL_TO_ACTIONS.length) {
            setActiveIndex(activeIndex + 1);
        } else {
            setShown(false);
        }
    }

    return (
        <Modal
            title="New features"
            show={shown}
            footerAlignment="between"
            footer={<>
                <Button text="Dismiss" onClick={goToNext} />
                {activeItem.buttons.map((button) =>
                    <Button text={button.text} onClick={() => {
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
        return <CallToActionDialogComponent /> 
    }

}