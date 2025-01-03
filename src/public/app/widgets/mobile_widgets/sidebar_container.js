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
        if (!this.backdropEl) {
            this.backdropEl = document.getElementById("mobile-sidebar-container");
            this.sidebarEl = document.getElementById("mobile-sidebar-wrapper");
        }

        const x = e.touches ? e.touches[0].clientX : e.clientX;

        if (x > 30 && this.currentTranslate === -100) {
            return;
        }

        this.startX = x;
        this.dragState = DRAG_STATE_INITIAL_DRAG;
        this.translatePercentage = 0;
    }

    #onDragMove(e) {
        if (this.dragState === DRAG_STATE_NONE) {
            return;
        }

        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaX = x - this.startX;
        if (this.dragState === DRAG_STATE_INITIAL_DRAG) {
            if (Math.abs(deltaX) > 5) {
                /* Disable the transitions since they affect performance, they are going to reenabled once drag ends. */
                this.originalSidebarTransition = this.sidebarEl.style.transition;
                this.originalBackdropTransition = this.backdropEl.style.transition;
                this.sidebarEl.style.transition = "none";
                this.backdropEl.style.transition = "none";

                this.backdropEl.style.opacity = (this.currentTranslate === -100 ? 0 : 1);
                this.backdropEl.classList.add("show");

                this.dragState = DRAG_STATE_DRAGGING;
            }
        } else if (this.dragState === DRAG_STATE_DRAGGING) {
            const width = this.sidebarEl.offsetWidth;
            const translatePercentage = Math.min(0, Math.max(this.currentTranslate + (deltaX / width) * 100, -100));
            this.translatePercentage = translatePercentage;
            this.sidebarEl.style.transform = `translateX(${translatePercentage}%)`;
            this.backdropEl.style.opacity = Math.max(0, 1 + (translatePercentage / 100));
        }

        e.preventDefault();
    }

    #onDragEnd(e) {
        if (this.dragState === DRAG_STATE_NONE) {
            return;
        }

        const isOpen = this.translatePercentage > -50;
        this.sidebarEl.classList.toggle("show", isOpen);
        this.sidebarEl.style.transform = isOpen ? 'translateX(0)' : 'translateX(-100%)';
        this.sidebarEl.style.transition = this.originalSidebarTransition;
        this.backdropEl.style.transition = this.originalBackdropTransition;
        this.currentTranslate = isOpen ? 0 : -100;

        if (!isOpen) {
            this.backdropEl.classList.remove("show");
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
