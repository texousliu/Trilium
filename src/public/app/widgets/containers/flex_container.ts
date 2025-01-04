import Container from "./container.js";

export type FlexDirection = "row" | "column";

export default class FlexContainer extends Container {

    constructor(direction: FlexDirection) {
        super();

        if (!direction || !['row', 'column'].includes(direction)) {
            throw new Error(`Direction argument given as '${direction}', use either 'row' or 'column'`);
        }

        this.attrs.style = `display: flex; flex-direction: ${direction};`;
    }
}
