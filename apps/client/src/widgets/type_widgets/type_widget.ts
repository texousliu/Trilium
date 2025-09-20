import FNote from "../../entities/fnote";
import { ViewScope } from "../../services/link";
import SpacedUpdate from "../../services/spaced_update";

export interface TypeWidgetProps {
    note: FNote;
    viewScope: ViewScope | undefined;
    ntxId: string | null | undefined;
}
