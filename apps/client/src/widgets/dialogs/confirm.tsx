import ReactBasicWidget from "../react/ReactBasicWidget";
import Modal from "../react/Modal";
import Button from "../react/Button";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import { useState } from "react";

interface ConfirmDialogProps {
    message?: string | HTMLElement;   
    callback?: ConfirmDialogCallback;
    lastElementToFocus?: HTMLElement | null;
}

function ConfirmDialogComponent({ message, callback, lastElementToFocus }: ConfirmDialogProps) {

    const [ confirmed, setConfirmed ] = useState<boolean>(false);

    return (message && 
        <Modal
            title={t("confirm.confirmation")}
            size="md"
            zIndex={2000}
            scrollable={true}
            onHidden={() => {
                callback?.({
                    confirmed,
                    isDeleteNoteChecked: false // This can be extended to include more options if needed
                });
                lastElementToFocus?.focus();
            }}
            footer={<>
                <Button text={t("confirm.cancel")} onClick={() => closeActiveDialog()} />
                <Button text={t("confirm.ok")} onClick={() => {
                    setConfirmed(true);
                    closeActiveDialog();
                }} />
            </>}
        >
            {typeof message === "string"
                ? <div>{message ?? ""}</div>
                : <div dangerouslySetInnerHTML={{ __html: message.outerHTML ?? "" }} />}
        </Modal>
    );
}

export type ConfirmDialogResult = false | ConfirmDialogOptions;
export type ConfirmDialogCallback = (val?: ConfirmDialogResult) => void;
type MessageType = string | HTMLElement | JQuery<HTMLElement>;

export interface ConfirmDialogOptions {
    confirmed: boolean;
    isDeleteNoteChecked: boolean;
}

export interface ConfirmWithMessageOptions {
    message: MessageType;
    callback: ConfirmDialogCallback;
}

export default class ConfirmDialog extends ReactBasicWidget {

    private props: ConfirmDialogProps = {};

    get component() {
        return <ConfirmDialogComponent {...this.props} />;
    }

    showConfirmDialogEvent({ message, callback }: ConfirmWithMessageOptions) {
        this.props = {
            message: (typeof message === "object" && "length" in message ? message[0] : message),
            lastElementToFocus: (document.activeElement as HTMLElement),
            callback
        };
        this.doRender();
        openDialog(this.$widget);
    }

}