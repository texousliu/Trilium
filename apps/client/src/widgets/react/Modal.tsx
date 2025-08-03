import { useEffect, useRef } from "preact/hooks";
import { t } from "../../services/i18n";
import { ComponentChildren } from "preact";

interface ModalProps {
    className: string;
    title: string;
    size: "lg" | "sm";
    children: ComponentChildren;
    footer?: ComponentChildren;
    onShown?: () => void;
}

export default function Modal({ children, className, size, title, footer, onShown }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    if (onShown) {
        useEffect(() => {
            const modalElement = modalRef.current;
            if (modalElement) {
                modalElement.addEventListener("shown.bs.modal", onShown);
            }
        });
    }

    return (
        <div className={`modal fade mx-auto ${className}`} tabIndex={-1} role="dialog" ref={modalRef}>
            <div className={`modal-dialog modal-${size}`} role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label={t("modal.close")}></button>
                    </div>

                    <div className="modal-body">
                        {children}
                    </div>

                    {footer && (
                        <div className="modal-footer">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}