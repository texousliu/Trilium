import { MenuCommandItem } from "../menus/context_menu.js";

type ListenerReturnType = void | Promise<void>;

export interface SelectMenuItemEventListener {
    selectMenuItemHandler(item: MenuCommandItem): ListenerReturnType;
}
