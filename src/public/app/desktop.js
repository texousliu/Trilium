import appContext from "./components/app_context.js";
import utils from './services/utils.js';
import noteTooltipService from './services/note_tooltip.js';
import bundleService from "./services/bundle.js";
import toastService from "./services/toast.js";
import noteAutocompleteService from './services/note_autocomplete.js';
import macInit from './services/mac_init.js';
import electronContextMenu from "./menus/electron_context_menu.js";
import glob from "./services/glob.js";
import { t } from "./services/i18n.js";

await appContext.earlyInit();

bundleService.getWidgetBundlesByParent().then(async widgetBundles => {
    // A dynamic import is required for layouts since they initialize components which require translations.
    const DesktopLayout = (await import("./layouts/desktop_layout.js")).default;

    appContext.setLayout(new DesktopLayout(widgetBundles));    
    appContext.start()
        .catch((e) => {
            toastService.showPersistent({
                title: t("toast.critical-error.title"),
                icon: "alert",
                message: t("toast.critical-error.message", { message: e.message }),
            });
            console.error("Critical error occured", e);
        });
});

glob.setupGlobs();

if (utils.isElectron()) {
    initOnElectron();
}

macInit.init();

noteTooltipService.setupGlobalTooltip();

noteAutocompleteService.init();

if (utils.isElectron()) {
    electronContextMenu.setupContextMenu();
}

function initOnElectron() {
    const electron = utils.dynamicRequire('electron');
    electron.ipcRenderer.on('globalShortcut', async (event, actionName) => appContext.triggerCommand(actionName));
    
    // Update the native title bar buttons.
    applyTitleBarOverlaySettings();

    // Register for changes to the native title bar colors.
    window.matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", applyTitleBarOverlaySettings);
}

function applyTitleBarOverlaySettings() {
    const electronRemote = utils.dynamicRequire("@electron/remote");    
    const currentWindow = electronRemote.getCurrentWindow();
    const documentStyle = window.getComputedStyle(document.documentElement);
    const color = documentStyle.getPropertyValue("--native-titlebar-background");
    const symbolColor = documentStyle.getPropertyValue("--native-titlebar-foreground");
    currentWindow.setTitleBarOverlay({ color, symbolColor });
}