import FNote from "../../entities/fnote";

export interface TabContext {
    note: FNote | null | undefined;
    hidden: boolean;
    ntxId?: string | null | undefined;
}
