export default function Modal({ children }) {
    return (
        <div className="modal fade mx-auto" tabIndex={-1} role="dialog">
            <div className="modal-dialog" role="document">
                <div className="modal-content">
                    {children}
                </div>
            </div>
        </div>
    );
}