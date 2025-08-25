import { JSX } from "preact";
import BasicWidget from "../basic_widget.js";
import { renderReactWidget } from "./react_utils.jsx";
export default abstract class ReactBasicWidget extends BasicWidget {

    abstract get component(): JSX.Element;

    doRender() {        
        this.$widget = renderReactWidget({
            parentComponent: this,
            noteContext: null
        }, this.component);
    }

}
