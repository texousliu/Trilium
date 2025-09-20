import FNote from "../../entities/fnote";
import { ViewScope } from "../../services/link";
import { TypedComponent } from "../../components/component";

export interface TypeWidgetProps {
    note: FNote;
    viewScope: ViewScope | undefined;
    ntxId: string | null | undefined;
    parentComponent: TypedComponent<any> | undefined;
}
