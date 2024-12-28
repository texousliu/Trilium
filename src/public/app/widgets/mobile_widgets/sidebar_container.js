import FlexContainer from "../containers/flex_container.js";

export default class SidebarContainer extends FlexContainer {

    constructor(screenName, direction) {
        super(direction);

        this.screenName = screenName;
    }

    activeScreenChangedEvent({activeScreen}) {
        if (activeScreen === this.screenName) {
            this.$widget.addClass('show');
        } else {
            this.$widget.removeClass('show');
        }
    }

}
