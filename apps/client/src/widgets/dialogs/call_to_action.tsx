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

function CallToActionDialogComponent() {
    const CallToAction: CallToAction = {
        title: "Background effects are now stable",
        message: "On Windows devices, background effects are now fully stable. The background effects adds a touch of color to the user interface by blurring the background behind it. This technique is also used in other applications such as Windows Explorer.",
        buttons: [
            { text: "Enable background effects" }
        ]
    };

    return (
        <Modal
            title="New features"
            show={true}
        >
            <h4>{CallToAction.title}</h4>
            <p>{CallToAction.message}</p>

            {CallToAction.buttons.map((button) =>
                <Button text={button.text} />   
            )}
        </Modal>
    )
}

export class CallToActionDialog extends ReactBasicWidget {

    get component() {
        return <CallToActionDialogComponent /> 
    }

}