import { signal } from "@preact/signals";

import utils from "./utils.js";

export interface ToastOptions {
    id?: string;
    icon: string;
    title?: string;
    message: string;
    delay?: number;
    autohide?: boolean;
    closeAfter?: number;
    progress?: number;
}

export type ToastOptionsWithRequiredId = Omit<ToastOptions, "id"> & Required<Pick<ToastOptions, "id">>;

function showPersistent(options: ToastOptionsWithRequiredId) {
    const existingToast = toasts.value.find(toast => toast.id === options.id);
    if (existingToast) {
        updateToast(options.id, options);
    } else {
        options.autohide = false;
        addToast(options);
    }
}

function closePersistent(id: string) {
    removeToastFromStore(id);
}

function showMessage(message: string, delay = 2000, icon = "check") {
    console.debug(utils.now(), "message:", message);

    addToast({
        icon,
        message,
        autohide: true,
        delay
    });
}

export function showError(message: string, delay = 10000) {
    console.log(utils.now(), "error: ", message);

    addToast({
        icon: "bx bx-error-circle",
        message,
        autohide: true,
        delay
    })
}

function showErrorTitleAndMessage(title: string, message: string, delay = 10000) {
    console.log(utils.now(), "error: ", message);

    addToast({
        title,
        icon: "bx bx-error-circle",
        message,
        autohide: true,
        delay
    });
}

//#region Toast store
export const toasts = signal<ToastOptionsWithRequiredId[]>([]);

function addToast(opts: ToastOptions) {
    const id = opts.id ?? crypto.randomUUID();
    const toast = { ...opts, id };
    toasts.value = [ ...toasts.value, toast ];
    return id;
}

function updateToast(id: string, partial: Partial<ToastOptions>) {
    toasts.value = toasts.value.map(toast => {
        if (toast.id === id) {
            return { ...toast, ...partial }
        }
        return toast;
    })
}

export function removeToastFromStore(id: string) {
    toasts.value = toasts.value.filter(toast => toast.id !== id);
}
//#endregion

export default {
    showMessage,
    showError,
    showErrorTitleAndMessage,
    showPersistent,
    closePersistent
};
