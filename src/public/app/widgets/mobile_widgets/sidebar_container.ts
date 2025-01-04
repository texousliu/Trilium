import { EventData } from "../../components/app_context.js";
import { Screen } from "../../components/mobile_screen_switcher.js";
import FlexContainer, { FlexDirection } from "../containers/flex_container.js";

const DRAG_STATE_NONE = 0;
const DRAG_STATE_INITIAL_DRAG = 1;
const DRAG_STATE_DRAGGING = 2;

/** Percentage of drag that the user has to do in order for the popup to open/close (0-100). */
const DRAG_THRESHOLD = 10;

export default class SidebarContainer extends FlexContainer {

    private screenName: Screen;
    private currentTranslate: number;
    private dragState: number;
    private startX?: number;
    private translatePercentage: number;
    private sidebarEl!: HTMLElement;
    private backdropEl!: HTMLElement;
    private originalSidebarTransition: string;
    private originalBackdropTransition: string;

    constructor(screenName: Screen, direction: FlexDirection) {
        super(direction);

        this.screenName = screenName;
        this.currentTranslate = -100;
        this.translatePercentage = 0;
        this.dragState = DRAG_STATE_NONE;
        this.originalSidebarTransition = "";
        this.originalBackdropTransition = "";
    }

    doRender() {
        super.doRender();

        this.$widget.on("click", () => {
            this.triggerCommand('setActiveScreen', {
                screen: "detail"
            });
        });

        document.addEventListener("touchstart", (e) => this.#onDragStart(e));
        document.addEventListener("touchmove", (e) => this.#onDragMove(e), { passive: false });
        document.addEventListener("touchend", (e) => this.#onDragEnd(e));
    }

    #onDragStart(e: TouchEvent | MouseEvent) {
        const x = "touches" in e ? e.touches[0].clientX : e.clientX;
        this.startX = x;

        if (x > 30 && this.currentTranslate === -100) {
            return;
        }

        this.#setInitialState();
        this.dragState = DRAG_STATE_INITIAL_DRAG;
        this.translatePercentage = 0;
    }

    #onDragMove(e: TouchEvent | MouseEvent) {
        if (this.dragState === DRAG_STATE_NONE || !this.startX) {
            return;
        }

        const x = "touches" in e ? e.touches[0].clientX : e.clientX;
        const deltaX = x - this.startX;
        if (this.dragState === DRAG_STATE_INITIAL_DRAG) {
            if (Math.abs(deltaX) > 10) {
                /* Disable the transitions since they affect performance, they are going to reenabled once drag ends. */
                this.sidebarEl.style.transition = "none";
                this.backdropEl.style.transition = "none";

                this.backdropEl.style.opacity = String(this.currentTranslate === -100 ? 0 : 1);
                this.backdropEl.classList.add("show");

                this.dragState = DRAG_STATE_DRAGGING;
            }
        } else if (this.dragState === DRAG_STATE_DRAGGING) {
            const width = this.sidebarEl.offsetWidth;
            const translatePercentage = Math.min(0, Math.max(this.currentTranslate + (deltaX / width) * 100, -100));
            this.translatePercentage = translatePercentage;
            this.sidebarEl.style.transform = `translateX(${translatePercentage}%)`;
            this.backdropEl.style.opacity = String(Math.max(0, 1 + (translatePercentage / 100)));
        }

        e.preventDefault();
    }

    #onDragEnd(e: TouchEvent | MouseEvent) {
        if (this.dragState === DRAG_STATE_NONE) {
            return;
        }

        if (this.dragState === DRAG_STATE_INITIAL_DRAG) {
            this.dragState = DRAG_STATE_NONE;
            return;
        }

        // If the sidebar is closed, snap the sidebar open only if the user swiped over a threshold.
        // When the sidebar is open, always close for a smooth experience.
        const isOpen = (this.currentTranslate === -100 && this.translatePercentage > -(100 - DRAG_THRESHOLD));
        const screen = (isOpen ? "tree" : "detail");
        this.triggerCommand("setActiveScreen", { screen });
    }

    #setInitialState() {
        if (this.sidebarEl) {
            // Already initialized.
            return;
        }

        const sidebarEl = document.getElementById("mobile-sidebar-wrapper");
        const backdropEl = document.getElementById("mobile-sidebar-container");

        if (!sidebarEl || !backdropEl) {
            throw new Error("Unable to find the sidebar or backdrop.");
        }

        this.sidebarEl = sidebarEl;
        this.backdropEl = backdropEl;
        this.originalSidebarTransition = this.sidebarEl.style.transition;
        this.originalBackdropTransition = this.backdropEl.style.transition;
    }

    #setSidebarOpen(isOpen: boolean) {
        if (!this.sidebarEl) {
            return;
        }

        this.sidebarEl.classList.toggle("show", isOpen);
        this.sidebarEl.style.transform = isOpen ? 'translateX(0)' : 'translateX(-100%)';
        this.sidebarEl.style.transition = this.originalSidebarTransition;

        this.backdropEl.classList.toggle("show", isOpen);
        this.backdropEl.style.transition = this.originalBackdropTransition;
        this.backdropEl.style.opacity = String(isOpen ? 1 : 0);

        this.currentTranslate = isOpen ? 0 : -100;
        this.dragState = DRAG_STATE_NONE;
    }

    activeScreenChangedEvent({activeScreen}: EventData<"activeScreenChanged">) {
        this.#setInitialState();
        this.#setSidebarOpen(activeScreen === this.screenName);
    }

}
