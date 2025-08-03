import { JSX, render } from "preact";
import BasicWidget from "../basic_widget.js";

export default abstract class ReactBasicWidget extends BasicWidget {

    abstract get component(): JSX.Element;

    doRender() {
        const renderContainer = new DocumentFragment();
        render(this.component, renderContainer);
        this.$widget = $(renderContainer.firstChild as HTMLElement);
    }

}
