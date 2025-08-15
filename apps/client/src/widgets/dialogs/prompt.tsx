import { useRef, useState } from "preact/hooks";
import { t } from "../../services/i18n";
import Button from "../react/Button";
import Modal from "../react/Modal";
import { Modal as BootstrapModal } from "bootstrap";
import ReactBasicWidget from "../react/ReactBasicWidget";
import FormTextBox from "../react/FormTextBox";
import FormGroup from "../react/FormGroup";
import { refToJQuerySelector } from "../react/react_utils";
import useTriliumEvent from "../react/hooks";

// JQuery here is maintained for compatibility with existing code.
interface ShownCallbackData {
    $dialog: JQuery<HTMLDivElement>;
    $question: JQuery<HTMLLabelElement> | null;
    $answer: JQuery<HTMLElement> | null;
    $form: JQuery<HTMLFormElement>;
}

export type PromptShownDialogCallback = ((callback: ShownCallbackData) => void) | null;

export interface PromptDialogOptions {
    title?: string;
    message?: string;
    defaultValue?: string;
    shown?: PromptShownDialogCallback;
    callback?: (value: string | null) => void;
}

function PromptDialogComponent() {    
    const modalRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const labelRef = useRef<HTMLLabelElement>(null);
    const answerRef = useRef<HTMLInputElement>(null);
    const [ opts, setOpts ] = useState<PromptDialogOptions>();
    const [ value, setValue ] = useState("");
    const [ shown, setShown ] = useState(false);
    
    useTriliumEvent("showPromptDialog", (opts) => {
        setOpts(opts);
        setShown(true);
        setValue(opts.defaultValue ?? "");
    })

    return (
        <Modal
            className="prompt-dialog"
            title={opts?.title ?? t("prompt.title")}
            size="lg"
            zIndex={2000}
            modalRef={modalRef} formRef={formRef}            
            onShown={() => {
                opts?.shown?.({
                    $dialog: refToJQuerySelector(modalRef),
                    $question: refToJQuerySelector(labelRef),
                    $answer: refToJQuerySelector(answerRef),
                    $form: refToJQuerySelector(formRef)
                });
                answerRef.current?.focus();
            }}
            onSubmit={() => {
                const modal = BootstrapModal.getOrCreateInstance(modalRef.current!);
                modal.hide();

                opts?.callback?.(value);
            }}
            onHidden={() => {
                opts?.callback?.(null);
                setShown(false);
            }}
            footer={<Button text={t("prompt.ok")} keyboardShortcut="Enter" primary />}
            show={shown}
            stackable
        >
            <FormGroup label={opts?.message} labelRef={labelRef}>
                <FormTextBox
                    name="prompt-dialog-answer"
                    inputRef={answerRef}
                    currentValue={value} onChange={setValue} />
            </FormGroup>
        </Modal>
    );
}

export default class PromptDialog extends ReactBasicWidget {

    get component() {
        return <PromptDialogComponent />;
    }

}
