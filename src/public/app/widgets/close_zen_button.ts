import BasicWidget from "./basic_widget.js";

const TPL = `\
<div class="close-zen-container">
    <a class="button-widget bx icon-action bxs-yin-yang"
        data-trigger-command="toggleZenMode" />

    <style>
    .close-zen-container {
        display: none;
        --size: 32px;
        width: var(--size);
        height: var(--size);
    }

    body.zen .close-zen-container {
        display: block;
        position: fixed;
        top: 0;
        right: 0;
        z-index: 9999;
    }

    body.zen.electron:not(.native-titlebar) .close-zen-container {
        --size: 32px;
        left: calc(env(titlebar-area-width) - var(--size));
        right: unset;
    }
    </style>
</div>
`;

export default class CloseZenButton extends BasicWidget {

    doRender(): void {
        this.$widget = $(TPL);
    }

    zenChangedEvent() {
        this.toggleInt(true);
    }

}
