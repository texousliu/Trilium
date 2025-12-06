import "./Toast.css";

import clsx from "clsx";
import { useEffect } from "preact/hooks";

import { removeToastFromStore, ToastOptionsWithRequiredId, toasts } from "../services/toast";
import Icon from "./react/Icon";
import { RawHtmlBlock } from "./react/RawHtml";

const DEFAULT_DELAY = 3_000;

export default function ToastContainer() {
    return (
        <div id="toast-container">
            {toasts.value.map(toast => <Toast key={toast.id} {...toast} />)}
        </div>
    )
}

function Toast({ id, title, autohide, delay, progress, message, icon }: ToastOptionsWithRequiredId) {
    // Autohide.
    useEffect(() => {
        if (!autohide || !id) return;
        const timeout = setTimeout(() => removeToastFromStore(id), delay || DEFAULT_DELAY);
        return () => clearTimeout(timeout);
    }, [ autohide, id, delay ]);

    const closeButton = <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close" />;
    const toastIcon = <Icon icon={icon} />;

    return (
        <div
            class={clsx("toast", !title && "no-title")}
            role="alert" aria-live="assertive" aria-atomic="true"
            id={`toast-${id}`}
        >
            {title ? (
                <div class="toast-header">
                    <strong class="me-auto">
                        {toastIcon}
                        <span class="toast-title">{title}</span>
                    </strong>
                    {closeButton}
                </div>
            ) : (
                <div class="toast-icon">{toastIcon}</div>
            )}

            <RawHtmlBlock className="toast-body" html={message} />

            {!title && <div class="toast-header">{closeButton}</div>}
            <div
                class="toast-progress"
                style={{ width: `${(progress ?? 0) * 100}%` }}
            />
        </div>
    )
}
