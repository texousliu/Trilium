import FNote from "../../entities/fnote";
import { ViewScope } from "../../services/link";

export interface TypeWidgetProps {
    note: FNote;
    viewScope: ViewScope | undefined;
    ntxId: string | null | undefined;
}
