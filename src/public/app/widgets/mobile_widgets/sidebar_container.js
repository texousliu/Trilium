import FlexContainer from "../containers/flex_container.js";

export default class SidebarContainer extends FlexContainer {

    constructor(screenName, direction) {
        super(direction);

        this.screenName = screenName;
        this.currentTranslate = -100;
    }

    doRender() {
        super.doRender();

        this.$widget.on("click", () => {
            this.triggerCommand('setActiveScreen', {
                screen: "detail"
            });
        });

        document.addEventListener("touchstart", (e) => this.#onDragStart(e), {
            passive: false
        });
        document.addEventListener("touchmove", (e) => this.#onDragMove(e));
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

        this.isDragging = true;
        this.startX = x;

        this.sidebarContainer.style.zIndex = 1000;

        this.sidebarWrapper.style.transition = "none";

        e.preventDefault();
    }

    #onDragMove(e) {
        if (!this.isDragging) {
            return;
        }

        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaX = x - this.startX;
        const width = this.sidebarWrapper.offsetWidth;
        const translatePercentage = Math.min(0, Math.max(this.currentTranslate + (deltaX / width) * 100, -100));

        this.sidebarWrapper.style.transform = `translateX(${translatePercentage}%)`;
    }

    #onDragEnd(e) {
        if (!this.isDragging) {
            return;
        }

        const translateX = parseFloat(this.sidebarWrapper.style.transform.match(/-?\d+/)[0]);
        const isOpen = translateX > -50;
        this.sidebarWrapper.classList.toggle("show", isOpen);
        this.sidebarWrapper.style.transform = isOpen ? 'translateX(0)' : 'translateX(-100%)';
        this.currentTranslate = isOpen ? 0 : -100;

        if (!isOpen) {
            this.sidebarContainer.style.zIndex = -1000;
        }
    }

    activeScreenChangedEvent({activeScreen}) {
        if (activeScreen === this.screenName) {
            this.$widget.addClass('show');
        } else {
            this.$widget.removeClass('show');
        }
    }

}
