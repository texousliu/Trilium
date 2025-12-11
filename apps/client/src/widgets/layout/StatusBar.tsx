import Breadcrumb from "./Breadcrumb";
import "./StatusBar.css";

export default function StatusBar() {
    return (
        <div className="status-bar">
            <div className="breadcrumb-row">
                <Breadcrumb />
            </div>
        </div>
    );
}
