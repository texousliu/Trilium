import FlexContainer from "../containers/flex_container.js";

const DRAG_STATE_NONE = 0;
const DRAG_STATE_INITIAL_DRAG = 1;
const DRAG_STATE_DRAGGING = 2;

export default class SidebarContainer extends FlexContainer {

    constructor(screenName, direction) {
        super(direction);

        this.screenName = screenName;
        this.currentTranslate = -100;
        this.dragState = DRAG_STATE_NONE;
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

    #onDragStart(e) {
        if (!this.sidebarContainer) {
            this.sidebarContainer = document.getElementById("mobile-sidebar-container");
            this.sidebarWrapper = document.getElementById("mobile-sidebar-wrapper");
        }

        const x = e.touches ? e.touches[0].clientX : e.clientX;

        if (x > 30 && this.currentTranslate === -100) {
            return;
        }

        this.startX = x;
        this.dragState = DRAG_STATE_INITIAL_DRAG;
    }

    #onDragMove(e) {
        if (this.dragState === DRAG_STATE_NONE) {
            return;
        }

        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaX = x - this.startX;
        if (this.dragState === DRAG_STATE_INITIAL_DRAG) {
            if (Math.abs(deltaX) > 5) {
                this.sidebarContainer.style.zIndex = 1000;
                this.originalTransition = this.sidebarWrapper.style.transition;
                this.sidebarWrapper.style.transition = "none";
                this.dragState = DRAG_STATE_DRAGGING;
            }
        } else if (this.dragState === DRAG_STATE_DRAGGING) {
            const width = this.sidebarWrapper.offsetWidth;
            const translatePercentage = Math.min(0, Math.max(this.currentTranslate + (deltaX / width) * 100, -100));
            this.translatePercentage = translatePercentage;
            this.sidebarWrapper.style.transform = `translateX(${translatePercentage}%)`;
        }

        e.preventDefault();
    }

    #onDragEnd(e) {
        if (this.dragState === DRAG_STATE_NONE) {
            return;
        }

        const isOpen = this.translatePercentage > -50;
        this.sidebarWrapper.classList.toggle("show", isOpen);
        this.sidebarWrapper.style.transform = isOpen ? 'translateX(0)' : 'translateX(-100%)';
        this.sidebarWrapper.style.transition = this.originalTransition;
        this.currentTranslate = isOpen ? 0 : -100;

        if (!isOpen) {
            this.sidebarContainer.style.zIndex = -1000;
        }

        this.dragState = DRAG_STATE_NONE;
    }

    activeScreenChangedEvent({activeScreen}) {
        if (activeScreen === this.screenName) {
            this.$widget.addClass('show');
        } else {
            this.$widget.removeClass('show');
        }
    }

}
