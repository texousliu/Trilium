import { useContext } from "preact/hooks";
import appContext, { CommandMappings } from "../../components/app_context";
import contextMenu from "../../menus/context_menu";
import branches from "../../services/branches";
import { t } from "../../services/i18n";
import note_create from "../../services/note_create";
import tree from "../../services/tree";
import ActionButton from "../react/ActionButton";
import { ParentComponent } from "../react/react_utils";
import BasicWidget from "../basic_widget";

export default function MobileDetailMenu() {
    const parentComponent = useContext(ParentComponent);

    return (
        <ActionButton
            icon="bx bx-dots-vertical-rounded"
            text=""
            onClick={(e) => {
                const note = appContext.tabManager.getActiveContextNote();

                contextMenu.show<keyof CommandMappings>({
                    x: e.pageX,
                    y: e.pageY,
                    items: [
                        { title: t("mobile_detail_menu.insert_child_note"), command: "insertChildNote", uiIcon: "bx bx-plus", enabled: note?.type !== "search" },
                        { title: t("mobile_detail_menu.delete_this_note"), command: "delete", uiIcon: "bx bx-trash", enabled: note?.noteId !== "root" },
                        { kind: "separator" },
                        { title: t("mobile_detail_menu.note_revisions"), command: "showRevisions", uiIcon: "bx bx-history" },
                        { kind: "separator" },
                        { title: t("create_pane_button.create_new_split"), command: "openNewNoteSplit", uiIcon: "bx bx-dock-right" }
                    ],
                    selectMenuItemHandler: async ({ command }) => {
                        if (command === "insertChildNote") {
                            note_create.createNote(appContext.tabManager.getActiveContextNotePath() ?? undefined);
                        } else if (command === "delete") {
                            const notePath = appContext.tabManager.getActiveContextNotePath();
                            if (!notePath) {
                                throw new Error("Cannot get note path to delete.");
                            }

                            const branchId = await tree.getBranchIdFromUrl(notePath);

                            if (!branchId) {
                                throw new Error(t("mobile_detail_menu.error_cannot_get_branch_id", { notePath }));
                            }

                            if (await branches.deleteNotes([branchId]) && parentComponent) {
                                parentComponent.triggerCommand("setActiveScreen", { screen: "tree" });
                            }
                        } else if (command && parentComponent) {
                            const ntxId = (parentComponent as BasicWidget).getClosestNtxId();
                            parentComponent.triggerCommand(command, { ntxId });
                        }
                    },
                    forcePositionOnMobile: true
                });
            }}
        />
    )
}
