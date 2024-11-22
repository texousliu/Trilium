import FlexContainer from "./flex_container.js";

export default class RootContainer extends FlexContainer {
    constructor() {
        super('column');

        this.id('root-widget');
        this.css('height', '100%');
    }
}
