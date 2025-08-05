import { useEffect, useRef } from "preact/hooks";
import { t } from "../../services/i18n";
import { ComponentChildren } from "preact";
import type { CSSProperties } from "preact/compat";

interface ModalProps {
    className: string;
    title: string | ComponentChildren;
    size: "lg" | "md" | "sm";
    children: ComponentChildren;
    footer?: ComponentChildren;
    footerAlignment?: "right" | "between";
    maxWidth?: number;
    zIndex?: number;
    /**
     * If true, the modal body will be scrollable if the content overflows.
     * This is useful for larger modals where you want to keep the header and footer visible
     * while allowing the body content to scroll.
     * Defaults to false.
     */
    scrollable?: boolean;
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

export default function Modal({ children, className, size, title, footer, footerAlignment, onShown, onSubmit, helpPageId, maxWidth, zIndex, scrollable, onHidden: onHidden }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    if (onShown || onHidden) {
        useEffect(() => {
            const modalElement = modalRef.current;
            if (!modalElement) {
                return;
            }
            if (onShown) {
                modalElement.addEventListener("shown.bs.modal", onShown);
            }
            if (onHidden) {
                modalElement.addEventListener("hidden.bs.modal", onHidden);
            }
            return () => {
                if (onShown) {
                    modalElement.removeEventListener("shown.bs.modal", onShown);
                }
                if (onHidden) {
                    modalElement.removeEventListener("hidden.bs.modal", onHidden);
                }
            };
        });
    }    

    const dialogStyle: CSSProperties = {};
    if (zIndex) {
        dialogStyle.zIndex = zIndex;
    }

    const documentStyle: CSSProperties = {};
    if (maxWidth) {
        documentStyle.maxWidth = `${maxWidth}px`;
    }

    return (
        <div className={`modal fade mx-auto ${className}`} tabIndex={-1} style={dialogStyle} role="dialog" ref={modalRef}>
            <div className={`modal-dialog modal-${size} ${scrollable ? "modal-dialog-scrollable" : ""}`} style={documentStyle} role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        {!title || typeof title === "string" ? (
                            <h5 className="modal-title">{title ?? <>&nbsp;</>}</h5>
                        ) : (
                            title
                        )}
                        {helpPageId && (
                            <button className="help-button" type="button" data-in-app-help={helpPageId} title={t("modal.help_title")}>?</button>
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

function ModalInner({ children, footer, footerAlignment }: Pick<ModalProps, "children" | "footer" | "footerAlignment">) {
    const footerStyle: CSSProperties = {};
    if (footerAlignment === "between") {
        footerStyle.justifyContent = "space-between";
    }

    return (
        <>
            <div className="modal-body">
                {children}
            </div>

            {footer && (
                <div className="modal-footer" style={footerStyle}>
                    {footer}
                </div>
            )}
        </>
    );
}