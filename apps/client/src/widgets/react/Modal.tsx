import { useEffect, useRef } from "preact/hooks";
import { t } from "../../services/i18n";
import { ComponentChildren } from "preact";
import type { CSSProperties } from "preact/compat";

interface ModalProps {
    className: string;
    title: string;
    size: "lg" | "sm";
    children: ComponentChildren;
    footer?: ComponentChildren;
    maxWidth?: number;
    /**
     * If set, the modal body and footer will be wrapped in a form and the submit event will call this function.
     * Especially useful for user input that can be submitted with Enter key.
     */
    onSubmit?: () => void;
    /** Called when the modal is shown. */
    onShown?: () => void;
    /** Called when the modal is hidden, either via close button, backdrop click or submit. */
    onHidden?: () => void;
    helpPageId?: string;
}

export default function Modal({ children, className, size, title, footer, onShown, onSubmit, helpPageId, maxWidth, onHidden: onHidden }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    if (onShown || onHidden) {
        useEffect(() => {
            const modalElement = modalRef.current;
            if (modalElement) {
                if (onShown) {
                    modalElement.addEventListener("shown.bs.modal", onShown);
                }
                if (onHidden) {
                    modalElement.addEventListener("hidden.bs.modal", onHidden);
                }
            }
        });
    }

    const style: CSSProperties = {};
    if (maxWidth) {
        style.maxWidth = `${maxWidth}px`;
    }

    return (
        <div className={`modal fade mx-auto ${className}`} tabIndex={-1} role="dialog" ref={modalRef}>
            <div className={`modal-dialog modal-${size}`} style={style} role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        {helpPageId && (
                            <button className="help-button" type="button" data-in-app-help={helpPageId} title={t("branch_prefix.help_on_tree_prefix")}>?</button>
                        )}
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label={t("modal.close")}></button>
                    </div>

                    {onSubmit ? (
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}>
                            <ModalInner footer={footer}>{children}</ModalInner>
                        </form>
                    ) : (
                        <ModalInner footer={footer}>
                            {children}
                        </ModalInner>
                    )}
                </div>
            </div>
        </div>
    );
}

function ModalInner({ children, footer }: Pick<ModalProps, "children" | "footer">) {
    return (
        <>
            <div className="modal-body">
                {children}
            </div>

            {footer && (
                <div className="modal-footer">
                    {footer}
                </div>
            )}
        </>
    );
}